package com.example.gmail_android.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.example.gmail_android.entities.User;
import com.example.gmail_android.repository.AuthRepository;
import com.example.gmail_android.utils.Result;

public class AuthViewModel extends AndroidViewModel {
    private final AuthRepository repo;

    public AuthViewModel(@NonNull Application app) {
        super(app);
        repo = new AuthRepository(app.getApplicationContext());
    }

    public LiveData<Result<User>> login(String email, String password) {
        return repo.login(email, password);
    }
}

