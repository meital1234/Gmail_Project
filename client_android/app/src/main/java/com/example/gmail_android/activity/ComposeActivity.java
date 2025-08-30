package com.example.gmail_android.activity;

import android.app.AlertDialog;
import android.os.Bundle;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.annotation.NonNull;
import com.example.gmail_android.R;
import com.example.gmail_android.interfaces.ApiClient;
import com.example.gmail_android.interfaces.MailApi;
import com.example.gmail_android.repository.MailRepository;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;


// screen used to compose a new mail (or save it as a draft).
public class ComposeActivity extends ComponentActivity {

    // default labels we don't show as selectable chips.
    private static final HashSet<String> DEFAULT_LABELS = new HashSet<>(
            Arrays.asList("inbox","sent","drafts","important","starred","spam")
    );

    private MailRepository repo;
    private MailApi api;
    private EditText etTo, etSubject, etContent;
    private TextView tvError;
    private ChipGroup chipGroup;

    // names of labels the user selected in this compose screen.
    private final HashSet<String> selectedNames = new HashSet<>();
    // all labels returned from the server.
    private List<MailApi.LabelDto> available = new ArrayList<>();
    private String editMailId = null;
    private boolean isEditingDraft = false;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_compose);

        // init repo and API singletons.
        repo = new MailRepository(getApplicationContext());
        api  = ApiClient.get(getApplicationContext()).create(MailApi.class);

        // bind views.
        etTo      = findViewById(R.id.etTo);
        etSubject = findViewById(R.id.etSubject);
        etContent = findViewById(R.id.etContent);
        tvError   = findViewById(R.id.tvError);
        chipGroup = findViewById(R.id.chipGroup);

        // Read draft id if we came from “Edit” action
        editMailId = getIntent().getStringExtra("edit_mail_id");
        if (editMailId != null) {
            // Prefill UI from Room
            repo.getMailLive(editMailId).observe(this, m -> {
                if (m == null || m.mail == null) return;
                etTo.setText(m.mail.toEmail == null ? "" : m.mail.toEmail);
                etSubject.setText(m.mail.subject == null ? "" : m.mail.subject);
                etContent.setText(m.mail.content == null ? "" : m.mail.content);
                // Pre-check non-system labels
                if (m.labels != null) {
                    for (var l : m.labels) {
                        if (l == null) continue;
                        String nm = l.name;
                        if (!DEFAULT_LABELS.contains(nm.toLowerCase())) {
                            selectedNames.add(nm);
                        }
                    }
                }
                renderChips(); // reflect preselected labels
            });
        }

        Button btnSend    = findViewById(R.id.btnSend);
        Button btnDiscard = findViewById(R.id.btnDiscard);

        btnSend.setOnClickListener(v -> handleSend(false));   // send
        btnDiscard.setOnClickListener(v -> handleSend(true)); // save draft

        // Optional: “+” to create a new custom label
        findViewById(R.id.btnAddLabel).setOnClickListener(v -> showAddLabelDialog());

        loadLabels();
    }

    // end email/save draft.
    // send email / save draft
    private void handleSend(boolean asDraft) {
        tvError.setText(""); tvError.setVisibility(TextView.GONE);

        String to  = etTo.getText().toString().trim();
        String sub = etSubject.getText().toString().trim();
        String msg = etContent.getText().toString().trim();

        // for non-draft we require a recipient
        if (!asDraft && to.isEmpty()) {
            tvError.setText(getString(R.string.recipient_required));
            tvError.setVisibility(TextView.VISIBLE);
            return;
        }

        // Build labels from user-selected chips (custom labels only)
        List<String> labels = new ArrayList<>(selectedNames);

        if (asDraft) {
            // Guarantee the "Drafts" label when saving a draft
            boolean hasDrafts = false;
            for (String s : labels) if ("drafts".equalsIgnoreCase(s)) { hasDrafts = true; break; }
            if (!hasDrafts) labels.add("Drafts");
        } else {
            // Make sure no Drafts is sent accidentally
            labels.removeIf(s -> "drafts".equalsIgnoreCase(s) || "draft".equalsIgnoreCase(s));
            // (Optional) you can add a Sent label if your server expects it:
            // labels.add("sent");
        }

        List<String> payloadLabels = labels.isEmpty() ? null : labels;

        // Callback when the send/save request completes
        Callback<MailApi.MailDto> cb;
        if (!asDraft && editMailId != null) {
            // We are SENDING an existing DRAFT:
            // 1) create a NEW "sent" message for the recipient
            // 2) on success, DELETE the original draft so it won't remain under Drafts
            cb = new Callback<MailApi.MailDto>() {
                @Override public void onResponse(@NonNull Call<MailApi.MailDto> call,
                                                 @NonNull Response<MailApi.MailDto> res) {
                    if (res.isSuccessful()) {
                        // Remove the old draft
                        repo.delete(editMailId, /*cb*/ null);
                        repo.refreshInbox(); // update UI
                        android.widget.Toast.makeText(ComposeActivity.this, R.string.sent_ok, android.widget.Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        tvError.setText(getString(R.string.send_failed, res.code()));
                        tvError.setVisibility(TextView.VISIBLE);
                    }
                }
                @Override public void onFailure(@NonNull Call<MailApi.MailDto> call, @NonNull Throwable t) {
                    tvError.setText(getString(R.string.network_error_generic));
                    tvError.setVisibility(TextView.VISIBLE);
                }
            };
        } else {
            // Saving a draft OR sending a brand-new message
            cb = new Callback<MailApi.MailDto>() {
                @Override public void onResponse(@NonNull Call<MailApi.MailDto> call,
                                                 @NonNull Response<MailApi.MailDto> res) {
                    if (res.isSuccessful()) {
                        repo.refreshInbox();
                        android.widget.Toast.makeText(ComposeActivity.this,
                                asDraft ? R.string.draft_saved : R.string.sent_ok,
                                android.widget.Toast.LENGTH_SHORT).show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        tvError.setText(getString(R.string.send_failed, res.code()));
                        tvError.setVisibility(TextView.VISIBLE);
                    }
                }
                @Override public void onFailure(@NonNull Call<MailApi.MailDto> call, @NonNull Throwable t) {
                    tvError.setText(getString(R.string.network_error_generic));
                    tvError.setVisibility(TextView.VISIBLE);
                }
            };
        }

        // Choose request based on context
        if (editMailId == null) {
            // Brand new compose (send or draft)
            repo.send(to, sub, msg, payloadLabels, cb);
        } else {
            if (asDraft) {
                // Editing a draft and saving it again
                repo.edit(editMailId, to, sub, msg, payloadLabels, cb);
            } else {
                // Editing a draft and pressing SEND -> create a NEW mail and delete the draft on success
                repo.send(to, sub, msg, payloadLabels, cb);
            }
        }
    }

    private void loadLabels() {
        api.getLabels().enqueue(new Callback<>() {
            @Override public void onResponse(@NonNull Call<List<MailApi.LabelDto>> call,
                                             @NonNull Response<List<MailApi.LabelDto>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    available = new ArrayList<>(response.body());
                    renderChips();
                }
            }
            @Override public void onFailure(@NonNull Call<List<MailApi.LabelDto>> call, @NonNull Throwable t) {}
        });
    }

    private void renderChips() {
        chipGroup.removeAllViews();
        for (MailApi.LabelDto l : available) {
            if (l == null || l.name == null) continue;
            String name = l.name;
            if (DEFAULT_LABELS.contains(name.toLowerCase())) continue; // hide system ones
            Chip chip = new Chip(this);
            chip.setText(name);
            chip.setCheckable(true);
            chip.setChecked(selectedNames.contains(name));
            chip.setOnCheckedChangeListener((c, checked) -> {
                if (checked) selectedNames.add(name); else selectedNames.remove(name);
            });
            chipGroup.addView(chip);
        }
    }

    private void showAddLabelDialog() {
        final EditText input = new EditText(this);
        input.setHint(R.string.label_name);
        input.setInputType(InputType.TYPE_CLASS_TEXT);

        new AlertDialog.Builder(this)
                .setTitle(R.string.add_label)
                .setView(input)
                .setPositiveButton(R.string.create, (d, w) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty()) return;
                    api.createLabel(new MailApi.CreateLabelRequest(name))
                            .enqueue(new Callback<>() {
                                @Override public void onResponse(@NonNull Call<MailApi.LabelDto> call,
                                                                 @NonNull Response<MailApi.LabelDto> res) {
                                    if (res.isSuccessful() && res.body() != null) {
                                        available.add(res.body());
                                        renderChips();
                                    } else {
                                        Toast.makeText(ComposeActivity.this,
                                                R.string.create_label_failed, Toast.LENGTH_SHORT).show();
                                    }
                                }
                                @Override public void onFailure(@NonNull Call<MailApi.LabelDto> call, @NonNull Throwable t) {
                                    Toast.makeText(ComposeActivity.this,
                                            R.string.network_error_generic, Toast.LENGTH_SHORT).show();
                                }
                            });
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }
}
