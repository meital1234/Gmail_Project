package com.example.gmail_android.entities;

import androidx.room.Embedded;
import androidx.room.Junction;
import androidx.room.Relation;
import java.util.List;

public class MailWithLabels {
    @Embedded
    public MailEntity mail;

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

