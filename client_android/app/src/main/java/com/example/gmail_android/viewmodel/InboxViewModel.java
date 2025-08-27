package com.example.gmail_android.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MediatorLiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.gmail_android.entities.LabelEntity;
import com.example.gmail_android.entities.MailWithLabels;
import com.example.gmail_android.repository.MailRepository;

import java.util.List;

public class InboxViewModel extends AndroidViewModel {

    private final MailRepository repo;

    // filter state: null => All
    private final MutableLiveData<String> selectedLabelId = new MutableLiveData<>(null);

    // dynamic mails source (All vs ByLabel)
    private final MediatorLiveData<List<MailWithLabels>> mails = new MediatorLiveData<>();

    // cached sources
    private LiveData<List<MailWithLabels>> sourceAll;
    private LiveData<List<MailWithLabels>> sourceByLabel;

    public InboxViewModel(@NonNull Application app) {
        super(app);
        repo = new MailRepository(app.getApplicationContext());

        // default source = All inbox
        sourceAll = repo.getInboxLive();
        mails.addSource(sourceAll, mails::setValue);

        // when label changes, switch source
        selectedLabelId.observeForever(id -> {
            if (sourceByLabel != null) mails.removeSource(sourceByLabel);
            if (id == null) {
                // back to all
                mails.removeSource(sourceAll);
                sourceAll = repo.getInboxLive();
                mails.addSource(sourceAll, mails::setValue);
            } else {
                sourceByLabel = repo.getByLabelLive(id);
                mails.addSource(sourceByLabel, mails::setValue);
            }
        });
    }

    // Expose current list
    public LiveData<List<MailWithLabels>> getMails() { return mails; }

    // Expose labels list for the drawer
    public LiveData<List<LabelEntity>> getLabels() { return repo.getLabelsLive(); }

    public void selectAll() { selectedLabelId.setValue(null); }
    public void selectLabel(String labelId) { selectedLabelId.setValue(labelId); }

    public void refresh() {
        repo.refreshInbox();   // mails + joins + referenced labels
        repo.syncAllLabels();
    }
}
