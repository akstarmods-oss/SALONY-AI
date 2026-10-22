package com.akstarcompany.salony.ai.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.akstarcompany.salony.ai.R;
import com.akstarcompany.salony.ai.model.MemoryItem;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MemoryAdapter extends RecyclerView.Adapter<MemoryAdapter.MemoryViewHolder> {

    public interface OnMemoryActionListener {
        void onEdit(MemoryItem item);
        void onDelete(MemoryItem item);
    }

    private List<MemoryItem> memoryList = new ArrayList<>();
    private final OnMemoryActionListener listener;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault());

    public MemoryAdapter(OnMemoryActionListener listener) {
        this.listener = listener;
    }

    public void setMemories(List<MemoryItem> memories) {
        this.memoryList = memories != null ? memories : new ArrayList<>();
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public MemoryViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_memory, parent, false);
        return new MemoryViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MemoryViewHolder holder, int position) {
        MemoryItem item = memoryList.get(position);
        holder.tvCategory.setText(item.getCategory());
        holder.tvKey.setText(item.getKey());
        holder.tvContent.setText(item.getContent());
        holder.tvTimestamp.setText("Saved: " + dateFormat.format(new Date(item.getTimestamp())));

        holder.btnEdit.setOnClickListener(v -> {
            if (listener != null) listener.onEdit(item);
        });

        holder.btnDelete.setOnClickListener(v -> {
            if (listener != null) listener.onDelete(item);
        });
    }

    @Override
    public int getItemCount() {
        return memoryList.size();
    }

    static class MemoryViewHolder extends RecyclerView.ViewHolder {
        TextView tvCategory, tvKey, tvContent, tvTimestamp;
        ImageButton btnEdit, btnDelete;

        public MemoryViewHolder(@NonNull View itemView) {
            super(itemView);
            tvCategory = itemView.findViewById(R.id.tvCategory);
            tvKey = itemView.findViewById(R.id.tvKey);
            tvContent = itemView.findViewById(R.id.tvContent);
            tvTimestamp = itemView.findViewById(R.id.tvTimestamp);
            btnEdit = itemView.findViewById(R.id.btnEdit);
            btnDelete = itemView.findViewById(R.id.btnDelete);
        }
    }
}
