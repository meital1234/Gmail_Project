package com.example.gmail_android.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

// represents an email message stored in the database.
@Entity(tableName = "mails")
public class MailEntity {

    // primary key for the mail, cannot be null.
    @PrimaryKey @NonNull
    public String id = "";
    // sender email address.
    public String fromEmail = "";
    // recipient email address.
    public String toEmail   = "";
    // email subject.
    public String subject   = "";
    // email body content.
    public String content   = "";

    // sent date/time, defaults to 0 if not set.
    public long dateSentMillis;
    // indicates if the mail is spam, defaults to false if not set.
    public boolean isSpam;

    // no argument constructor required by Room.
    public MailEntity() { }

    // constructor to initialize with a specific mail ID.
    public MailEntity(@NonNull String id) {
        this.id = id;
    }
}


