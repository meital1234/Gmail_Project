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
public class ComposeActivity extends androidx.appcompat.app.AppCompatActivity {

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
    private void handleSend(boolean asDraft) {
        tvError.setText(""); tvError.setVisibility(TextView.GONE);

        String to  = etTo.getText().toString().trim();
        String sub = etSubject.getText().toString().trim();
        String msg = etContent.getText().toString().trim();

        // Require recipient only when actually sending
        if (!asDraft && to.isEmpty()) {
            tvError.setText(getString(R.string.recipient_required));
            tvError.setVisibility(TextView.VISIBLE);
            return;
        }

        // Build label list for this action
        List<String> labels = new ArrayList<>(selectedNames);
        if (asDraft) {
            boolean hasDrafts = false;
            for (String s : labels) if ("drafts".equalsIgnoreCase(s)) { hasDrafts = true; break; }
            if (!hasDrafts) labels.add("Drafts");
        } else {
            // Make sure no “Drafts” leaks into a send
            labels.removeIf("drafts"::equalsIgnoreCase);
        }
        List<String> maybeNull = labels.isEmpty() ? null : labels;

        // Common callbacks
        Callback<MailApi.MailDto> onSendCb = new Callback<>() {
            @Override public void onResponse(@NonNull Call<MailApi.MailDto> call,
                                             @NonNull Response<MailApi.MailDto> res) {
                if (!res.isSuccessful()) {
                    tvError.setText(getString(R.string.send_failed, res.code()));
                    tvError.setVisibility(TextView.VISIBLE);
                    return;
                }
                // If we were sending while editing an existing draft, delete that draft now
                if (!asDraft && editMailId != null) {
                    // Delete from backend (best effort) and immediately from Room so UI updates
                    repo.deleteLocal(editMailId);
                    repo.delete(editMailId, /*cb*/ null);
                }

                repo.refreshInbox();
                Toast.makeText(ComposeActivity.this,
                        asDraft ? R.string.draft_saved : R.string.sent_ok,
                        Toast.LENGTH_SHORT).show();
                finish();
            }

            @Override public void onFailure(@NonNull Call<MailApi.MailDto> call, @NonNull Throwable t) {
                tvError.setText(getString(R.string.network_error_generic));
                tvError.setVisibility(TextView.VISIBLE);
            }
        };

        // IMPORTANT: When sending, ALWAYS create a NEW mail (POST),
        // and if we were editing a draft, delete the old draft after success.
        if (!asDraft) {
            repo.send(to, sub, msg, maybeNull, onSendCb);
            return;
        }

        // Saving a draft: create new if it's a brand new draft, or PATCH the existing one
        if (editMailId == null) {
            repo.send(to, sub, msg, maybeNull, onSendCb); // create a draft via POST with "Drafts" label
        } else {
            repo.edit(editMailId, to, sub, msg, maybeNull, onSendCb); // update existing draft
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
