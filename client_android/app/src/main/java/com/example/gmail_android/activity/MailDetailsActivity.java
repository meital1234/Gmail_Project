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

        MaterialToolbar bar = findViewById(R.id.topAppBar);
        bar.setNavigationOnClickListener(v -> finish());
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        TextView tvSubject = findViewById(R.id.tvSubject);
        TextView tvFrom    = findViewById(R.id.tvFrom);
        TextView tvTo      = findViewById(R.id.tvTo);
        TextView tvDate    = findViewById(R.id.tvDate);
        TextView tvBody    = findViewById(R.id.tvBody);
        ChipGroup chips    = findViewById(R.id.chips);

        String id = getIntent().getStringExtra("mail_id");
        MailRepository repo = new MailRepository(getApplicationContext());

        // תצוגה מתוך Room
        repo.getMailLive(id).observe(this, (MailWithLabels m) -> {
            if (m == null || m.mail == null) return;
            tvSubject.setText(m.mail.subject);

            String fromSafe = (m.mail.fromEmail != null) ? m.mail.fromEmail : "";
            String toSafe   = (m.mail.toEmail   != null) ? m.mail.toEmail   : "";

            tvFrom.setText(getString(R.string.from_fmt, fromSafe));
            tvTo.setText(getString(R.string.to_fmt,   toSafe));

            tvDate.setText(DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT)
                    .format(new Date(m.mail.dateSentMillis)));
            tvBody.setText(m.mail.content == null ? "" : m.mail.content);

            chips.removeAllViews();
            if (m.labels != null) {
                for (var l : m.labels) {
                    Chip c = new Chip(this);
                    c.setText(l.name);
                    c.setClickable(false);
                    chips.addView(c);
                }
            }
        });

        // ריענון נקודתי מהשרת (מבטיח תוכן מלא אם ב-Inbox היה מקוצר)
        repo.refreshMail(id);
    }
}
