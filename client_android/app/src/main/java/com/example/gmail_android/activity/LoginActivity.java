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
import com.example.gmail_android.auth.TokenStore;


public class LoginActivity extends ComponentActivity {

    private AuthViewModel vm;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // if there is already a token, then go straight in.
        if (TokenStore.has(this)) {
            Intent i = new Intent(this, MainInboxActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            finish();
            return;
        }
        setContentView(R.layout.activity_login);

        //  viewModel usage follows MVVM and respects lifecycle.
        vm = new ViewModelProvider(this).get(AuthViewModel.class);

        // UI references.
        EditText emailInput = findViewById(R.id.emailInput);
        EditText passwordInput = findViewById(R.id.passwordInput);
        Button loginButton = findViewById(R.id.loginButton);
        TextView signupLink = findViewById(R.id.signupLink);

        loginButton.setOnClickListener(v -> {
            String email = emailInput.getText().toString().trim();
            String pass  = passwordInput.getText().toString();

            // email validation.
            if (!email.matches(".+@.+\\..+")) {
                emailInput.setError(getString(R.string.invalid_email));
                return;
            }

            // checks password length.
            if (pass.length() < 8) {
                passwordInput.setError(getString(R.string.password_min_8));
                return;
            }

            // disables button to prevent multiple login attempts.
            loginButton.setEnabled(false);

            // observe login result from ViewModel.
            vm.login(email, pass).observe(this, result -> {
                if (result.status == Result.Status.SUCCESS) {
                    // saves token on successful login.
                    TokenStore.save(getApplicationContext(), result.data);
                    Toast.makeText(this, "Logged in!", Toast.LENGTH_SHORT).show();
                    // navigates to inbox and finishes this activity.
                    startActivity(new Intent(this, MainInboxActivity.class));
                    finish();
                } else if (result.status == Result.Status.ERROR) {
                    // re-enables login button so user can try again.
                    loginButton.setEnabled(true);
                    // consider showing user-friendly error.
                    Toast.makeText(this, "Error: " + result.message, Toast.LENGTH_SHORT).show();
                }
            });
        });

        // navigates to registration screen when user clicks signup link.
        signupLink.setOnClickListener(v ->
                startActivity(new Intent(this, RegisterActivity.class)));
    }
}
