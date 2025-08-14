package com.example.gmail_android.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "mails")
public class MailEntity {
    @PrimaryKey @NonNull
    public String id = "";       // <- אתחול לערך ריק

    public String fromEmail = "";
    public String toEmail   = "";
    public String subject   = "";
    public String content   = "";

    public long dateSentMillis; // 0 כברירת מחדל זה תקין
    public boolean isSpam;      // false כברירת מחדל

    public MailEntity() { }     // נדרש ל-Room

    public MailEntity(@NonNull String id) {
        this.id = id;
    }
}


