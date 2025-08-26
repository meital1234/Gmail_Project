package com.example.gmail_android.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;
import com.example.gmail_android.entities.LabelEntity;
import com.example.gmail_android.entities.MailEntity;
import com.example.gmail_android.entities.MailLabelCrossRef;
import com.example.gmail_android.entities.MailWithLabels;
import java.util.List;

@Dao
public interface MailDao {

    // retrieves all mails with their labels, ordered by sent date (newest first).
    @Transaction
    @Query("SELECT * FROM mails ORDER BY dateSentMillis DESC")
    LiveData<List<MailWithLabels>> getInbox();

    // retrieves mails with their labels filtered by a specific label ID.
    @Transaction
    @Query("SELECT * FROM mails INNER JOIN mail_label ON mails.id = mail_label.mailId " +
            "WHERE mail_label.labelId = :labelId ORDER BY dateSentMillis DESC")
    LiveData<List<MailWithLabels>> getByLabel(String labelId);

    @Query("SELECT * FROM labels ORDER BY name COLLATE NOCASE")
    LiveData<List<LabelEntity>> getLabels();

    // inserts or updates a list of mail entities.
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertMails(List<MailEntity> mails);

    // inserts or updates a list of label entities.
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertLabels(List<LabelEntity> labels);

    // inserts or updates the join table entries between mails and labels.
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertMailLabel(List<MailLabelCrossRef> refs);

    // deletes all mails from the database.
    @Query("DELETE FROM mails")
    void clearMails();

    // deletes all labels from the database.
    @Query("DELETE FROM labels")
    void clearLabels();

    // deletes all relationships between mails and labels.
    @Query("DELETE FROM mail_label")
    void clearJoins();

    // Deletes relationships for a specific mail ID.
    @Query("DELETE FROM mail_label WHERE mailId = :mailId")
    void clearJoinsForMail(String mailId);

    // Retrieves a single mail with its labels by ID.
    @Transaction
    @Query("SELECT * FROM mails WHERE id = :id LIMIT 1")
    LiveData<MailWithLabels> getById(String id);
}
