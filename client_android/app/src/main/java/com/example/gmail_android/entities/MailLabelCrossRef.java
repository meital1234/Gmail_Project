package com.example.gmail_android.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;

// represents the relationship(many to many) between MailEntity and LabelEntity.
@Entity(
        tableName = "mail_label",
        primaryKeys = {"mailId","labelId"},
        foreignKeys = {
                // link to MailEntity. delete related rows if the mail is deleted.
                @ForeignKey(entity = MailEntity.class,  parentColumns="id",
                        childColumns="mailId",  onDelete = ForeignKey.CASCADE),
                // link to LabelEntity. delete related rows if the label is deleted.
                @ForeignKey(entity = LabelEntity.class, parentColumns="id",
                        childColumns="labelId", onDelete = ForeignKey.CASCADE)
        },
        // Add indexes to improve query performance.
        indices = {@Index("mailId"), @Index("labelId")}
)
public class MailLabelCrossRef {
    // id of the mail.
    @NonNull public String mailId = "";
    // id of the label.
    @NonNull public String labelId = "";

    // no argument constructor required by Room.
    public MailLabelCrossRef() { }

    // constructor to initialize both ids.
    public MailLabelCrossRef(@NonNull String mailId, @NonNull String labelId) {
        this.mailId = mailId;
        this.labelId = labelId;
    }
}

