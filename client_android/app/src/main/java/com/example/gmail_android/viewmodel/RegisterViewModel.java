package com.example.gmail_android.viewmodel;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import com.example.gmail_android.entities.RegisterRequest;
import com.example.gmail_android.repository.UserRepository;
import com.example.gmail_android.utils.Result;

// responsible for handling user registration logic.
public class RegisterViewModel extends AndroidViewModel {
    // repository that manages user registration API calls.
    private final UserRepository repo;

    // constructor initializes the ViewModel and its repository.
    public RegisterViewModel(@NonNull Application app) {
        super(app);
        repo = new UserRepository(app.getApplicationContext());
    }

    // registers a new user with the provided details.
    public LiveData<Result<String>> register(
            String email,
            String password,
            String firstName,
            String lastName,
            String phone,
            String birthDate,
            String gender,
            String image) {
        RegisterRequest req = new RegisterRequest(
                email,
                password,
                firstName,
                lastName,
                phone,
                birthDate,
                gender,
                image);
        return repo.register(req);
    }
}

