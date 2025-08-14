package com.example.gmail_android.repository;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.gmail_android.entities.RegisterRequest;
import com.example.gmail_android.interfaces.UserApi;
import com.example.gmail_android.interfaces.ApiClient;
import com.example.gmail_android.utils.Result;
import okhttp3.ResponseBody;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;

// responsible for user-related network operations.
public class UserRepository {

    private final Retrofit retrofit;
    private final UserApi api;

    // initializes the repository with Retrofit API client and UserApi interface.
    public UserRepository(Context ctx) {
        retrofit = ApiClient.get(ctx);
        api = retrofit.create(UserApi.class);
    }

    // registers a new user by sending a POST request to `/users`.
    public LiveData<Result<String>> register(RegisterRequest req) {
        MutableLiveData<Result<String>> live = new MutableLiveData<>();
        live.setValue(Result.loading());

        api.createUser(req).enqueue(new Callback<ResponseBody>() {
            @Override public void onResponse(@NonNull Call<ResponseBody> call,
                                             @NonNull Response<ResponseBody> response) {
                if (response.code() == 201) {
                    // user created successfully.
                    live.setValue(Result.success("created"));
                } else {
                    // default error message.
                    String msg = "Registration failed";
                    try (ResponseBody errBody = response.errorBody()) {
                        if (errBody != null) {
                            String s = errBody.string();
                            JSONObject o = new JSONObject(s);
                            if (o.has("error")) {
                                msg = o.getString("error");
                            }
                        }
                    } catch (Exception ignored) {}
                    live.setValue(Result.error(msg));
                }
            }
            @Override public void onFailure(@NonNull Call<ResponseBody> call,
                                            @NonNull Throwable t) {
                live.setValue(Result.error("Network error: " + t.getMessage()));
            }
        });

        return live;
    }
}

