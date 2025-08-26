package com.example.gmail_android.repository;

import android.content.Context;
import androidx.lifecycle.LiveData;
import android.util.Log;
import com.example.gmail_android.dao.AppDatabase;
import com.example.gmail_android.dao.MailDao;
import com.example.gmail_android.entities.LabelEntity;
import com.example.gmail_android.entities.MailEntity;
import com.example.gmail_android.entities.MailLabelCrossRef;
import com.example.gmail_android.entities.MailWithLabels;
import com.example.gmail_android.interfaces.MailApi;
import com.example.gmail_android.interfaces.ApiClient;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import okhttp3.ResponseBody;
import retrofit2.Callback;
import retrofit2.Response;

public class MailRepository {
    private final Context ctx;
    // API interface for network calls.
    private final MailApi api;
    // data Access Object for Room database.
    private final MailDao dao;
    // background executor for IO tasks.
    private final Executor io = Executors.newSingleThreadExecutor();

    public MailRepository(Context ctx) {
        retrofit2.Retrofit retrofit = ApiClient.get(ctx);
        Log.d("API", "Retrofit baseUrl=" + retrofit.baseUrl());
        this.api = retrofit.create(MailApi.class);
        this.dao = AppDatabase.get(ctx).mailDao();
        this.ctx = ctx;
    }

    // LiveData for UI.
    public LiveData<List<MailWithLabels>> getInboxLive() {
        AppDatabase db = AppDatabase.get(ctx);
        MailDao dao = db.mailDao();
        return dao.getInbox();
    }

    // refresh inbox data from the server and update Room database.
    public void refreshInbox() {
        io.execute(() -> {
            try {
                Response<List<MailApi.MailDto>> res = api.getInbox().execute();
                if (!res.isSuccessful() || res.body() == null) {
                    Log.e("MailRepo",
                            "getInbox failed: code=" + res.code() + ", msg=" + res.message());
                    ResponseBody eb = res.errorBody();
                    if (eb != null) {
                        try (ResponseBody ignored = eb) {
                            Log.e("MailRepo", "errorBody=" + eb.string());
                        } catch (IOException io) {
                            Log.e("MailRepo", "errorBody read failed", io);
                        }
                    }

                    return;
                }

                List<MailApi.MailDto> body = res.body();
                Log.d("MailRepo", "getInbox OK, items=" + body.size());

                List<MailEntity> mails = new ArrayList<>();
                Map<String, LabelEntity> labelMap = new LinkedHashMap<>();
                List<MailLabelCrossRef> joins = new ArrayList<>();

                // convert API dto to database entities.
                for (MailApi.MailDto d : body) {
                    MailEntity m = new MailEntity();
                    m.id = d.id;
                    m.fromEmail = d.from;
                    m.toEmail = d.to;
                    m.subject = d.subject;
                    m.content = d.content;
                    m.isSpam = d.spam;
                    m.dateSentMillis = parseMillis(d.dateSent);
                    mails.add(m);

                    // process labels for each mail.
                    if (d.labels != null) {
                        for (MailApi.LabelDto L : d.labels) {
                            if (L == null || L.id == null) continue;
                            LabelEntity e = labelMap.get(L.id);
                            if (e == null) {
                                e = new LabelEntity();
                                e.id = L.id;
                                e.name = (L.name != null) ? L.name : L.id;
                                labelMap.put(e.id, e);
                            }
                            MailLabelCrossRef ref = new MailLabelCrossRef();
                            ref.mailId = m.id;
                            ref.labelId = L.id;
                            joins.add(ref);
                        }
                    }
                }

                // update database, clear old data and insert new.
                dao.clearJoins();
                dao.clearMails();
                dao.upsertLabels(new ArrayList<>(labelMap.values()));
                dao.upsertMails(mails);
                dao.upsertMailLabel(joins);

                Log.d("MailRepo", "saved to Room: mails=" + mails.size()
                        + ", labels=" + labelMap.size()
                        + ", joins=" + joins.size());
            } catch (Exception e) {
                Log.e("MailRepo", "refreshInbox error", e);
            }
        });
    }

    // LiveData for a single mail by id.
    public LiveData<MailWithLabels> getMailLive(String id) {
        return dao.getById(id);
    }

    // refresh a single mail from the server and update Room (including its labels).
    public void refreshMail(String id) {
        io.execute(() -> {
            try {
                Response<MailApi.MailDto> res = api.getMail(id).execute();
                if (!res.isSuccessful() || res.body() == null) return;

                MailApi.MailDto d = res.body();

                MailEntity m = new MailEntity();
                m.id = d.id;
                m.fromEmail = d.from;
                m.toEmail = d.to;
                m.subject = d.subject;
                m.content = d.content;
                m.isSpam = d.spam;
                m.dateSentMillis = parseMillis(d.dateSent);

                Map<String, LabelEntity> labelMap = new LinkedHashMap<>();
                List<MailLabelCrossRef> joins = new ArrayList<>();

                // process labels.
                if (d.labels != null) {
                    for (MailApi.LabelDto L : d.labels) {
                        if (L == null || L.id == null) continue;
                        if (!labelMap.containsKey(L.id)) {
                            LabelEntity e = new LabelEntity();
                            e.id = L.id;
                            e.name = (L.name != null) ? L.name : L.id;
                            labelMap.put(e.id, e);
                        }
                        MailLabelCrossRef ref = new MailLabelCrossRef();
                        ref.mailId = m.id;
                        ref.labelId = L.id;
                        joins.add(ref);
                    }
                }

                // update only the specific mail and its label relationships.
                dao.upsertMails(java.util.Collections.singletonList(m));
                dao.upsertLabels(new ArrayList<>(labelMap.values()));
                // remove old relationships for this mail.
                dao.clearJoinsForMail(id);
                dao.upsertMailLabel(joins);

            } catch (Exception ignore) {}
        });
    }

    // send a new mail.
    public void send(String toEmail, String subject, String content, List<String> labels,
                     Callback<MailApi.MailDto> cb) {
        MailApi.ComposeRequest req = new MailApi.ComposeRequest();
        req.toEmail = toEmail;
        req.subject = subject;
        req.content = content;
        req.labels  = labels;
        api.send(req).enqueue(cb);
    }

    // edit an existing mail (for draft).
    public void edit(String mailId, String toEmail, String subject, String content,
                     List<String> labels,
                     Callback<MailApi.MailDto> cb) {
        MailApi.EditRequest req = new MailApi.EditRequest();
        req.toEmail = toEmail;
        req.subject = subject;
        req.content = content;
        req.labels  = labels;
        api.edit(mailId, req).enqueue(cb);
    }

    // delete a mail
    public void delete(String mailId, Callback<ResponseBody> cb) {
        api.delete(mailId).enqueue(cb);
    }

    // add a label to a mail.
    public void addLabel(String mailId, String labelId, Callback<ResponseBody> cb) {
        api.addLabel(mailId, labelId).enqueue(cb);
    }

    // remove a label from a mail.
    public void removeLabel(String mailId, String labelId, Callback<ResponseBody> cb) {
        api.removeLabel(mailId, labelId).enqueue(cb);
    }

    public LiveData<List<MailWithLabels>> getByLabelLive(String labelId) {
        AppDatabase db = AppDatabase.get(ctx);
        MailDao dao = db.mailDao();
        return dao.getByLabel(labelId);
    }

    public LiveData<List<LabelEntity>> getLabelsLive() {
        AppDatabase db = AppDatabase.get(ctx);
        MailDao dao = db.mailDao();
        // if not present, add this query in MailDao:
        // @Query("SELECT * FROM labels ORDER BY name COLLATE NOCASE")
        // LiveData<List<LabelEntity>> getLabels();
        return dao.getLabels();
    }

    // parse a date string.
    private static long parseMillis(String dateSent) {
        if (dateSent == null) return System.currentTimeMillis();
        String s = dateSent.trim();
        if (s.matches("^-?\\d+$")) { // numeric string.
            try { return Long.parseLong(s); } catch (NumberFormatException ignore) {}
        }
        return System.currentTimeMillis();
    }
}

