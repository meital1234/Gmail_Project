package com.example.gmail_android.entities;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

// represents a label in the database.
@Entity(
        tableName = "labels",
        indices = {@Index(value = {"id"}, unique = true)}
)
public class LabelEntity {

    // primary key for the label, cannot be null.
    @PrimaryKey @NonNull
    public String id = "";

    // name of the label, cannot be null.
    @NonNull
    public String name = "";

    // no argument constructor required by Room.
    public LabelEntity() { }
    // constructor to initialize both fields.
    public LabelEntity(@NonNull String id, @NonNull String name) {
        this.id = id;
        this.name = name;
    }
}

