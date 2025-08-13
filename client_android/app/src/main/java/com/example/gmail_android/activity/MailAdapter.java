package com.example.gmail_android.activity;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.gmail_android.R;
import com.example.gmail_android.entities.MailWithLabels;
import java.text.DateFormat;
import java.util.Date;

public class MailAdapter extends ListAdapter<MailWithLabels, MailAdapter.VH> {

    public interface OnMailClick { void onMail(MailWithLabels item); }
    private final OnMailClick listener;

    public MailAdapter(OnMailClick l) {
        super(DIFF);
        this.listener = l;
    }

    private static final DiffUtil.ItemCallback<MailWithLabels> DIFF =
            new DiffUtil.ItemCallback<MailWithLabels>() {
                @Override public boolean areItemsTheSame(@NonNull MailWithLabels a, @NonNull MailWithLabels b) {
                    return a.mail.id.equals(b.mail.id);
                }
                @Override public boolean areContentsTheSame(@NonNull MailWithLabels a, @NonNull MailWithLabels b) {
                    return a.mail.subject.equals(b.mail.subject)
                            && a.mail.fromEmail.equals(b.mail.fromEmail)
                            && a.mail.dateSentMillis == b.mail.dateSentMillis;
                }
            };

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_mail_row, parent, false);
        return new VH(v);
    }

    @Override public void onBindViewHolder(@NonNull VH h, int pos) {
        MailWithLabels item = getItem(pos);
        h.subject.setText(item.mail.subject);
        h.from.setText(item.mail.fromEmail);

        // במסך הראשי לא מציגים תקציר
        h.preview.setVisibility(View.GONE);

        // אם השארת את rowDate נראה תאריך; אם הפכת אותו ל-gone ב-XML לא יופיע
        h.date.setText(DateFormat.getDateTimeInstance(
                DateFormat.SHORT, DateFormat.SHORT
        ).format(new Date(item.mail.dateSentMillis)));

        h.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onMail(item);
        });
    }

    public static class VH extends RecyclerView.ViewHolder {
        TextView subject, from, preview, date;
        public VH(@NonNull View v) {
            super(v);
            subject = v.findViewById(R.id.rowSubject);
            from    = v.findViewById(R.id.rowFrom);
            preview = v.findViewById(R.id.rowPreview);
            date    = v.findViewById(R.id.rowDate);
        }
    }
}

