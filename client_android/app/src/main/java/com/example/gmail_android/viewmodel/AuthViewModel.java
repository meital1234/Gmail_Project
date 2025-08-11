package com.example.gmail_android.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import com.example.gmail_android.repository.AuthRepository;
import com.example.gmail_android.utils.Result;

// responsible for handling authentication logic between the UI and AuthRepository.
public class AuthViewModel extends AndroidViewModel {
    // repository that manages authentication API calls and token storage.
    private final AuthRepository repo;

    // constructor initializes the ViewModel and its repository.
    public AuthViewModel(@NonNull Application app) {
        super(app);
        repo = new AuthRepository(app.getApplicationContext());
    }

    // attempts to log in with the provided email and password.
    public LiveData<Result<String>> login(String email, String password) {
        return repo.login(email, password);
    }
}
