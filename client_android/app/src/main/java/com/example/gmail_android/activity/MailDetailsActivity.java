package com.example.gmail_android.activity;
import android.os.Bundle;
import android.widget.TextView;
import androidx.activity.ComponentActivity;
import androidx.annotation.NonNull;

import com.example.gmail_android.R;
import com.example.gmail_android.entities.MailWithLabels;
import com.example.gmail_android.repository.MailRepository;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import java.text.DateFormat;
import java.util.Date;

public class MailDetailsActivity extends androidx.appcompat.app.AppCompatActivity {
    private ChipGroup chips;
    private MailRepository repo;

    // system labels can’t be removed
    private static final java.util.Set<String> PROTECTED =
            new java.util.HashSet<>(java.util.Arrays.asList(
                    "inbox","sent","drafts"
            ));
    private static boolean isProtected(String s) {
        return s != null && PROTECTED.contains(s.trim().toLowerCase(java.util.Locale.ROOT));
    }

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_mail_details);

        // set up the top app bar navigation button to close the activity.
        MaterialToolbar bar = findViewById(R.id.topAppBar);
        bar.setNavigationOnClickListener(v -> finish());
        // set up an additional back button to close the activity.
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        // references for mail details.
        TextView tvSubject = findViewById(R.id.tvSubject);
        TextView tvFrom    = findViewById(R.id.tvFrom);
        TextView tvTo      = findViewById(R.id.tvTo);
        TextView tvDate    = findViewById(R.id.tvDate);
        TextView tvBody    = findViewById(R.id.tvBody);
        chips = findViewById(R.id.chips);

        // mail ID passed from the previous screen.
        String id = getIntent().getStringExtra("mail_id");
        // repository instance for accessing mail data.
        repo = new MailRepository(getApplicationContext());

        // mail data from Room database.
        repo.getMailLive(id).observe(this, (MailWithLabels m) -> {
            if (m == null || m.mail == null) return;
            // set subject.
            tvSubject.setText(m.mail.subject);

            // ensure sender and recipient emails are not null.
            String fromSafe = (m.mail.fromEmail != null) ? m.mail.fromEmail : "";
            String toSafe   = (m.mail.toEmail   != null) ? m.mail.toEmail   : "";

            // set sender and recipient text.
            tvFrom.setText(getString(R.string.from_fmt, fromSafe));
            tvTo.setText(getString(R.string.to_fmt,   toSafe));

            // display the sent date/time.
            tvDate.setText(DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT)
                    .format(new Date(m.mail.dateSentMillis)));
            // set mail body text, default to empty string if null.
            tvBody.setText(m.mail.content == null ? "" : m.mail.content);

            // remove any existing chips and add new ones for the mail's labels.
            renderChips(m);
        });

        // trigger a server refresh to ensure full mail content is loaded.
        repo.refreshMail(id);
    }
    private void renderChips(MailWithLabels mail) {
        chips.removeAllViews();

        // existing labels → closable chips (except protected)
        if (mail.labels != null) {
            for (com.example.gmail_android.entities.LabelEntity L : mail.labels) {
                Chip c = new Chip(this);
                c.setText(L.name);
                c.setCheckable(false);

                boolean protect = isProtected(L.name) || isProtected(L.id);
                c.setCloseIconVisible(!protect);
                if (!protect) {
                    c.setOnCloseIconClickListener(v -> new android.app.AlertDialog.Builder(this)
                            .setMessage("Remove label \"" + L.name + "\"?")
                            .setPositiveButton(android.R.string.ok, (d, w) -> repo.removeLabel(mail.mail.id, L.id, new retrofit2.Callback<>() {
                                @Override
                                public void onResponse(@NonNull retrofit2.Call<okhttp3.ResponseBody> call,
                                                       @NonNull retrofit2.Response<okhttp3.ResponseBody> res) {
                                    repo.refreshMail(mail.mail.id); // pull fresh joins
                                }

                                @Override
                                public void onFailure(@NonNull retrofit2.Call<okhttp3.ResponseBody> call, @NonNull Throwable t) {
                                }
                            }))
                            .setNegativeButton(android.R.string.cancel, null)
                            .show());
                }

                // subtle outlined look (closer to web tags)
                c.setChipStrokeWidth(1f);
                c.setChipStrokeColor(
                        androidx.core.content.ContextCompat.getColorStateList(this, R.color.text_Color)
                );
                chips.addView(c);
            }
        }

        // “+” add chip at the end
        Chip add = new Chip(this);
        add.setText("+");
        add.setCheckable(false);
        add.setChipIconVisible(true);
        add.setOnClickListener(v -> showAddLabelDialog(mail));
        chips.addView(add);
    }
    private void showAddLabelDialog(MailWithLabels mail) {
        // ids already attached
        java.util.Set<String> have = new java.util.HashSet<>();
        if (mail.labels != null) {
            for (com.example.gmail_android.entities.LabelEntity l : mail.labels) {
                have.add(l.id.trim().toLowerCase(java.util.Locale.ROOT));
            }
        }

        // observe labels once, then remove observer
        androidx.lifecycle.Observer<java.util.List<com.example.gmail_android.entities.LabelEntity>> obs =
                new androidx.lifecycle.Observer<>() {
                    @Override public void onChanged(java.util.List<com.example.gmail_android.entities.LabelEntity> all) {
                        repo.getLabelsLive().removeObserver(this);
                        if (all == null || all.isEmpty()) {
                            android.widget.Toast.makeText(MailDetailsActivity.this, "No labels", android.widget.Toast.LENGTH_SHORT).show();
                            return;
                        }

                        java.util.ArrayList<com.example.gmail_android.entities.LabelEntity> options = new java.util.ArrayList<>();
                        for (com.example.gmail_android.entities.LabelEntity l : all) {
                            String lid = l.id.trim().toLowerCase(java.util.Locale.ROOT);
                            if (!have.contains(lid)) options.add(l);
                        }
                        if (options.isEmpty()) {
                            android.widget.Toast.makeText(MailDetailsActivity.this, "No more labels to add", android.widget.Toast.LENGTH_SHORT).show();
                            return;
                        }

                        CharSequence[] names = new CharSequence[options.size()];
                        for (int i = 0; i < options.size(); i++) names[i] = options.get(i).name;

                        new android.app.AlertDialog.Builder(MailDetailsActivity.this)
                                .setTitle("Add label")
                                .setItems(names, (d, which) -> {
                                    com.example.gmail_android.entities.LabelEntity chosen = options.get(which);
                                    repo.addLabel(mail.mail.id, chosen.id, new retrofit2.Callback<>() {
                                        @Override
                                        public void onResponse(@NonNull retrofit2.Call<okhttp3.ResponseBody> call,
                                                               @NonNull retrofit2.Response<okhttp3.ResponseBody> res) {
                                            repo.refreshMail(mail.mail.id);
                                        }

                                        @Override
                                        public void onFailure(@NonNull retrofit2.Call<okhttp3.ResponseBody> call, @NonNull Throwable t) {
                                        }
                                    });
                                })
                                .setNegativeButton(android.R.string.cancel, null)
                                .show();
                    }
                };

        repo.getLabelsLive().observe(this, obs);
    }
}
