package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class OfflineArchiveActivity extends Activity {
    private static final int BACKGROUND = 0xff0b131c;
    private static final int SURFACE = 0xff142536;
    private static final int GOLD = 0xfff2d7a2;
    private static final int INK = 0xffeef2f6;
    private static final int MUTED = 0xffb6c5d4;

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private List<ArchiveCatalogue.Record> catalogue = Collections.emptyList();
    private List<ArchiveCatalogue.Record> results = Collections.emptyList();
    private EditText search;
    private TextView status;
    private ListView list;
    private RecordsAdapter adapter;
    private boolean loaded;

    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BACKGROUND);
        root.setFocusableInTouchMode(true);
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return insets;
            });
        }

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setPadding(dp(20), dp(4), dp(20), dp(8));
        root.addView(header);
        Button back = new Button(this);
        back.setText("‹  Back");
        back.setAllCaps(false);
        back.setTextColor(GOLD);
        back.setBackgroundTintList(ColorStateList.valueOf(SURFACE));
        back.setOnClickListener(v -> finish());
        header.addView(back, new LinearLayout.LayoutParams(-2, dp(48)));

        TextView title = text("Offline Archive", 28, GOLD, true);
        if (Build.VERSION.SDK_INT >= 28) title.setAccessibilityHeading(true);
        header.addView(title);
        status = text("Loading case catalogue…", 14, MUTED, false);
        status.setPadding(0, dp(6), 0, dp(8));
        status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        header.addView(status);

        search = new EditText(this);
        search.setSingleLine(true);
        search.setHint("Search cases, sources or years");
        search.setTextColor(INK);
        search.setHintTextColor(MUTED);
        search.setTextSize(16);
        search.setPadding(dp(12), dp(6), dp(12), dp(6));
        GradientDrawable field = new GradientDrawable();
        field.setColor(SURFACE);
        field.setCornerRadius(dp(11));
        field.setStroke(dp(1), 0xff405467);
        search.setBackground(field);
        header.addView(search, new LinearLayout.LayoutParams(-1, dp(48)));

        adapter = new RecordsAdapter();
        list = new ListView(this);
        list.setPadding(dp(12), 0, dp(12), 0);
        list.setClipToPadding(false);
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, row, position, id) -> showCase(results.get(position)));
        root.addView(list, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(root);
        root.requestFocus();
        if (saved != null) search.setText(saved.getString("query", ""));
        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (loaded) filter();
            }
            @Override public void afterTextChanged(Editable s) {}
        });

        worker.execute(() -> {
            try {
                ArchiveCatalogue archive = new ArchiveCatalogue();
                readAsset(archive, "curated-historical-cases.json");
                readAsset(archive, "historical-news-archive.json");
                List<ArchiveCatalogue.Record> records = archive.records();
                runOnUiThread(() -> {
                    if (isFinishing() || isDestroyed()) return;
                    catalogue = records;
                    loaded = true;
                    filter();
                    if (saved != null) list.setSelection(saved.getInt("position"));
                });
            } catch (Exception error) {
                android.util.Log.w("DisclosureDesk", "Could not read bundled Archive", error);
                runOnUiThread(() -> status.setText("Could not load the offline case catalogue."));
            }
        });
    }

    private void readAsset(ArchiveCatalogue archive, String name) throws java.io.IOException {
        archive.read(new InputStreamReader(getAssets().open("dd-site/data/" + name), StandardCharsets.UTF_8));
    }

    private void filter() {
        String query = search.getText().toString().trim().toLowerCase(Locale.ROOT);
        if (query.isEmpty()) {
            results = catalogue;
        } else {
            List<ArchiveCatalogue.Record> matches = new ArrayList<>();
            for (ArchiveCatalogue.Record record : catalogue) {
                if (record.title.toLowerCase(Locale.ROOT).contains(query)
                        || record.source.toLowerCase(Locale.ROOT).contains(query)
                        || record.category.toLowerCase(Locale.ROOT).contains(query)
                        || Integer.toString(record.year).equals(query)) matches.add(record);
            }
            results = matches;
        }
        String count = NumberFormat.getIntegerInstance().format(results.size());
        status.setText(results.isEmpty() ? "No matching cases" : count + (results.size() == 1 ? " case" : " cases") + " on this device");
        adapter.notifyDataSetChanged();
        list.setSelection(0);
    }

    private void showCase(ArchiveCatalogue.Record record) {
        String detail = record.year + " · " + record.kind + "\n" + record.source;
        if (!record.description.isEmpty()) detail += "\n\n" + record.description;
        new AlertDialog.Builder(this).setTitle(record.title).setMessage(detail)
                .setNegativeButton("Close", null)
                .setNeutralButton("Open source", (dialog, which) -> {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(record.url))
                                .addCategory(Intent.CATEGORY_BROWSABLE));
                    } catch (ActivityNotFoundException | SecurityException error) {
                        Toast.makeText(this, "No app could open this source.", Toast.LENGTH_SHORT).show();
                    }
                }).setPositiveButton("Full case", (dialog, which) -> {
                    setResult(RESULT_OK, new Intent().putExtra("archive_case", record.id));
                    finish();
                }).show();
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putString("query", search.getText().toString());
        state.putInt("position", list.getFirstVisiblePosition());
        super.onSaveInstanceState(state);
    }

    @Override protected void onDestroy() {
        worker.shutdownNow();
        super.onDestroy();
    }

    private TextView text(String value, int size, int color, boolean strong) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        if (strong) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private final class RecordsAdapter extends BaseAdapter {
        @Override public int getCount() { return results.size(); }
        @Override public ArchiveCatalogue.Record getItem(int position) { return results.get(position); }
        @Override public long getItemId(int position) { return position; }

        @Override public View getView(int position, View recycled, ViewGroup parent) {
            LinearLayout row;
            if (recycled == null) {
                row = new LinearLayout(OfflineArchiveActivity.this);
                row.setOrientation(LinearLayout.VERTICAL);
                row.setGravity(Gravity.CENTER_VERTICAL);
                row.setPadding(dp(12), dp(9), dp(12), dp(9));
                row.setMinimumHeight(dp(58));
                row.addView(text("", 16, INK, true));
                TextView meta = text("", 13, MUTED, false);
                meta.setPadding(0, dp(3), 0, 0);
                row.addView(meta);
            } else {
                row = (LinearLayout) recycled;
            }
            ArchiveCatalogue.Record record = getItem(position);
            ((TextView) row.getChildAt(0)).setText(record.title);
            ((TextView) row.getChildAt(1)).setText(record.year + " · " + record.source);
            return row;
        }
    }
}
