package com.akstarcompany.salony.ai.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.akstarcompany.salony.ai.model.MemoryItem;

import java.util.ArrayList;
import java.util.List;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "salony_memory.db";
    private static final int DATABASE_VERSION = 1;

    public static final String TABLE_MEMORIES = "memories";
    public static final String COLUMN_ID = "_id";
    public static final String COLUMN_KEY = "memory_key";
    public static final String COLUMN_CONTENT = "content";
    public static final String COLUMN_CATEGORY = "category";
    public static final String COLUMN_TIMESTAMP = "timestamp";

    private static final String TABLE_CREATE =
            "CREATE TABLE " + TABLE_MEMORIES + " (" +
                    COLUMN_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    COLUMN_KEY + " TEXT NOT NULL UNIQUE, " +
                    COLUMN_CONTENT + " TEXT NOT NULL, " +
                    COLUMN_CATEGORY + " TEXT, " +
                    COLUMN_TIMESTAMP + " INTEGER" +
                    ");";

    private static DatabaseHelper instance;

    public static synchronized DatabaseHelper getInstance(Context context) {
        if (instance == null) {
            instance = new DatabaseHelper(context.getApplicationContext());
        }
        return instance;
    }

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(TABLE_CREATE);

        // Prepopulate with a loving welcome memory from Salony
        ContentValues cv = new ContentValues();
        cv.put(COLUMN_KEY, "Assistant Persona");
        cv.put(COLUMN_CONTENT, "Salony is your sweet, caring, loving girlfriend assistant who talks in sweet Hinglish and helps with your phone tasks.");
        cv.put(COLUMN_CATEGORY, "System");
        cv.put(COLUMN_TIMESTAMP, System.currentTimeMillis());
        db.insert(TABLE_MEMORIES, null, cv);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_MEMORIES);
        onCreate(db);
    }

    // Save or update memory
    public synchronized long saveOrUpdateMemory(String key, String content, String category) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COLUMN_KEY, key);
        values.put(COLUMN_CONTENT, content);
        values.put(COLUMN_CATEGORY, category != null ? category : "General");
        values.put(COLUMN_TIMESTAMP, System.currentTimeMillis());

        long rowId = db.insertWithOnConflict(TABLE_MEMORIES, null, values, SQLiteDatabase.CONFLICT_REPLACE);
        return rowId;
    }

    // Get all memories ordered by latest
    public synchronized List<MemoryItem> getAllMemories() {
        List<MemoryItem> list = new ArrayList<>();
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = db.query(TABLE_MEMORIES, null, null, null, null, null, COLUMN_TIMESTAMP + " DESC");

        if (cursor != null) {
            try {
                int idIdx = cursor.getColumnIndexOrThrow(COLUMN_ID);
                int keyIdx = cursor.getColumnIndexOrThrow(COLUMN_KEY);
                int contentIdx = cursor.getColumnIndexOrThrow(COLUMN_CONTENT);
                int categoryIdx = cursor.getColumnIndexOrThrow(COLUMN_CATEGORY);
                int timeIdx = cursor.getColumnIndexOrThrow(COLUMN_TIMESTAMP);

                while (cursor.moveToNext()) {
                    MemoryItem item = new MemoryItem(
                            cursor.getLong(idIdx),
                            cursor.getString(keyIdx),
                            cursor.getString(contentIdx),
                            cursor.getString(categoryIdx),
                            cursor.getLong(timeIdx)
                    );
                    list.add(item);
                }
            } finally {
                cursor.close();
            }
        }
        return list;
    }

    // Search memories by keyword
    public synchronized List<MemoryItem> searchMemories(String query) {
        List<MemoryItem> list = new ArrayList<>();
        if (query == null || query.trim().isEmpty()) {
            return getAllMemories();
        }

        SQLiteDatabase db = getReadableDatabase();
        String selection = COLUMN_KEY + " LIKE ? OR " + COLUMN_CONTENT + " LIKE ? OR " + COLUMN_CATEGORY + " LIKE ?";
        String[] selectionArgs = new String[]{"%" + query + "%", "%" + query + "%", "%" + query + "%"};

        Cursor cursor = db.query(TABLE_MEMORIES, null, selection, selectionArgs, null, null, COLUMN_TIMESTAMP + " DESC");
        if (cursor != null) {
            try {
                int idIdx = cursor.getColumnIndexOrThrow(COLUMN_ID);
                int keyIdx = cursor.getColumnIndexOrThrow(COLUMN_KEY);
                int contentIdx = cursor.getColumnIndexOrThrow(COLUMN_CONTENT);
                int categoryIdx = cursor.getColumnIndexOrThrow(COLUMN_CATEGORY);
                int timeIdx = cursor.getColumnIndexOrThrow(COLUMN_TIMESTAMP);

                while (cursor.moveToNext()) {
                    list.add(new MemoryItem(
                            cursor.getLong(idIdx),
                            cursor.getString(keyIdx),
                            cursor.getString(contentIdx),
                            cursor.getString(categoryIdx),
                            cursor.getLong(timeIdx)
                    ));
                }
            } finally {
                cursor.close();
            }
        }
        return list;
    }

    // Update memory
    public synchronized boolean updateMemory(long id, String key, String content, String category) {
        SQLiteDatabase db = getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COLUMN_KEY, key);
        values.put(COLUMN_CONTENT, content);
        values.put(COLUMN_CATEGORY, category);
        values.put(COLUMN_TIMESTAMP, System.currentTimeMillis());

        int rows = db.update(TABLE_MEMORIES, values, COLUMN_ID + " = ?", new String[]{String.valueOf(id)});
        return rows > 0;
    }

    // Delete memory by ID
    public synchronized boolean deleteMemory(long id) {
        SQLiteDatabase db = getWritableDatabase();
        int rows = db.delete(TABLE_MEMORIES, COLUMN_ID + " = ?", new String[]{String.valueOf(id)});
        return rows > 0;
    }

    // Delete memory by Key
    public synchronized boolean deleteMemoryByKey(String key) {
        SQLiteDatabase db = getWritableDatabase();
        int rows = db.delete(TABLE_MEMORIES, COLUMN_KEY + " = ?", new String[]{key});
        return rows > 0;
    }

    // Delete all memories
    public synchronized void deleteAllMemories() {
        SQLiteDatabase db = getWritableDatabase();
        db.delete(TABLE_MEMORIES, null, null);
    }

    // Get count of memories
    public synchronized int getMemoryCount() {
        SQLiteDatabase db = getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT COUNT(*) FROM " + TABLE_MEMORIES, null);
        int count = 0;
        if (cursor != null) {
            try {
                if (cursor.moveToFirst()) {
                    count = cursor.getInt(0);
                }
            } finally {
                cursor.close();
            }
        }
        return count;
    }
}
