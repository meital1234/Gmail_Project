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
        version = 1,          // כשמשנים סכימה - להעלות ל-2,3...
        exportSchema = true   // מומלץ להשאיר true כדי ש-Room יוודא סכימה
)
public abstract class AppDatabase extends RoomDatabase {
    private static volatile AppDatabase INSTANCE;

    public abstract MailDao mailDao();

    public static AppDatabase get(Context ctx) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                                    ctx.getApplicationContext(),
                                    AppDatabase.class,
                                    "bloomly.db"
                            )
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
