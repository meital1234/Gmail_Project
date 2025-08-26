package com.example.gmail_android.activity;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.gmail_android.R;
import com.example.gmail_android.entities.LabelEntity;

public class LabelAdapter extends ListAdapter<LabelEntity, LabelAdapter.VH> {

    public interface OnClick { void onLabel(LabelEntity label); }

    private final OnClick onClick;

    public LabelAdapter(OnClick onClick) {
        super(DIFF);
        this.onClick = onClick;
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
            name = v.findViewById(R.id.txtName);
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
        h.itemView.setOnClickListener(v -> onClick.onLabel(item));
    }
}
