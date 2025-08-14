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

    // interface for handling mail item clicks.
    public interface OnMailClick { void onMail(MailWithLabels item); }
    private final OnMailClick listener;

    // constructor receiving a click listener.
    public MailAdapter(OnMailClick l) {
        super(DIFF);
        this.listener = l;
    }

    // determine if items have changed for efficient list updates.
    private static final DiffUtil.ItemCallback<MailWithLabels> DIFF =
            new DiffUtil.ItemCallback<MailWithLabels>() {
                @Override public boolean areItemsTheSame(@NonNull MailWithLabels a, @NonNull MailWithLabels b) {
                    // check if two items are the same by comparing their unique mail IDs.
                    return a.mail.id.equals(b.mail.id);
                }
                @Override public boolean areContentsTheSame(@NonNull MailWithLabels a, @NonNull MailWithLabels b) {
                    // check if content has changed.
                    return a.mail.subject.equals(b.mail.subject)
                            && a.mail.fromEmail.equals(b.mail.fromEmail)
                            && a.mail.dateSentMillis == b.mail.dateSentMillis;
                }
            };

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        // inflate a single mail row layout.
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_mail_row, parent, false);
        return new VH(v);
    }

    @Override public void onBindViewHolder(@NonNull VH h, int pos) {
        // get the mail item for the current position.
        MailWithLabels item = getItem(pos);
        // set the subject text.
        h.subject.setText(item.mail.subject);
        // set the sender email text.
        h.from.setText(item.mail.fromEmail);

        // hide the preview text in the main screen.
        h.preview.setVisibility(View.GONE);

        // set the sent date/time if the date TextView is visible.
        h.date.setText(DateFormat.getDateTimeInstance(
                DateFormat.SHORT, DateFormat.SHORT
        ).format(new Date(item.mail.dateSentMillis)));

        // handle item click events.
        h.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onMail(item);
        });
    }

    // holding references to the UI elements for each mail row.
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

