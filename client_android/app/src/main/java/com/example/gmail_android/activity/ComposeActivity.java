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

        Button btnSend    = findViewById(R.id.btnSend);
        Button btnDiscard = findViewById(R.id.btnDiscard);
        // “+” button to create a new custom label on the server.
        findViewById(R.id.btnAddLabel).setOnClickListener(v -> showAddLabelDialog());

        // send immediately, or save as draft and close.
        btnSend.setOnClickListener(v -> handleSend(false));
        btnDiscard.setOnClickListener(v -> handleSend(true));

        loadLabels();
    }

    // end email/save draft.
    private void handleSend(boolean asDraft) {
        tvError.setText(""); tvError.setVisibility(TextView.GONE);

        String to  = etTo.getText().toString().trim();
        String sub = etSubject.getText().toString().trim();
        String msg = etContent.getText().toString().trim();

        // for non-draft we require a recipient.
        if (!asDraft && to.isEmpty()) {
            tvError.setText(getString(R.string.recipient_required));
            tvError.setVisibility(TextView.VISIBLE);
            return;
        }

        List<String> labels = new ArrayList<>(selectedNames);
        // if saving draft, guarantee the "Drafts" label is included.
        if (asDraft && !labels.contains("Drafts")) labels.add("Drafts");

        repo.send(to, sub, msg, labels.isEmpty() ? null : labels, new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<MailApi.MailDto> call,
                                   @NonNull Response<MailApi.MailDto> res) {
                if (res.isSuccessful()) {
                    // refresh the inbox cache so the new mail/draft appears back in the list.
                    repo.refreshInbox();
                    Toast.makeText(ComposeActivity.this,
                            asDraft ? "Draft saved" : "Sent", Toast.LENGTH_SHORT).show();
                    finish();
                } else {
                    tvError.setText(getString(R.string.send_failed, res.code()));
                    tvError.setVisibility(TextView.VISIBLE);
                }
            }

            @Override
            public void onFailure(@NonNull Call<MailApi.MailDto> call,
                                  @NonNull Throwable t) {
                tvError.setText(getString(R.string.network_error, msg));
                tvError.setVisibility(TextView.VISIBLE);
            }
        });
    }

    // loading labels.
    private void loadLabels() {
        api.getLabels().enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<List<MailApi.LabelDto>> call,
                                   @NonNull Response<List<MailApi.LabelDto>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    // handle error (optional: show a toast)
                    return;
                }
                available = new ArrayList<>(response.body()); // copy into our list
                renderChips();
            }

            @Override
            public void onFailure(@NonNull Call<List<MailApi.LabelDto>> call, @NonNull Throwable t) {
                // handle failure (optional: show a toast / set error)
            }
        });
    }

    // chip display for label selection.
    private void renderChips() {
        chipGroup.removeAllViews();
        for (MailApi.LabelDto l : available) {
            if (l == null || l.name == null) continue;
            String name = l.name;
            // Hide system labels (same behavior as the React app).
            if (DEFAULT_LABELS.contains(name.toLowerCase())) continue;

            Chip chip = new Chip(this);
            chip.setText(name);
            chip.setCheckable(true);
            chip.setOnCheckedChangeListener((c, checked) -> {
                if (checked) selectedNames.add(name); else selectedNames.remove(name);
            });
            chipGroup.addView(chip);
        }
    }

    // create a new label.
    private void showAddLabelDialog() {
        final EditText input = new EditText(this);
        input.setHint("Label name");
        input.setInputType(InputType.TYPE_CLASS_TEXT);

        new AlertDialog.Builder(this)
                .setTitle("Add label")
                .setView(input)
                .setPositiveButton("Create", (d, w) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty()) return;

                    // POST /labels to create a new label.
                    api.createLabel(new MailApi.CreateLabelRequest(name))
                            .enqueue(new Callback<>() {
                                @Override
                                public void onResponse(
                                        @NonNull Call<MailApi.LabelDto> call,
                                        @NonNull Response<MailApi.LabelDto> res) {
                                    if (res.isSuccessful() && res.body() != null) {
                                        available.add(res.body());
                                        renderChips();
                                    } else {
                                        Toast.makeText(ComposeActivity.this,
                                                "Failed to create label",
                                                Toast.LENGTH_SHORT).show();
                                    }
                                }

                                @Override
                                public void onFailure(@NonNull Call<MailApi.LabelDto> call,
                                                      @NonNull Throwable t) {
                                    Toast.makeText(ComposeActivity.this,
                                            "Network error", Toast.LENGTH_SHORT).show();
                                }
                            });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}

