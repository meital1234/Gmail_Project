package com.example.gmail_android.interfaces;

import android.content.Context;
import com.example.gmail_android.R;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.example.gmail_android.network.AuthInterceptor;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

// configures HTTP logging, authentication interceptor.
public class ApiClient {
    // singleton instance of retrofit.
    private static Retrofit retrofit;

    // returns the singleton retrofit instance, creating it if necessary.
    public static Retrofit get(Context ctx) {
        if (retrofit == null) {
            // logs HTTP requests and responses.
            HttpLoggingInterceptor log = new HttpLoggingInterceptor();
            log.setLevel(HttpLoggingInterceptor.Level.BODY);

            // OkHttpClient with authentication and logging interceptors.
            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(new AuthInterceptor(ctx))
                    .addInterceptor(log)
                    .build();

            Gson gson = new GsonBuilder().create();

            // retrofit configuration.
            retrofit = new Retrofit.Builder()
                    .baseUrl(ctx.getString(R.string.base_url))
                    .addConverterFactory(GsonConverterFactory.create(gson))
                    .client(client)
                    .build();
        }
        return retrofit;
    }
}


