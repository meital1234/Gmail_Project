package com.example.gmail_android.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.gmail_android.entities.LabelEntity;
import com.example.gmail_android.repository.MailRepository;

import java.util.List;

public class InboxViewModel extends AndroidViewModel {

    private final com.example.gmail_android.repository.MailRepository repo;
    public final androidx.lifecycle.LiveData<java.util.List<com.example.gmail_android.entities.MailWithLabels>> mails;
    private enum Mode { ALL, LABEL, SEARCH }
    private static final class Filter {
        final Mode mode;
        final String arg; // labelId for LABEL, query for SEARCH
        private Filter(Mode m, String a) { mode = m; arg = a; }
        static Filter all()             { return new Filter(Mode.ALL,   null); }
        static Filter label(String id)  { return new Filter(Mode.LABEL, id); }
        static Filter search(String q)  { return new Filter(Mode.SEARCH,q); }
    }
    private final MutableLiveData<Filter> filter = new MutableLiveData<>(Filter.all());
    public InboxViewModel(@NonNull Application app) {
        super(app);
        repo = new MailRepository(app.getApplicationContext());
        mails = androidx.lifecycle.Transformations.switchMap(filter, f -> {
            if (f.mode == Mode.LABEL)  return repo.getByLabelLive(f.arg);
            if (f.mode == Mode.SEARCH) return repo.searchLive(f.arg);
            return repo.getInboxLive(); // ALL
        });
    }

    public androidx.lifecycle.LiveData<java.util.List<com.example.gmail_android.entities.MailWithLabels>> getMails() { return mails; }

    // Expose labels list for the drawer
    public LiveData<List<LabelEntity>> getLabels() { return repo.getLabelsLive(); }

    public androidx.lifecycle.LiveData<com.example.gmail_android.entities.User> getUser(int id) {
        return repo.getUser(id);
    }

    // ( /users/me) like:
    public androidx.lifecycle.LiveData<com.example.gmail_android.entities.User> getMe() {
        return repo.getMe();
    }

    public void selectAll() {
        filter.setValue(Filter.all());
        refresh();
    }
    public void selectLabel(String labelId) {
        filter.setValue(Filter.label(labelId));
        refresh();
    }
    public void search(String q) {
        String qq = q == null ? "" : q.trim();
        if (qq.isEmpty()) { selectAll(); return; }
        repo.refreshSearch(qq);       // backend -> Room
        filter.setValue(Filter.search(qq));
    }
    public void refresh() {
        Filter f = filter.getValue();
        if (f == null || f.mode == Mode.ALL) {
            repo.refreshInbox();
        } else if (f.mode == Mode.LABEL) {
            repo.refreshByLabel(f.arg);   // fetch that label’s mails
        } else if (f.mode == Mode.SEARCH) {
            repo.refreshSearch(f.arg);
        }
    }
}
