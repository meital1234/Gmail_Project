package com.example.gmail_android.entities;

// the payload sent to the server when registering a new user.
public class RegisterRequest {
    public String email;
    public String password;
    public String first_name;
    public String last_name;
    public String phone_number;
    public String birthDate;
    public String gender;
    public String image;       // not mandatory.

    public RegisterRequest(String email, String password, String first_name, String last_name,
                           String phone_number, String birthDate, String gender, String image) {
        this.email = email;
        this.password = password;
        this.first_name = first_name;
        this.last_name = last_name;
        this.phone_number = phone_number;
        this.birthDate = birthDate;
        this.gender = gender;
        this.image = image;
    }
}

