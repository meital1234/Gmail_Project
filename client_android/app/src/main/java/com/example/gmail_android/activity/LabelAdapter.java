package com.example.gmail_android.activity;

import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.widget.PopupMenu;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.gmail_android.R;
import com.example.gmail_android.entities.LabelEntity;

public class LabelAdapter extends ListAdapter<LabelEntity, LabelAdapter.VH> {
    public interface Actions {
        void onSelect(LabelEntity label);
        void onRename(LabelEntity label);
        void onDelete(LabelEntity label);
    }
    private final Actions actions;
    public LabelAdapter(Actions actions) {
        super(DIFF);
        this.actions = actions;
    }
    private static final DiffUtil.ItemCallback<LabelEntity> DIFF =
            new DiffUtil.ItemCallback<>() {
                @Override
                public boolean areItemsTheSame(@NonNull LabelEntity a, @NonNull LabelEntity b) {
                    return a.id.equals(b.id);
                }

                @Override
                public boolean areContentsTheSame(@NonNull LabelEntity a, @NonNull LabelEntity b) {
                    return a.name.equals(b.name);
                }
            };

    static class VH extends RecyclerView.ViewHolder {
        TextView name;
        VH(@NonNull View v) {
            super(v);
            name = v.findViewById(R.id.tvLabelName);
        }
    }

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_label_row, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        LabelEntity item = getItem(position);
        h.name.setText(item.name);

        // Tap = select label
        h.itemView.setOnClickListener(v -> actions.onSelect(item));

        // Long-press = show overflow menu (Rename/Delete)
        h.itemView.setOnLongClickListener(v -> {
            showMenu(v, item);
            return true;
        });
    }

    private void showMenu(View anchor, LabelEntity label) {
        PopupMenu pm = new PopupMenu(anchor.getContext(), anchor);
        // Use string resources if you have them; otherwise these fallbacks are fine
        pm.getMenu().add(0, 1, 0, R.string.rename);
        pm.getMenu().add(0, 2, 1, R.string.delete);

        pm.setOnMenuItemClickListener((MenuItem it) -> {
            if (it.getItemId() == 1) { actions.onRename(label); return true; }
            if (it.getItemId() == 2) { actions.onDelete(label); return true; }
            return false;
        });
        pm.show();
    }
}

