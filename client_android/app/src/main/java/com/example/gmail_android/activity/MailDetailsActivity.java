package com.example.gmail_android.activity;

import android.os.Bundle;
import android.widget.TextView;
import androidx.activity.ComponentActivity;
import com.example.gmail_android.R;
import com.example.gmail_android.entities.MailWithLabels;
import com.example.gmail_android.repository.MailRepository;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import java.text.DateFormat;
import java.util.Date;

public class MailDetailsActivity extends ComponentActivity {

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
        ChipGroup chips    = findViewById(R.id.chips);

        // mail ID passed from the previous screen.
        String id = getIntent().getStringExtra("mail_id");
        // repository instance for accessing mail data.
        MailRepository repo = new MailRepository(getApplicationContext());

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
            chips.removeAllViews();
            if (m.labels != null) {
                for (var l : m.labels) {
                    Chip c = new Chip(this);
                    c.setText(l.name);
                    // chips are for display only.
                    c.setClickable(false);
                    chips.addView(c);
                }
            }
        });

        // trigger a server refresh to ensure full mail content is loaded.
        repo.refreshMail(id);
    }
}
