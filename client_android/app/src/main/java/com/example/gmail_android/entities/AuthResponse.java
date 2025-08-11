package com.example.gmail_android.entities;

// represents the authentication response returned by the server.
public class AuthResponse {
    // the authentication token.
    public String token;
    // the expiry information for the token.
    public String expiresIn;
}
