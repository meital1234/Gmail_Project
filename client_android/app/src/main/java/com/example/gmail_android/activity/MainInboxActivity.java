package com.example.gmail_android.activity;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;

import androidx.activity.ComponentActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.example.gmail_android.R;
import com.example.gmail_android.auth.TokenStore;
import com.example.gmail_android.viewmodel.InboxViewModel;
import com.google.android.material.appbar.MaterialToolbar;

public class MainInboxActivity extends ComponentActivity {

    private InboxViewModel vm;
    private MailAdapter adapter;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_inbox);

        // Toolbar + Logout
        MaterialToolbar top = findViewById(R.id.topAppBar);
        top.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == R.id.action_logout) {
                TokenStore.clear(getApplicationContext());
                Intent i = new Intent(this, LoginActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(i);
                finish();
                return true;
            }
            return false;
        });

        RecyclerView rv = findViewById(R.id.recycler);
        rv.setLayoutManager(new LinearLayoutManager(this));
        adapter = new MailAdapter(item -> {
            Intent it = new Intent(this, MailDetailsActivity.class);
            it.putExtra("mail_id", item.mail.id);
            startActivity(it);
        });
        rv.setAdapter(adapter);

        vm = new ViewModelProvider(this).get(InboxViewModel.class);
        vm.inbox.observe(this, adapter::submitList);

        SwipeRefreshLayout srl = findViewById(R.id.swipe);
        srl.setOnRefreshListener(() -> {
            vm.refresh();
            srl.setRefreshing(false);
        });

        findViewById(R.id.fabCompose).setOnClickListener(v -> {
            startActivity(new android.content.Intent(this, ComposeActivity.class));
        });

        vm.refresh(); // first load.
    }

    @Override public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_inbox, menu);
        return true;
    }

    @Override public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_logout) {
            TokenStore.clear(getApplicationContext());
            Intent i = new Intent(this, LoginActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
