package com.example.gmail_android.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "labels")
public class LabelEntity {

    @PrimaryKey @NonNull
    public String id = "";   // non-null כברירת מחדל

    @NonNull
    public String name = ""; // non-null כברירת מחדל

    public LabelEntity() { } // נדרש ל-Room

    public LabelEntity(@NonNull String id, @NonNull String name) {
        this.id = id;
        this.name = name;
    }
}

