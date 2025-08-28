package com.example.gmail_android.interfaces;

import com.google.gson.annotations.SerializedName;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

// interface for making API calls related to mails, labels, and user information.
public interface MailApi {
    // get all mails in the inbox.
    @GET("mails")
    Call<List<MailDto>> getInbox();

    // get a specific mail by its id.
    @GET("mails/{id}")
    Call<MailDto> getMail(@Path("id") String id);

    // search for mails by query string.
    @GET("mails/search/{q}")
    Call<List<MailDto>> search(@Path("q") String q);

    // send a new mail.
    @POST("mails")
    Call<MailDto> send(@Body ComposeRequest req);

    // edit an existing mail. (for spam)
    @PATCH("mails/{id}")
    Call<MailDto> edit(@Path("id") String id, @Body EditRequest req);

    // delete a mail by id. (for spam)
    @DELETE("mails/{id}")
    Call<ResponseBody> delete(@Path("id") String id);

    // add a label to a specific mail.
    @POST("mails/{id}/labels/{labelId}")
    Call<ResponseBody> addLabel(@Path("id") String mailId, @Path("labelId") String labelId);

    // remove a label from a specific mail.
    @DELETE("mails/{id}/labels/{labelId}")
    Call<ResponseBody> removeLabel(@Path("id") String mailId, @Path("labelId") String labelId);

    // get all labels.
    @GET("labels")
    Call<List<MailApi.LabelDto>> getLabels();

    // create a new label.
    @POST("labels")
    Call<LabelDto> createLabel(@Body CreateLabelRequest req);

    // get authenticated user's details.
    @GET("users/me")
    Call<UserDto> me();

    // rename an existing label
    @PUT("labels/{id}")
    Call<LabelDto> renameLabel(@Path("id") String id,
                               @Body RenameLabelRequest req);

    // delete a label
    @DELETE("labels/{id}")
    Call<ResponseBody> deleteLabel(@Path("id") String id);

    // label data transfer object.
    class LabelDto {
        public String id;
        public String name;
    }

    // request body for creating a label.
    class CreateLabelRequest {
        public String name;
        public CreateLabelRequest(String n){ name=n; }
    }

    class RenameLabelRequest {
        public String name;
        public RenameLabelRequest(String name) { this.name = name; }
    }

    // mail data transfer object.
    class MailDto {
        public String id;
        public String from;
        public String to;
        public String subject;
        public String content;

        // store date as String.
        @SerializedName("dateSent")
        public String dateSent;

        public List<LabelDto> labels;
        // if a spam field exist.
        public boolean spam;
    }

    // request body for composing a mail.
    class ComposeRequest {
        @SerializedName("toEmail") public String toEmail;
        public String subject;
        public String content;
        public List<String> labels; // optional.
    }

    // request body for editing a mail.
    class EditRequest {
        @SerializedName("toEmail") public String toEmail;
        public String subject;
        public String content;
        public List<String> labels;
    }

    // user data transfer object.
    class UserDto {
        public String id;
        @SerializedName("first_name") public String first_name;
        @SerializedName("last_name")  public String last_name;
        public String email;
    }
}

