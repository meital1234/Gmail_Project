package com.example.gmail_android.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import com.example.gmail_android.entities.LabelEntity;

import java.util.List;

@Dao
public interface LabelDao {

    // System labels first (fixed order), then user labels alphabetically
    @Query(
            "SELECT * FROM labels " +
                    "ORDER BY " +
                    "CASE lower(name) " +
                    "  WHEN 'inbox'     THEN 0 " +
                    "  WHEN 'starred'   THEN 1 " +
                    "  WHEN 'important' THEN 2 " +
                    "  WHEN 'sent'      THEN 3 " +
                    "  WHEN 'drafts'    THEN 4 " +
                    "  WHEN 'spam'      THEN 5 " +
                    "  WHEN 'trash'     THEN 6 " +
                    "  WHEN 'bin'       THEN 6 " +
                    "  WHEN 'archive'   THEN 7 " +
                    "  WHEN 'all'       THEN 8 " +
                    "  WHEN 'all mail'  THEN 8 " +
                    "  ELSE 100 " +
                    "END, " +
                    "name COLLATE NOCASE"
    )
    androidx.lifecycle.LiveData<java.util.List<com.example.gmail_android.entities.LabelEntity>> observeAll();

    // Bulk upsert
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<LabelEntity> items);

    // Clear table (used for full refresh)
    @Query("DELETE FROM labels")
    void clear();

    @Query("UPDATE labels SET name = :newName WHERE id = :id")
    void rename(String id, String newName);

    @Query("DELETE FROM labels WHERE id = :id")
    void delete(String id);

    // Atomic full replace
    @Transaction
    default void replaceAll(List<LabelEntity> items) {
        clear();
        insertAll(items);
    }
}