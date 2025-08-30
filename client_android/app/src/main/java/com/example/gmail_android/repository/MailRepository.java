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
import java.util.Objects;
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

    private static String normId(String s) {
        return s == null ? null : s.trim().toLowerCase(java.util.Locale.ROOT);
    }
    private static String normName(String s) {
        return s == null ? null : s.trim();
    }

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

    // LiveData bound to Room search results
    public LiveData<java.util.List<com.example.gmail_android.entities.MailWithLabels>> searchLive(String q) {
        return dao.search(q);
    }

    // Call backend /mails/search/{q}, upsert into Room, so searchLive() updates
    public void refreshSearch(String q) {
        io.execute(() -> {
            try {
                retrofit2.Response<java.util.List<com.example.gmail_android.interfaces.MailApi.MailDto>> res =
                        api.search(q).execute();
                if (!res.isSuccessful() || res.body() == null) return;

                java.util.List<com.example.gmail_android.entities.MailEntity> mails = new java.util.ArrayList<>();
                java.util.Map<String, com.example.gmail_android.entities.LabelEntity> labelMap = new java.util.LinkedHashMap<>();
                java.util.List<com.example.gmail_android.entities.MailLabelCrossRef> joins = new java.util.ArrayList<>();

                for (com.example.gmail_android.interfaces.MailApi.MailDto d : res.body()) {
                    com.example.gmail_android.entities.MailEntity m = new com.example.gmail_android.entities.MailEntity();
                    m.id = d.id; m.fromEmail = d.from; m.toEmail = d.to;
                    m.subject = d.subject; m.content = d.content;
                    m.isSpam = d.spam; m.dateSentMillis = parseMillis(d.dateSent);
                    mails.add(m);

                    if (d.labels != null) {
                        for (com.example.gmail_android.interfaces.MailApi.LabelDto L : d.labels) {
                            if (L == null || L.id == null) continue;
                            String lid = normId(L.id);       // <-- normalize

                            LabelEntity e = labelMap.get(lid);
                            if (e == null) {
                                e = new LabelEntity();
                                e.id = lid;
                                e.name = (L.name != null) ? normName(L.name) : lid;
                                labelMap.put(lid, e);
                            }
                            MailLabelCrossRef ref = new MailLabelCrossRef();
                            ref.mailId = m.id;
                            ref.labelId = lid;               // <-- normalized
                            joins.add(ref);
                        }
                    }
                }

                // upsert (no full clear)
                labelDao.insertAllIgnore(new java.util.ArrayList<>(labelMap.values()));
                for (LabelEntity e : labelMap.values()) {
                    labelDao.rename(e.id, e.name);
                }
                dao.upsertMails(mails);
                dao.upsertMailLabel(joins);
            } catch (Exception ignore) {}
        });
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
                        for (com.example.gmail_android.interfaces.MailApi.LabelDto L : d.labels) {
                            if (L == null || L.id == null) continue;
                            String lid = normId(L.id);     // <-- normalize

                            LabelEntity e = labelMap.get(lid);
                            if (e == null) {
                                e = new LabelEntity();
                                e.id = lid;
                                e.name = (L.name != null) ? normName(L.name) : lid; // tidy name
                                labelMap.put(lid, e);
                            }
                            MailLabelCrossRef ref = new MailLabelCrossRef();
                            ref.mailId = m.id;
                            ref.labelId = lid;             // <-- normalized id in joins
                            joins.add(ref);
                        }
                    }
                }

                // update database, clear old data and insert new.
                dao.clearJoins();
                dao.clearMails();
                labelDao.clear(); // no FK joins exist right now, so it's safe

                // Upsert only the labels referenced by these mails (for FK integrity)
                labelDao.insertAllIgnore(new ArrayList<>(labelMap.values()));
                for (LabelEntity e : labelMap.values()) {
                    labelDao.rename(e.id, e.name); // safe no-op if unchanged
                }
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
                    for (com.example.gmail_android.interfaces.MailApi.LabelDto L : d.labels) {
                        if (L == null || L.id == null) continue;
                        String lid = normId(L.id);     // <-- normalize
                        if (!labelMap.containsKey(lid)) {
                            LabelEntity e = new LabelEntity();
                            e.id = lid;
                            e.name = (L.name != null) ? normName(L.name) : lid;
                            labelMap.put(lid, e);
                        }
                        MailLabelCrossRef ref = new MailLabelCrossRef();
                        ref.mailId = m.id;
                        ref.labelId = lid;             // <-- normalized
                        joins.add(ref);
                    }
                }

                // update only the specific mail and its label relationships.
                dao.clearJoinsForMail(id);
                dao.upsertMailLabel(joins);

            } catch (Exception ignore) {}
        });
    }

    // Fetch mails for a specific label and upsert into Room
    // Fetch mails for a specific label via search("label:{id}") and upsert into Room
    public void refreshByLabel(String labelId) {
        io.execute(() -> {
            try {
                // Normalize id defensively (helps if server treats ids case-insensitively)
                String lidQuery = (labelId == null ? "" : labelId.trim());
                String lidLocal = normId(labelId);
                Response<List<MailApi.MailDto>> res = api.search("label:" + lidQuery).execute();
                if (!res.isSuccessful() || res.body() == null) return;

                List<MailEntity> mails = new ArrayList<>();
                Map<String, LabelEntity> labelMap = new LinkedHashMap<>();
                List<MailLabelCrossRef> joins = new ArrayList<>();

                for (MailApi.MailDto d : res.body()) {
                    MailEntity m = new MailEntity();
                    m.id = d.id; m.fromEmail = d.from; m.toEmail = d.to;
                    m.subject = d.subject; m.content = d.content;
                    m.isSpam = d.spam; m.dateSentMillis = parseMillis(d.dateSent);
                    mails.add(m);

                    if (d.labels != null) {
                        for (com.example.gmail_android.interfaces.MailApi.LabelDto L : d.labels) {
                            if (L == null || L.id == null) continue;
                            String lid = normId(L.id);   // <-- normalize
                            LabelEntity e = labelMap.get(lid);
                            if (e == null) {
                                e = new LabelEntity();
                                e.id = lid;
                                e.name = (L.name != null) ? normName(L.name) : lid;
                                labelMap.put(lid, e);
                            }
                            MailLabelCrossRef ref = new MailLabelCrossRef();
                            ref.mailId = m.id;
                            ref.labelId = lid;           // <-- normalized
                            joins.add(ref);
                        }
                    } else {
                        // Backend didn’t include labels; attach the one we filtered by
                        if (lidLocal != null && !labelMap.containsKey(lidLocal)) {
                            LabelEntity e = new LabelEntity();
                            e.id = lidLocal;
                            e.name = lidLocal;
                            labelMap.put(lidLocal, e);
                        }
                        MailLabelCrossRef ref = new MailLabelCrossRef();
                        ref.mailId = m.id;
                        assert lidLocal != null;
                        ref.labelId = lidLocal;          // <-- normalized
                        joins.add(ref);
                    }
                }

                // Upsert ONLY; do not clear whole tables
                labelDao.insertAllIgnore(new ArrayList<>(labelMap.values()));
                for (LabelEntity e : labelMap.values()) labelDao.rename(e.id, e.name);

                dao.upsertMails(mails);
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

    public void deleteLocal(String mailId) {
        io.execute(() -> {
            dao.clearJoinsForMail(mailId);
            dao.deleteMail(mailId);
        });
    }

    // delete a mail
    public void delete(String mailId, retrofit2.Callback<okhttp3.ResponseBody> cb) {
        api.delete(mailId).enqueue(new retrofit2.Callback<okhttp3.ResponseBody>() {
            @Override
            public void onResponse(@NonNull retrofit2.Call<okhttp3.ResponseBody> call,
                                   @NonNull retrofit2.Response<okhttp3.ResponseBody> res) {
                if (res.isSuccessful()) {
                    deleteLocal(mailId);   // <-- hide immediately in Room
                }
                if (cb != null) cb.onResponse(call, res);
            }

            @Override
            public void onFailure(@NonNull retrofit2.Call<okhttp3.ResponseBody> call, @NonNull Throwable t) {
                if (cb != null) cb.onFailure(call, t);
            }
        });
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
                        labelDao.insertAllIgnore(java.util.Collections.singletonList(e));
                        labelDao.rename(e.id, e.name);
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

    // Rename label (handles 200 with body OR 204 without)
    public void renameLabel(String id, String newName, retrofit2.Callback<MailApi.LabelDto> cb) {
        api.renameLabel(id, new MailApi.RenameLabelRequest(newName))
                .enqueue(new retrofit2.Callback<MailApi.LabelDto>() {
                    @Override
                    public void onResponse(retrofit2.Call<MailApi.LabelDto> call,
                                           retrofit2.Response<MailApi.LabelDto> res) {
                        if (res.isSuccessful()) {
                            final String nameToPersist =
                                    (res.body() != null && res.body().name != null && !res.body().name.isEmpty())
                                            ? res.body().name
                                            : newName; // 204 or empty body → use the input

                            io.execute(() -> labelDao.rename(id, nameToPersist));
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

    // Fetch a user by id so we can display the profile image
    public androidx.lifecycle.LiveData<com.example.gmail_android.entities.User> getUser(int id) {
        final androidx.lifecycle.MutableLiveData<com.example.gmail_android.entities.User> live =
                new androidx.lifecycle.MutableLiveData<>();
        api.getUser(id).enqueue(new retrofit2.Callback<com.example.gmail_android.entities.User>() {
            @Override public void onResponse(retrofit2.Call<com.example.gmail_android.entities.User> call,
                                             retrofit2.Response<com.example.gmail_android.entities.User> res) {
                if (res.isSuccessful() && res.body() != null) {
                    live.postValue(res.body());
                }
            }
            @Override public void onFailure(retrofit2.Call<com.example.gmail_android.entities.User> call,
                                            Throwable t) {
                // no-op; keep default avatar
            }
        });
        return live;
    }
    // parse a date string.
    private static long parseMillis(String dateSent) {
        if (dateSent == null || dateSent.isEmpty()) return 0L;
        String s = dateSent.trim();

        // epoch millis or seconds
        if (s.matches("^-?\\d+$")) {
            try {
                long v = Long.parseLong(s);
                return (v > 9_999_999_999L) ? v : v * 1000L; // handle seconds too
            } catch (NumberFormatException ignore) {}
        }
        // last-resort fixed pattern (UTC)
        try {
            java.text.SimpleDateFormat f =
                    new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US);
            f.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            return Objects.requireNonNull(f.parse(s)).getTime();
        } catch (Exception ignore) {}

        return 0L; // deterministic fallback (avoids “now” jumping)
    }

    // Pull the full label catalog and upsert (no table clearing) so nothing disappears from the sidebar
    public void syncAllLabels() {
        io.execute(() -> {
            try {
                Response<List<MailApi.LabelDto>> res = api.getLabels().execute();
                if (!res.isSuccessful() || res.body() == null) {
                    Log.e("MailRepo", "getLabels failed: code=" + res.code());
                    return;
                }
                List<LabelEntity> items = new ArrayList<>();
                for (MailApi.LabelDto L : res.body()) {
                    if (L == null || L.id == null) continue;
                    String lid = normId(L.id);         // <-- normalize

                    LabelEntity e = new LabelEntity();
                    e.id = lid;
                    e.name = (L.name != null) ? normName(L.name) : lid;
                    items.add(e);
                }
                labelDao.insertAllIgnore(items);
                for (LabelEntity e : items) {
                    labelDao.rename(e.id, e.name);
                }
                Log.d("MailRepo", "syncAllLabels OK, items=" + items.size());
            } catch (Exception e) {
                Log.e("MailRepo", "syncAllLabels error", e);
            }
        });
    }
}

