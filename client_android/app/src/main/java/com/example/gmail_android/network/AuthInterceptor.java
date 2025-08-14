package com.example.gmail_android.network;

import android.util.Log;
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
    public Response intercept(Chain chain) throws IOException {
        String token = TokenStore.get(appContext);

        // the original request.
        Request req = chain.request();

        if (token != null && !token.isEmpty()) {
            Log.d("AuthInt", "Adding Authorization header. url=" + req.url());
            req = req.newBuilder()
                    .addHeader("Authorization", "Bearer " + token)
                    .build();
        } else {
            Log.w("AuthInt", "No token – sending without Authorization. url=" + req.url());
        }

        // sending the request.
        Response resp = chain.proceed(req);

        Log.d("AuthInt",
                "Response " + resp.code() + " for " + req.method() + " " + req.url());
        if (resp.code() == 401) {
            Log.w("AuthInt", "401 -> clearing token");
            TokenStore.clear(appContext);
        }

        return resp;
    }
}

