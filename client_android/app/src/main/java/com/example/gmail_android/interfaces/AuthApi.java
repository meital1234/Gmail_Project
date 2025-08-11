package com.example.gmail_android.interfaces;

import com.example.gmail_android.entities.User;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface AuthApi {
    class LoginRequest {
        public String email, password;
        public LoginRequest(String e, String p) { email = e; password = p; }
    }

    @POST("users/login")
    Call<User> login(@Body LoginRequest request);
}
