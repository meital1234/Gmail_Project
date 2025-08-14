package com.example.gmail_android.interfaces;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

public interface MailApi {
    @GET("mails")
    Call<List<MailDto>> getInbox();

    @GET("mails/{id}")
    Call<MailDto> getMail(@Path("id") String id);

    @GET("mails/search/{q}")
    Call<List<MailDto>> search(@Path("q") String q);

    @POST("mails")
    Call<MailDto> send(@Body ComposeRequest req);

    @PATCH("mails/{id}")
    Call<MailDto> edit(@Path("id") String id, @Body EditRequest req);

    @DELETE("mails/{id}")
    Call<ResponseBody> delete(@Path("id") String id);

    // תוויות למייל (כמו ב-React: POST/DELETE)
    @POST("mails/{id}/labels/{labelId}")
    Call<ResponseBody> addLabel(@Path("id") String mailId, @Path("labelId") String labelId);

    @DELETE("mails/{id}/labels/{labelId}")
    Call<ResponseBody> removeLabel(@Path("id") String mailId, @Path("labelId") String labelId);

    // -------- Labels --------
    // לפעמים חוזר [] ולפעמים { labels: [...] } — נטפל בזה בריפו
    @GET("labels")
    Call<Object> getLabels();

    @POST("labels")
    Call<LabelDto> createLabel(@Body CreateLabelRequest req);
    @GET("users/me")
    Call<UserDto> me();

    // ===== DTOs =====
    public static class LabelDto {
        public String id;
        public String name;
    }

    class CreateLabelRequest { public String name; public CreateLabelRequest(String n){ name=n; } }

    public static class MailDto {
        public String id;
        public String from;
        public String to;
        public String subject;
        public String content;

        // כדי לא להיתקע עם API26, נקבל כמחרוזת ונפרסר ללונג בריפו
        @SerializedName("dateSent")
        public String dateSent;

        public List<LabelDto> labels;
        public boolean spam; // אם יש שדה כזה בשרת
    }

    public static class ComposeRequest {
        // ב-React שלחת toEmail; נשמור על אותו שם
        @SerializedName("toEmail") public String toEmail;
        public String subject;
        public String content;
        public List<String> labels; // אופציונלי
    }

    public static class EditRequest {
        // ב-React ב-PATCH שלחת toEmail/subject/content/labels (שמות תוויות)
        @SerializedName("toEmail") public String toEmail;
        public String subject;
        public String content;
        public List<String> labels;
    }

    public static class UserDto {
        public String id;
        @SerializedName("first_name") public String first_name;
        @SerializedName("last_name")  public String last_name;
        public String email;
    }
}

