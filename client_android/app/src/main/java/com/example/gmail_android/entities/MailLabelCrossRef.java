package com.example.gmail_android.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;

@Entity(
        tableName = "mail_label",
        primaryKeys = {"mailId","labelId"},
        foreignKeys = {
                @ForeignKey(entity = MailEntity.class,  parentColumns="id",
                        childColumns="mailId",  onDelete = ForeignKey.CASCADE),
                @ForeignKey(entity = LabelEntity.class, parentColumns="id",
                        childColumns="labelId", onDelete = ForeignKey.CASCADE)
        },
        indices = {@Index("mailId"), @Index("labelId")}
)
public class MailLabelCrossRef {
    @NonNull public String mailId = "";  // אתחול כדי להשתיק את ה-Lint
    @NonNull public String labelId = ""; // אותו דבר

    public MailLabelCrossRef() { } // דרוש ל-Room

    public MailLabelCrossRef(@NonNull String mailId, @NonNull String labelId) {
        this.mailId = mailId;
        this.labelId = labelId;
    }
}

