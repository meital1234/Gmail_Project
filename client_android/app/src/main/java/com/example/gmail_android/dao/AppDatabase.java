package com.example.gmail_android.dao;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.example.gmail_android.entities.LabelEntity;
import com.example.gmail_android.entities.MailEntity;
import com.example.gmail_android.entities.MailLabelCrossRef;

@Database(
        entities = { MailEntity.class, LabelEntity.class, MailLabelCrossRef.class },
        version = 1,          // increase the version number when the schema changes.
        exportSchema = true   // true so Room can validate the schema.
)
public abstract class AppDatabase extends RoomDatabase {
    // singleton instance to ensure only one database object is created.
    private static volatile AppDatabase INSTANCE;

    // abstract DAO accessor.
    public abstract MailDao mailDao();
    public abstract LabelDao labelDao();

    // returns the singleton instance of the database.
    public static AppDatabase get(Context ctx) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    // build the Room database instance.
                    INSTANCE = Room.databaseBuilder(
                                    ctx.getApplicationContext(),
                                    AppDatabase.class,
                                    "bloomly.db" // database file name.
                            )
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
