package com.example.gmail_android.auth;

import android.content.Context;

public class TokenStore {
    //  name of file for storing authentication data.
    private static final String PREFS = "auth_prefs";
    // key where the JWT or auth token is stored.
    private static final String KEY_TOKEN = "token";

    // saves the given token into persistent storage.
    public static void save(Context ctx, String token) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY_TOKEN, token).apply();
    }

    // retrieves the stored token.
    public static String get(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_TOKEN, null); // returns null if no token is saved.
    }

    // checks if a token exists and is not empty.
    public static boolean has(Context ctx) {
        String t = get(ctx);
        return t != null && !t.isEmpty();
    }

    // clears the stored token (used for logout).
    public static void clear(Context ctx) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().remove(KEY_TOKEN).apply();
    }
}

