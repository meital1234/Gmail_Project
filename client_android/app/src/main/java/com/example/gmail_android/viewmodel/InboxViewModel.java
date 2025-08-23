package com.example.gmail_android.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import com.example.gmail_android.entities.MailWithLabels;
import com.example.gmail_android.repository.MailRepository;
import java.util.List;

// ViewModel for managing and providing inbox data to the UI.
public class InboxViewModel extends AndroidViewModel {

    // repository for accessing mail data.
    private final MailRepository repo;
    // LiveData containing the inbox mails.
    public final LiveData<List<MailWithLabels>> inbox;

    public InboxViewModel(@NonNull Application app) {
        super(app);
        // initialize repository.
        repo = new MailRepository(app.getApplicationContext());
        // retrieve LiveData of inbox mails from repository.
        inbox = repo.getInboxLive();
    }

    // refresh of inbox data from the repository.
    public void refresh() { repo.refreshInbox(); }
}

