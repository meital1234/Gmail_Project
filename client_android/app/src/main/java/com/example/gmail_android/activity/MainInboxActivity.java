package com.example.gmail_android.activity;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.EditText;
import java.util.Locale;
import androidx.lifecycle.ViewModelProvider;
import androidx.drawerlayout.widget.DrawerLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.core.view.GravityCompat;
import com.example.gmail_android.R;
import com.example.gmail_android.auth.TokenStore;
import com.example.gmail_android.entities.LabelEntity;
import com.example.gmail_android.viewmodel.InboxViewModel;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.example.gmail_android.repository.MailRepository;

public class MainInboxActivity extends AppCompatActivity {

    private InboxViewModel vm;
    private LabelAdapter labelAdapter;
    private MailRepository repo;

    // Protected/system labels – case-insensitive match by id or name
    private static final java.util.Set<String> PROTECTED =
            new java.util.HashSet<>(java.util.Arrays.asList(
                    "inbox", "sent", "drafts", "spam", "starred", "important", "trash", "bin", "archive", "all"
            ));

    private boolean isProtected(LabelEntity l) {
        final String n = l.name.toLowerCase(Locale.ROOT);
        final String id = l.id.toLowerCase(Locale.ROOT);
        return PROTECTED.contains(n) || PROTECTED.contains(id);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_inbox);
        repo = new MailRepository(getApplicationContext());
        DrawerLayout drawer = findViewById(R.id.drawerLayout);
        MaterialToolbar topAppBar = findViewById(R.id.topAppBar);
        RecyclerView recycler = findViewById(R.id.recycler);
        RecyclerView recyclerLabels = findViewById(R.id.recyclerLabels);
        SwipeRefreshLayout swipe = findViewById(R.id.swipe);

        setSupportActionBar(topAppBar);
        vm = new ViewModelProvider(this).get(InboxViewModel.class);
        // Hide default title (we render our own)
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayShowTitleEnabled(false);
        }

        // Open drawer on nav icon tap
        topAppBar.setNavigationOnClickListener(v -> drawer.openDrawer(GravityCompat.START));

        // Search action
        EditText etSearch = findViewById(R.id.etSearch);
        etSearch.setOnEditorActionListener((tv, actionId, event) -> {
            String q = tv.getText().toString().trim();
            if (q.isEmpty()) vm.selectAll();
            else vm.search(q);
            tv.clearFocus();
            return true;
        });

        // Theme toggle (light <-> dark)
        findViewById(R.id.btnTheme).setOnClickListener(v -> {
            int mode = androidx.appcompat.app.AppCompatDelegate.getDefaultNightMode();
            if (mode == androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES) {
                androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(
                        androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO);
            } else {
                androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(
                        androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES);
            }
        });

        // Avatar click
        findViewById(R.id.imgAvatar).setOnClickListener(v -> {
            androidx.appcompat.widget.PopupMenu pm =
                    new androidx.appcompat.widget.PopupMenu(MainInboxActivity.this, v);
            pm.getMenuInflater().inflate(R.menu.menu_profile, pm.getMenu());
            pm.setOnMenuItemClickListener(item -> {
                if (item.getItemId() == R.id.action_logout) { doLogout(); return true; }
                return false;
            });
            pm.show();
        });

        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawer, topAppBar,
                R.string.nav_open, R.string.nav_close
        );
        drawer.addDrawerListener(toggle);
        toggle.syncState(); // hooks the hamburger + accessibility strings

        // Inbox list
        recycler.setLayoutManager(new LinearLayoutManager(this));
        MailAdapter mailAdapter = new MailAdapter(new MailAdapter.Actions() {
            @Override public void onOpen(com.example.gmail_android.entities.MailWithLabels mail) {
                Intent i = new Intent(MainInboxActivity.this, MailDetailsActivity.class);
                i.putExtra("mail_id", mail.mail.id);
                startActivity(i);
            }

            @Override public void onDelete(com.example.gmail_android.entities.MailWithLabels mail) {
                new AlertDialog.Builder(MainInboxActivity.this)
                        .setTitle(R.string.delete)
                        .setMessage(getString(R.string.delete) + " \"" +
                                (mail.mail.subject == null ? "" : mail.mail.subject) + "\"?")
                        .setPositiveButton(android.R.string.ok, (d, w) -> {
                            repo.delete(mail.mail.id, new retrofit2.Callback<>() {
                                @Override
                                public void onResponse(@NonNull retrofit2.Call<okhttp3.ResponseBody> call,
                                                       @NonNull retrofit2.Response<okhttp3.ResponseBody> res) {
                                    if (!res.isSuccessful()) {
                                        android.widget.Toast.makeText(MainInboxActivity.this,
                                                "Delete failed (" + res.code() + ")", android.widget.Toast.LENGTH_SHORT).show();
                                        return;
                                    }
                                    // local Room is already cleaned by repo.deleteLocal()
                                    vm.refresh(); // sync with backend anyway
                                }

                                @Override
                                public void onFailure(
                                        @NonNull retrofit2.Call<okhttp3.ResponseBody> call, @NonNull Throwable t) {
                                    android.widget.Toast.makeText(MainInboxActivity.this,
                                            "Delete failed", android.widget.Toast.LENGTH_SHORT).show();
                                }
                            });
                        })
                        .setNegativeButton(android.R.string.cancel, null)
                        .show();
            }

            @Override public void onEdit(com.example.gmail_android.entities.MailWithLabels mail) {
                // Open composer in “edit draft” mode
                Intent i = new Intent(MainInboxActivity.this, ComposeActivity.class);
                i.putExtra("edit_mail_id", mail.mail.id);
                startActivity(i);
            }
        });
        recycler.setAdapter(mailAdapter);

        // Labels drawer list
        recyclerLabels.setLayoutManager(new LinearLayoutManager(this));
        labelAdapter = new LabelAdapter(new LabelAdapter.Actions() {
            @Override
            public void onSelect(LabelEntity label) {
                vm.selectLabel(label.id);
                drawer.closeDrawer(GravityCompat.START);
            }

            @Override
            public void onRename(LabelEntity label) {
                if (isProtected(label)) return; // ← block system labels
                final EditText input = new EditText(MainInboxActivity.this);
                input.setText(label.name);
                new AlertDialog.Builder(MainInboxActivity.this)
                        .setTitle(R.string.rename)
                        .setView(input)
                        .setPositiveButton(android.R.string.ok, (d, w) -> {
                            String newName = input.getText().toString().trim();
                            if (!newName.isEmpty() && !newName.equals(label.name)) {
                                repo.renameLabel(label.id, newName, new retrofit2.Callback<>() {
                                    @Override
                                    public void onResponse(
                                            @NonNull retrofit2.Call<com.example.gmail_android.interfaces.MailApi.LabelDto> call,
                                            @NonNull retrofit2.Response<com.example.gmail_android.interfaces.MailApi.LabelDto> res) {
                                        if (!res.isSuccessful()) {
                                            android.widget.Toast.makeText(MainInboxActivity.this,
                                                    "Rename failed (" + res.code() + ")", android.widget.Toast.LENGTH_SHORT).show();
                                            // Optional: force-refresh labels if your backend doesn’t echo the change
                                            // repo.syncAllLabels();
                                        }
                                    }

                                    @Override
                                    public void onFailure(
                                            @NonNull retrofit2.Call<com.example.gmail_android.interfaces.MailApi.LabelDto> call, @NonNull Throwable t) {
                                        android.widget.Toast.makeText(MainInboxActivity.this,
                                                "Network error", android.widget.Toast.LENGTH_SHORT).show();
                                        // Optional: repo.syncAllLabels();
                                    }
                                });
                            }
                        })
                        .setNegativeButton(android.R.string.cancel, null)
                        .show();
            }

            @Override
            public void onDelete(LabelEntity label) {
                if (isProtected(label)) return; // ← block system labels
                new AlertDialog.Builder(MainInboxActivity.this)
                        .setTitle(R.string.delete)
                        .setMessage(getString(R.string.delete) + " \"" + label.name + "\"?")
                        .setPositiveButton(android.R.string.ok, (d, w) -> {
                            repo.deleteLabel(label.id, /*cb*/ null);
                            // vm.selectAll(); // optional if currently filtering by this label
                        })
                        .setNegativeButton(android.R.string.cancel, null)
                        .show();
            }
        });
        recyclerLabels.setAdapter(labelAdapter);

        // “Add label” row
        findViewById(R.id.rowAddLabel).setOnClickListener(v -> {
            final EditText input = new EditText(MainInboxActivity.this);
            input.setHint(getString(R.string.new_label));
            new AlertDialog.Builder(MainInboxActivity.this)
                    .setTitle(R.string.add_label)
                    .setView(input)
                    .setPositiveButton(android.R.string.ok, (d, w) -> {
                        String name = input.getText().toString().trim();
                        if (!name.isEmpty()) repo.createLabel(name, null);
                    })
                    .setNegativeButton(android.R.string.cancel, null)
                    .show();
        });

        FloatingActionButton fab = findViewById(R.id.fabCompose);
        fab.setOnClickListener(v ->
                startActivity(new Intent(this, ComposeActivity.class))
        );
        // “All mail” row
        findViewById(R.id.rowAll).setOnClickListener(v -> {
            vm.selectAll();
            drawer.closeDrawer(GravityCompat.START);
        });

        // Observe filtered mails
        vm.getMails().observe(this, mails -> {
            mailAdapter.submitList(mails);
            swipe.setRefreshing(false); // stop spinner when data arrives
        });

        // Observe labels for the drawer
        vm.getLabels().observe(this, labels -> labelAdapter.submitList(labels));

        // Pull to refresh
        swipe.setOnRefreshListener(() -> vm.refresh());

        // Initial load
        vm.refresh();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        return true;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (vm != null) vm.refresh(); // so the Drafts list/Sent list updates immediately
    }
    private void doLogout() {
        TokenStore.clear(getApplicationContext());
        Intent i = new Intent(this, LoginActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
    }
}
