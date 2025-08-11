package com.example.gmail_android.interfaces;

import com.example.gmail_android.entities.AuthResponse;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

// defines endpoints and request/response models for login.
public interface AuthApi {

    // represents the request body for the login endpoint.
    class LoginRequest {
        public String email, password;
        public LoginRequest(String e, String p) { email = e; password = p; }
    }

    //retrieves an authentication token from the server.
    // POST /api/tokens.
    @POST("tokens")
    Call<AuthResponse> login(@Body LoginRequest request);
}

