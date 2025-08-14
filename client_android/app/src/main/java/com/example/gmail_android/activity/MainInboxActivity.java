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

    // ViewModel to manage inbox data.
    private InboxViewModel vm;
    // adapter to display mail items.
    private MailAdapter adapter;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_inbox);

        // toolbar with logout option.
        MaterialToolbar top = findViewById(R.id.topAppBar);
        top.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == R.id.action_logout) {
                // clear stored token and navigate to login screen.
                TokenStore.clear(getApplicationContext());
                Intent i = new Intent(this, LoginActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(i);
                finish();
                return true;
            }
            return false;
        });

        // RecyclerView to display emails.
        RecyclerView rv = findViewById(R.id.recycler);
        rv.setLayoutManager(new LinearLayoutManager(this));
        adapter = new MailAdapter(item -> {
            // when a mail item is clicked, open the details screen.
            Intent it = new Intent(this, MailDetailsActivity.class);
            it.putExtra("mail_id", item.mail.id);
            startActivity(it);
        });
        rv.setAdapter(adapter);

        // initialize ViewModel and observe the inbox data.
        vm = new ViewModelProvider(this).get(InboxViewModel.class);
        vm.inbox.observe(this, adapter::submitList);

        // set up swipe refresh functionality.
        SwipeRefreshLayout srl = findViewById(R.id.swipe);
        srl.setOnRefreshListener(() -> {
            // refresh inbox data.
            vm.refresh();
            // stop the loading.
            srl.setRefreshing(false);
        });

        // button to compose a new email.
        findViewById(R.id.fabCompose).setOnClickListener(v -> {
            startActivity(new android.content.Intent(this, ComposeActivity.class));
        });

        // initial data load.
        vm.refresh();
    }

    @Override public boolean onCreateOptionsMenu(Menu menu) {
        // inflate the inbox menu.
        getMenuInflater().inflate(R.menu.menu_inbox, menu);
        return true;
    }

    @Override public boolean onOptionsItemSelected(MenuItem item) {
        // handle logout option in the menu.
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
