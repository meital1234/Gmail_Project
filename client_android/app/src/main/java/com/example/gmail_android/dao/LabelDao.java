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

    // Observe ALL labels, not just “visible” ones
    @Query("SELECT * FROM labels ORDER BY name COLLATE NOCASE")
    LiveData<List<LabelEntity>> observeAll();

    // Bulk upsert
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<LabelEntity> items);

    // Clear table (used for full refresh)
    @Query("DELETE FROM labels")
    void clear();

    @androidx.room.Query("UPDATE labels SET name = :newName WHERE id = :id")
    void rename(String id, String newName);

    @androidx.room.Query("DELETE FROM labels WHERE id = :id")
    void delete(String id);

    // Atomic full replace
    @Transaction
    default void replaceAll(List<LabelEntity> items) {
        clear();
        insertAll(items);
    }
}