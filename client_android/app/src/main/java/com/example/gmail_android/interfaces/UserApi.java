package com.example.gmail_android.interfaces;

import com.example.gmail_android.entities.RegisterRequest;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

// defines the endpoint for creating/registering a new user.
public interface UserApi {
    //  sends a registration request to the server.
    // POST /api/users.
    @POST("users")
    Call<ResponseBody> createUser(@Body RegisterRequest req);
}
