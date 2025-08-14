package com.example.gmail_android.entities;

import androidx.room.Embedded;
import androidx.room.Junction;
import androidx.room.Relation;
import java.util.List;

// represents a mail entity with its labels(many to many).
public class MailWithLabels {
    @Embedded
    public MailEntity mail;

    // List of labels associated with the mail.
    @Relation(
            parentColumn = "id",
            entity = LabelEntity.class,
            entityColumn = "id",
            associateBy = @Junction(
                    value = MailLabelCrossRef.class,
                    parentColumn = "mailId",
                    entityColumn = "labelId"
            )
    )
    public List<LabelEntity> labels;
}

