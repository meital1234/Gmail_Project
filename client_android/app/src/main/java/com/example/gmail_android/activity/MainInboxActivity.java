package com.example.gmail_android.activity;
import androidx.appcompat.app.AppCompatActivity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
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

public class MainInboxActivity extends AppCompatActivity {

    private InboxViewModel vm;
    private LabelAdapter labelAdapter;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_inbox);

        DrawerLayout drawer = findViewById(R.id.drawerLayout);
        MaterialToolbar topAppBar = findViewById(R.id.topAppBar);
        RecyclerView recycler = findViewById(R.id.recycler);
        RecyclerView recyclerLabels = findViewById(R.id.recyclerLabels);
        SwipeRefreshLayout swipe = findViewById(R.id.swipe);

        setSupportActionBar(topAppBar);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawer, topAppBar,
                R.string.nav_open, R.string.nav_close
        );
        drawer.addDrawerListener(toggle);
        toggle.syncState(); // hooks the hamburger + accessibility strings

        // Inbox list
        recycler.setLayoutManager(new LinearLayoutManager(this));
        MailAdapter mailAdapter = new MailAdapter((mail) -> {
            Intent i = new Intent(this, MailDetailsActivity.class);
            i.putExtra("mail_id", mail.mail.id);
            startActivity(i);
        });
        recycler.setAdapter(mailAdapter);

        // Labels drawer list
        recyclerLabels.setLayoutManager(new LinearLayoutManager(this));
        labelAdapter = new LabelAdapter((LabelEntity label) -> {
            vm.selectLabel(label.id);
            drawer.closeDrawer(GravityCompat.START);
        });
        recyclerLabels.setAdapter(labelAdapter);
        FloatingActionButton fab = findViewById(R.id.fabCompose);
        fab.setOnClickListener(v ->
                startActivity(new Intent(this, ComposeActivity.class))
        );
        // “All mail” row
        findViewById(R.id.rowAll).setOnClickListener(v -> {
            vm.selectAll();
            drawer.closeDrawer(GravityCompat.START);
        });

        // VM
        vm = new ViewModelProvider(this).get(InboxViewModel.class);

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
