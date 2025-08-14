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

    @Transaction
    @Query("SELECT * FROM mails ORDER BY dateSentMillis DESC")
    LiveData<List<MailWithLabels>> getInbox();

    @Transaction
    @Query("SELECT * FROM mails INNER JOIN mail_label ON mails.id = mail_label.mailId " +
            "WHERE mail_label.labelId = :labelId ORDER BY dateSentMillis DESC")
    LiveData<List<MailWithLabels>> getByLabel(String labelId);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertMails(List<MailEntity> mails);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertLabels(List<LabelEntity> labels);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void upsertMailLabel(List<MailLabelCrossRef> refs);

    @Query("DELETE FROM mails")
    void clearMails();

    @Query("DELETE FROM labels")
    void clearLabels();

    @Query("DELETE FROM mail_label")
    void clearJoins();

    @Query("DELETE FROM mail_label WHERE mailId = :mailId")
    void clearJoinsForMail(String mailId);

    @Transaction
    @Query("SELECT * FROM mails WHERE id = :id LIMIT 1")
    LiveData<MailWithLabels> getById(String id);
}
