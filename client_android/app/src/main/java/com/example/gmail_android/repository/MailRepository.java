package com.example.gmail_android.repository;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import android.util.Log;
import com.example.gmail_android.dao.AppDatabase;
import com.example.gmail_android.dao.MailDao;
import com.example.gmail_android.dao.LabelDao;
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
    private final LabelDao labelDao;
    // background executor for IO tasks.
    private final Executor io = Executors.newSingleThreadExecutor();

    public MailRepository(Context ctx) {
        retrofit2.Retrofit retrofit = ApiClient.get(ctx);
        Log.d("API", "Retrofit baseUrl=" + retrofit.baseUrl());
        this.api = retrofit.create(MailApi.class);
        this.dao = AppDatabase.get(ctx).mailDao();
        this.labelDao = AppDatabase.get(ctx).labelDao();
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
                // Upsert only the labels referenced by these mails (for FK integrity)
                labelDao.insertAll(new ArrayList<>(labelMap.values()));
                dao.upsertMails(mails);
                dao.upsertMailLabel(joins);

                // Fetch the FULL label catalog so the sidebar shows everything
                // (no table clearing here to avoid cascading deletes)
                syncAllLabels();

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

    // Create label
    public void createLabel(String name, retrofit2.Callback<MailApi.LabelDto> cb) {
        api.createLabel(new MailApi.CreateLabelRequest(name)).enqueue(new retrofit2.Callback<>() {
            @Override
            public void onResponse(@NonNull retrofit2.Call<MailApi.LabelDto> call,
                                   @NonNull retrofit2.Response<MailApi.LabelDto> res) {
                if (res.isSuccessful() && res.body() != null) {
                    io.execute(() -> {
                        LabelEntity e = new LabelEntity();
                        e.id = res.body().id;
                        e.name = res.body().name != null ? res.body().name : res.body().id;
                        labelDao.insertAll(java.util.Collections.singletonList(e));
                    });
                }
                if (cb != null) cb.onResponse(call, res);
            }

            @Override
            public void onFailure(@NonNull retrofit2.Call<MailApi.LabelDto> call, @NonNull Throwable t) {
                if (cb != null) cb.onFailure(call, t);
            }
        });
    }

    // Rename label
    public void renameLabel(String id, String newName, retrofit2.Callback<MailApi.LabelDto> cb) {
        api.renameLabel(id, new MailApi.RenameLabelRequest(newName))
                .enqueue(new retrofit2.Callback<>() {
                    @Override
                    public void onResponse(@NonNull retrofit2.Call<MailApi.LabelDto> call,
                                           @NonNull retrofit2.Response<MailApi.LabelDto> res) {
                        if (res.isSuccessful() && res.body() != null) {
                            io.execute(() -> labelDao.rename(id, newName));
                        }
                        if (cb != null) cb.onResponse(call, res);
                    }

                    @Override
                    public void onFailure(@NonNull retrofit2.Call<MailApi.LabelDto> call, @NonNull Throwable t) {
                        if (cb != null) cb.onFailure(call, t);
                    }
                });
    }

    // Delete label
    public void deleteLabel(String id, retrofit2.Callback<okhttp3.ResponseBody> cb) {
        api.deleteLabel(id).enqueue(new retrofit2.Callback<>() {
            @Override
            public void onResponse(@NonNull retrofit2.Call<okhttp3.ResponseBody> call,
                                   @NonNull retrofit2.Response<okhttp3.ResponseBody> res) {
                if (res.isSuccessful()) {
                    io.execute(() -> labelDao.delete(id));  // ON DELETE CASCADE will clean joins
                }
                if (cb != null) cb.onResponse(call, res);
            }

            @Override
            public void onFailure(@NonNull retrofit2.Call<okhttp3.ResponseBody> call, @NonNull Throwable t) {
                if (cb != null) cb.onFailure(call, t);
            }
        });
    }

    public LiveData<List<MailWithLabels>> getByLabelLive(String labelId) {
        AppDatabase db = AppDatabase.get(ctx);
        MailDao dao = db.mailDao();
        return dao.getByLabel(labelId);
    }

    public LiveData<List<LabelEntity>> getLabelsLive() {
        return labelDao.observeAll();
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

    // Pull the full label catalog and upsert (no table clearing) so nothing disappears from the sidebar
    public void syncAllLabels() {
        io.execute(() -> {
            try {
                Response<List<MailApi.LabelDto>> res = api.getLabels().execute();
                if (!res.isSuccessful() || res.body() == null) {
                    Log.e("MailRepo", "getLabels failed: code=" + (res != null ? res.code() : -1));
                    return;
                }
                List<LabelEntity> items = new ArrayList<>();
                for (MailApi.LabelDto L : res.body()) {
                    if (L == null || L.id == null) continue;
                    LabelEntity e = new LabelEntity();
                    e.id = L.id;
                    e.name = (L.name != null) ? L.name : L.id;
                    items.add(e);
                }
                labelDao.insertAll(items); // upsert; do NOT clear to avoid FK cascade on mail_label
                Log.d("MailRepo", "syncAllLabels OK, items=" + items.size());
            } catch (Exception e) {
                Log.e("MailRepo", "syncAllLabels error", e);
            }
        });
    }
}

