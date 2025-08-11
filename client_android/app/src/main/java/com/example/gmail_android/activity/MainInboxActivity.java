package com.example.gmail_android.activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import androidx.activity.ComponentActivity;

import com.example.gmail_android.R;
import com.example.gmail_android.auth.TokenStore;

public class MainInboxActivity extends ComponentActivity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_inbox);

        Button logoutBtn = findViewById(R.id.logoutBtn);
        logoutBtn.setOnClickListener(v -> {
            // deleting token.
            TokenStore.clear(getApplicationContext());
            // return to Login and clear the back stack.
            Intent i = new Intent(this, LoginActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
        });
    }
}


