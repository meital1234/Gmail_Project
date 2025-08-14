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

    private final MailApi api;
    private final MailDao dao;
    private final Executor io = Executors.newSingleThreadExecutor();

    public MailRepository(Context ctx) {
        retrofit2.Retrofit retrofit = ApiClient.get(ctx);
        Log.d("API", "Retrofit baseUrl=" + retrofit.baseUrl());
        this.api = retrofit.create(MailApi.class);
        this.dao = AppDatabase.get(ctx).mailDao();
    }


    /* ===== LiveData ל־UI ===== */
    public LiveData<List<MailWithLabels>> getInboxLive() {
        return dao.getInbox();
    }

    public void refreshInbox() {
        io.execute(() -> {
            try {
                Response<List<MailApi.MailDto>> res = api.getInbox().execute();
                if (!res.isSuccessful() || res.body() == null) {
                    Log.e("MailRepo", "getInbox failed: code=" + res.code() + ", msg=" + res.message());
//                    try {
//                        if (res.errorBody() != null) {
//                            Log.e("MailRepo", "errorBody=" + res.errorBody().string());
//                        }
//                    } catch (Exception ignore) {}
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

                // עדכון ה-DB
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

    // 1) LiveData למייל בודד לפי id (ל־MailDetailsActivity)
    public LiveData<MailWithLabels> getMailLive(String id) {
        return dao.getById(id);
    }

    // 2) ריענון ממוקד מהשרת של מייל בודד ושמירה ב-Room (כולל עדכון תוויות)
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

                // עדכון ממוקד ב-DB
                dao.upsertMails(java.util.Collections.singletonList(m));
                dao.upsertLabels(new ArrayList<>(labelMap.values()));
                dao.clearJoinsForMail(id);     // מחיקת הקשרים הישנים של המייל הזה בלבד
                dao.upsertMailLabel(joins);

            } catch (Exception ignore) {}
        });
    }

    /* ===== שליחה/עריכה/מחיקה ===== */

    public void send(String toEmail, String subject, String content, List<String> labels,
                     Callback<MailApi.MailDto> cb) {
        MailApi.ComposeRequest req = new MailApi.ComposeRequest();
        req.toEmail = toEmail;
        req.subject = subject;
        req.content = content;
        req.labels  = labels;
        api.send(req).enqueue(cb);
    }

    public void edit(String mailId, String toEmail, String subject, String content, List<String> labels,
                     Callback<MailApi.MailDto> cb) {
        MailApi.EditRequest req = new MailApi.EditRequest();
        req.toEmail = toEmail;
        req.subject = subject;
        req.content = content;
        req.labels  = labels;
        api.edit(mailId, req).enqueue(cb);
    }

    public void delete(String mailId, Callback<ResponseBody> cb) {
        api.delete(mailId).enqueue(cb);
    }

    public void addLabel(String mailId, String labelId, Callback<ResponseBody> cb) {
        api.addLabel(mailId, labelId).enqueue(cb);
    }

    public void removeLabel(String mailId, String labelId, Callback<ResponseBody> cb) {
        api.removeLabel(mailId, labelId).enqueue(cb);
    }

    /* ===== עזר ===== */
    private static long parseMillis(String dateSent) {
        if (dateSent == null) return System.currentTimeMillis();
        String s = dateSent.trim();
        if (s.matches("^-?\\d+$")) { // "מספר" או "מחרוזת מספרית"
            try { return Long.parseLong(s); } catch (NumberFormatException ignore) {}
        }
        return System.currentTimeMillis();
    }
}

