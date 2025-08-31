package com.example.gmail_android.auth;

import android.content.Context;

public class TokenStore {
    private static final String PREFS = "auth_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER_ID = "user_id";

    // --- public API ---

    // Use when you only have the token (e.g., login response)
    public static void save(Context ctx, String token) {
        int parsedId = extractUserIdFromToken(token);
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_TOKEN, token)
                .putInt(KEY_USER_ID, parsedId)
                .apply();
    }

    public static String get(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(KEY_TOKEN, null);
    }

    public static int getUserId(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getInt(KEY_USER_ID, -1);
    }

    public static boolean has(Context ctx) {
        String t = get(ctx);
        return t != null && !t.isEmpty();
    }

    public static void clear(Context ctx) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(KEY_TOKEN)
                .remove(KEY_USER_ID)
                .apply();
    }

    // --- helper ---

    // Tries to parse tokens like "token-123" → 123 ; returns -1 if not parsable.
    private static int extractUserIdFromToken(String token) {
        if (token == null) return -1;
        int dash = token.lastIndexOf('-');
        if (dash >= 0 && dash + 1 < token.length()) {
            try {
                return Integer.parseInt(token.substring(dash + 1));
            } catch (NumberFormatException ignored) {}
        }
        return -1;
    }
}