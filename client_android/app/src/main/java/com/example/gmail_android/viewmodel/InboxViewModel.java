package com.example.gmail_android.viewmodel;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.example.gmail_android.entities.MailWithLabels;
import com.example.gmail_android.repository.MailRepository;

import java.util.List;

public class InboxViewModel extends AndroidViewModel {

    private final MailRepository repo;
    public final LiveData<List<MailWithLabels>> inbox;

    public InboxViewModel(@NonNull Application app) {
        super(app);
        repo = new MailRepository(app.getApplicationContext());
        inbox = repo.getInboxLive();
    }

    public void refresh() { repo.refreshInbox(); }
}

