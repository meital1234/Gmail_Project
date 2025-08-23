package com.example.gmail_android.activity;

import android.app.DatePickerDialog;
import android.content.ContentResolver;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.widget.*;
import androidx.activity.ComponentActivity;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.lifecycle.ViewModelProvider;
import com.example.gmail_android.R;
import com.example.gmail_android.viewmodel.RegisterViewModel;
import com.example.gmail_android.utils.Result;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Calendar;
import java.util.Locale;

public class RegisterActivity extends ComponentActivity {

    //  UI components for navigation and displaying errors.
    private ViewFlipper flipper;
    private ProgressBar progress;
    private Button backBtn, nextBtn, pickImageBtn;
    private TextView err, imageName;

    // inputs.
    private EditText firstName, lastName, birthDate, phone, email, password, confirmPassword;
    private Spinner gender;

    // registration.
    private int step = 0; // 0..4
    private String imageDataUrl = null;

    private RegisterViewModel vm;

    // for picking an image from gallery.
    private final ActivityResultLauncher<String> pickImage =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (uri != null) handlePickedImage(uri);
            });

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        // handles registration logic and communicates with backend.
        vm = new ViewModelProvider(this).get(RegisterViewModel.class);

        // Bind UI elements.
        flipper = findViewById(R.id.stepFlipper);
        progress = findViewById(R.id.progress);
        backBtn = findViewById(R.id.backBtn);
        nextBtn = findViewById(R.id.nextBtn);
        err = findViewById(R.id.errorText);
        pickImageBtn = findViewById(R.id.pickImageBtn);
        imageName = findViewById(R.id.imageName);

        firstName = findViewById(R.id.firstNameInput);
        lastName  = findViewById(R.id.lastNameInput);
        birthDate = findViewById(R.id.inputBirthDate);
        phone     = findViewById(R.id.phoneInput);
        email     = findViewById(R.id.emailInput);
        password  = findViewById(R.id.passwordInput);
        confirmPassword = findViewById(R.id.confirmPasswordInput);
        gender    = findViewById(R.id.genderSpinner);

        // disable soft keyboard for date field and open date picker instead.
        birthDate.setShowSoftInputOnFocus(false);
        birthDate.setOnClickListener(v -> openDatePicker(birthDate));
        birthDate.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) openDatePicker(birthDate);
        });

        // gender spinner items
        ArrayAdapter<String> gAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_dropdown_item,
                new String[]{"Select gender","Male","Female","Rather not say","Other"});
        gender.setAdapter(gAdapter);

        // image picker.
        pickImageBtn.setOnClickListener(v -> pickImage.launch("image/*"));

        // back button, go to previous step.
        backBtn.setOnClickListener(v -> {
            if (step > 0) { step--; updateUi(); }
        });

        // next/Register button, validate current step and proceed.
        nextBtn.setOnClickListener(v -> {
            err.setText("");
            if (!validateCurrentStep()) return;

            if (step < 4) { // next step
                step++;
                updateUi();
            } else {
                // submit (attempt registration).
                nextBtn.setEnabled(false);
                backBtn.setEnabled(false);

                vm.register(
                        email.getText().toString().trim(),
                        password.getText().toString(),
                        firstName.getText().toString().trim(),
                        lastName.getText().toString().trim(),
                        phone.getText().toString().trim(),
                        birthDate.getText().toString().trim(), // yyyy-mm-dd
                        gender.getSelectedItem().toString(),
                        imageDataUrl
                ).observe(this, result -> {
                    if (result.status == Result.Status.SUCCESS) {
                        Toast.makeText(this, "Registered! Please login.",
                                Toast.LENGTH_SHORT).show();
                        finish(); // return to login.
                    } else if (result.status == Result.Status.ERROR) {
                        nextBtn.setEnabled(true);
                        backBtn.setEnabled(true);
                        err.setText(result.message);
                    }
                });
            }
        });

        updateUi();
    }

    // update UI components based on current step.
    private void updateUi() {
        flipper.setDisplayedChild(step);
        progress.setProgress(step);
        backBtn.setEnabled(step > 0);
        nextBtn.setText(step < 4 ? "Next" : "Register");
    }

    // validate the form fields for the current step.
    private boolean validateCurrentStep() {
        switch (step) {
            case 0:
                if (firstName.getText().toString().trim().isEmpty()) {
                    firstName.setError("Please fill in your first name");
                    return false;
                }
                return true;

            case 1:
                String bd = birthDate.getText().toString().trim();
                String phoneStr = phone.getText().toString().trim();
                if (bd.isEmpty() || gender.getSelectedItemPosition() == 0 || phoneStr.isEmpty()) {
                    err.setText(R.string.err_fill_personal);
                    return false;
                }
                // YYYY-MM-DD format check.
                if (!bd.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    err.setText(R.string.err_birth_format);
                    return false;
                }
                if (!phoneStr.matches("^[0-9]{9,15}$")) {
                    err.setText(R.string.err_phone_digits);
                    return false;
                }
                // age validation (minimum 10 years).
                try {
                    String[] p = bd.split("-");
                    int y = Integer.parseInt(p[0]);
                    int m = Integer.parseInt(p[1]);
                    int d = Integer.parseInt(p[2]);
                    Calendar now = Calendar.getInstance();
                    int age = now.get(Calendar.YEAR) - y;
                    int mm = (now.get(Calendar.MONTH) + 1) - m;
                    int dd = now.get(Calendar.DAY_OF_MONTH) - d;
                    if (mm < 0 || (mm == 0 && dd < 0)) age--;
                    if (age < 10) {
                        err.setText(R.string.err_age_min);
                        return false;
                    }
                } catch (Exception e) {
                    err.setText(R.string.err_birth_format);
                    return false;
                }
                return true;

            case 2:
                String em = email.getText().toString().trim();
                if (em.isEmpty()) { err.setText(R.string.err_email_required); return false; }
                if (!em.endsWith("@bloomly.com"))
                { err.setText(R.string.err_email_domain);return false; }
                return true;

            case 3:
                String p1 = password.getText().toString();
                String p2 = confirmPassword.getText().toString();
                if (p1.isEmpty() || p2.isEmpty()) { err.setText(R.string.err_password_both);
                    return false; }
                if (!p1.equals(p2)) { err.setText(R.string.err_password_match); return false; }
                if (!p1.matches("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$")) {
                    err.setText(R.string.err_password_rules);
                    return false;
                }
                return true;

            case 4:
                // optional image upload step.
                return true;
        }
        return true;
    }

    // opens a DatePicker dialog with age restriction (min 10 years old).
    private void openDatePicker(EditText target) {
        int year = 2000, month = 0, day = 1;                //  default date.
        String txt = target.getText().toString().trim();
        if (txt.matches("\\d{4}-\\d{2}-\\d{2}")) {
            try {
                String[] p = txt.split("-");
                year = Integer.parseInt(p[0]);
                month = Integer.parseInt(p[1]) - 1; // 0-based
                day = Integer.parseInt(p[2]);
            } catch (Exception ignore) {}
        }

        DatePickerDialog dp = new DatePickerDialog(
                this,
                (view, y, m, d) -> {
                    String formatted = String.format(Locale.US,
                            "%04d-%02d-%02d", y, m + 1, d);
                    target.setText(formatted);
                },
                year, month, day
        );

        // not allowing future selection (<10 years from now).
        Calendar max = Calendar.getInstance();
        max.add(Calendar.YEAR, -10);
        dp.getDatePicker().setMaxDate(max.getTimeInMillis());

        dp.show();
    }

    // handles selected image.
    private void handlePickedImage(Uri uri) {
        try {
            ContentResolver cr = getContentResolver();
            String mime = cr.getType(uri);
            if (mime == null) mime = "image/jpeg";
            /// ///
            InputStream is = cr.openInputStream(uri);
            if (is == null) {
                err.setText(R.string.err_read_image_null);
                return;
            }

            byte[] bytes;
            // auto-close inputStream.
            try (is) {
                bytes = readAll(is);
            }

            // // 1MB limit.
            if (bytes.length > 1_000_000) {
                err.setText(R.string.err_image_too_large);
                imageDataUrl = null;
                imageName.setText(R.string.no_file_chosen);
                return;
            }
            String b64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
            imageDataUrl = "data:" + mime + ";base64," + b64;
            imageName.setText(R.string.image_selected);
        } catch (Exception e) {
            err.setText(getString(R.string.err_read_image, e.getMessage()));
        }
    }

    // reads entire inputStream into byte array (auto-closes the stream).
    private static byte[] readAll(InputStream in) throws Exception {
        try (in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            return out.toByteArray();
        }
    }
}
