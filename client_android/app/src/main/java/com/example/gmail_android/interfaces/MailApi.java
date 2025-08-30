package com.example.gmail_android.interfaces;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

public interface MailApi {

    // Inbox + single mail
    @GET("mails")
    Call<List<MailDto>> getInbox();

    @GET("mails/{id}")
    Call<MailDto> getMail(@Path("id") String id);

    // Search (we pass things like "label:{id}" or free text)
    @GET("mails/search/{q}")
    Call<List<MailDto>> search(@Path("q") String q);

    // Compose / edit / delete message
    @POST("mails")
    Call<MailDto> send(@Body ComposeRequest req);

    @PATCH("mails/{id}")
    Call<MailDto> edit(@Path("id") String id, @Body EditRequest req);

    @DELETE("mails/{id}")
    Call<ResponseBody> delete(@Path("id") String id);

    // Label on a specific mail
    @POST("mails/{id}/labels/{labelId}")
    Call<ResponseBody> addLabel(@Path("id") String mailId, @Path("labelId") String labelId);

    @DELETE("mails/{id}/labels/{labelId}")
    Call<ResponseBody> removeLabel(@Path("id") String mailId, @Path("labelId") String labelId);

    // Label catalog
    @GET("labels")
    Call<List<LabelDto>> getLabels();

    // Create / rename / delete label
    @POST("labels")
    Call<LabelDto> createLabel(@Body CreateLabelRequest req);

    @PATCH("labels/{id}")
    Call<LabelDto> renameLabel(@Path("id") String id, @Body RenameLabelRequest req);

    @DELETE("labels/{id}")
    Call<ResponseBody> deleteLabel(@Path("id") String id);

    // Me
    @GET("users/me")
    Call<UserDto> me();

    // ===== DTOs =====
    class LabelDto { public String id; public String name; }

    class CreateLabelRequest { public String name; public CreateLabelRequest(String n){ name = n; } }

    class RenameLabelRequest { public String name; public RenameLabelRequest(String n){ name = n; } }

    class MailDto {
        public String id;
        public String from;
        public String to;
        public String subject;
        public String content;
        @SerializedName("dateSent") public String dateSent;
        public List<LabelDto> labels;
        public boolean spam;
    }

    class ComposeRequest {
        @SerializedName("toEmail") public String toEmail;
        public String subject;
        public String content;
        public List<String> labels;
    }

    class EditRequest {
        @SerializedName("toEmail") public String toEmail;
        public String subject;
        public String content;
        public List<String> labels;
    }

    class UserDto {
        public String id;
        @SerializedName(value = "image") public String avatarUrl;
        public String email;
    }
}