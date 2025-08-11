package com.example.gmail_android.network;

import android.content.Context;
import androidx.annotation.NonNull;
import com.example.gmail_android.auth.TokenStore;
import java.io.IOException;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

// OkHttp interceptor that automatically adds an authorization header.
public class AuthInterceptor implements Interceptor {
    // application context, used to access tokenStore without leaking activity context.
    private final Context appContext;

    // ctx the context from which to get the application context.
    public AuthInterceptor(Context ctx) {
        this.appContext = ctx.getApplicationContext();
    }

    //  intercepts all outgoing requests.
    @NonNull
    @Override public Response intercept(Chain chain) throws IOException {
        // original request.
        Request original = chain.request();

        // retrieve stored token.
        String token = TokenStore.get(appContext);
        // Create a new request builder
        Request.Builder builder = original.newBuilder();
        if (token != null && !token.isEmpty()) {
            builder.addHeader("Authorization", "Bearer " + token);
        }

        // proceed with the request.
        Response resp = chain.proceed(builder.build());

        // If the server returns 401, clear token.
        if (resp.code() == 401) {
            TokenStore.clear(appContext);
        }
        return resp;
    }
}

