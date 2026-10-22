package com.akstarcompany.salony.ai.model;

public class MemoryItem {
    private long id;
    private String key;
    private String content;
    private String category;
    private long timestamp;

    public MemoryItem() {
    }

    public MemoryItem(long id, String key, String content, String category, long timestamp) {
        this.id = id;
        this.key = key;
        this.content = content;
        this.category = category;
        this.timestamp = timestamp;
    }

    public MemoryItem(String key, String content, String category, long timestamp) {
        this(-1, key, content, category, timestamp);
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getKey() {
        return key != null ? key : "";
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getContent() {
        return content != null ? content : "";
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCategory() {
        return (category != null && !category.trim().isEmpty()) ? category : "General";
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}
