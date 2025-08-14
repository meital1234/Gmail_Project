package com.example.gmail_android.repository;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.gmail_android.interfaces.ApiClient;
import com.example.gmail_android.interfaces.AuthApi;
import com.example.gmail_android.entities.AuthResponse;
import com.example.gmail_android.utils.Result;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

// responsible for handling authentication operations.
public class AuthRepository {
    // retrofit API interface for authentication.
    private final AuthApi api;
    // local storage for saving JWT token.
    private final SharedPreferences prefs;

    // initializes the repository with API client and SharedPreferences.
    public AuthRepository(Context ctx) {
        api = ApiClient.get(ctx).create(AuthApi.class);
        prefs = ctx.getSharedPreferences("auth", Context.MODE_PRIVATE);
    }

    // attempts to log in with the given credentials.
    public LiveData<Result<String>> login(String email, String password) {
        MutableLiveData<Result<String>> data = new MutableLiveData<>();
        data.setValue(Result.loading());

        AuthApi.LoginRequest req = new AuthApi.LoginRequest(email, password);

        api.login(req).enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(@NonNull Call<AuthResponse> call,
                                   @NonNull Response<AuthResponse> res) {
                if (res.isSuccessful() && res.body() != null && res.body().token != null) {
                    // save JWT token to SharedPreferences.
                    prefs.edit().putString("jwt", res.body().token).apply();
                    data.setValue(Result.success(res.body().token));
                } else {
                    data.setValue(Result.error("Invalid credentials"));
                }
            }
            @Override
            public void onFailure(@NonNull Call<AuthResponse> call, @NonNull Throwable t) {
                data.setValue(Result.error(t.getMessage()));
            }
        });

        return data;
    }
}
