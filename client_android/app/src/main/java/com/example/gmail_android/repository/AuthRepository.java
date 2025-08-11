package com.example.gmail_android.repository;

import android.content.Context;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.gmail_android.interfaces.ApiClient;
import com.example.gmail_android.interfaces.AuthApi;
import com.example.gmail_android.entities.User;
import com.example.gmail_android.utils.Result;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AuthRepository {
    private final AuthApi api;

    public AuthRepository(Context ctx) {
        api = ApiClient.get(ctx).create(AuthApi.class);
    }

    public LiveData<Result<User>> login(String email, String password) {
        MutableLiveData<Result<User>> data = new MutableLiveData<>();
        data.setValue(Result.loading());

        AuthApi.LoginRequest req = new AuthApi.LoginRequest(email, password);

        api.login(req).enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    data.setValue(Result.success(response.body()));
                } else {
                    data.setValue(Result.error("Login failed"));
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t) {
                data.setValue(Result.error(t.getMessage()));
            }
        });
        return data;
    }
}
