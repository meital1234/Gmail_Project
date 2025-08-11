package com.example.gmail_android.activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.lifecycle.ViewModelProvider;

import com.example.gmail_android.R;
import com.example.gmail_android.utils.Result;
import com.example.gmail_android.viewmodel.AuthViewModel;

public class LoginActivity extends ComponentActivity {

    private AuthViewModel vm;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        vm = new ViewModelProvider(this).get(AuthViewModel.class);

        EditText emailInput = findViewById(R.id.emailInput);
        EditText passwordInput = findViewById(R.id.passwordInput);
        Button loginButton = findViewById(R.id.loginButton);
        TextView signupLink = findViewById(R.id.signupLink);

        loginButton.setOnClickListener(v -> {
            String email = emailInput.getText().toString().trim();
            String pass = passwordInput.getText().toString();

            vm.login(email, pass).observe(this, result -> {
                if (result.status == Result.Status.SUCCESS) {
                    Toast.makeText(this, "Logged in!", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(this, MainInboxActivity.class));
                    finish();
                } else if (result.status == Result.Status.ERROR) {
                    Toast.makeText(this, "Error: " + result.message, Toast.LENGTH_SHORT).show();
                }
            });
        });

        signupLink.setOnClickListener(v ->
                startActivity(new Intent(this, RegisterActivity.class)));
    }
}

