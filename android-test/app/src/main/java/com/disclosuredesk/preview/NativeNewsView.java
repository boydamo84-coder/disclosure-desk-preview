package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.core.view.ViewCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

final class NativeNewsView extends LinearLayout {
    interface Actions {
        void refreshNews();
        void openSharedNews(String id, String url);
        void openPublisher(JSONObject story);
    }

    private static final int GOLD = 0xFFF2D7A2;
    private static final int INK = 0xFFEFF4F8;
    private static final int MUTED = 0xFFACBFCE;
    private final Activity activity;
    private final Actions actions;
    private final SharedPreferences prefs;
    private final ListView list;
    private final TextView status;
    private final TextView empty;
    private final Button headlines;
    private final Button savedButton;
    private final Button ticker;
    private final TextView tickerStory;
    private final Button refreshButton;
    private final SwipeRefreshLayout refresh;
    private final StoryAdapter adapter;
    private JSONArray latest;
    private JSONArray saved;
    private String feedStatus = "";
    private boolean showSaved;
    private boolean tickerOpen;
    private boolean restoringScroll;
    private final int[] positions = new int[2];
    private final int[] offsets = new int[2];
    private final String[] anchors = new String[2];

    NativeNewsView(Activity activity, Actions actions) {
        super(activity);
        this.activity = activity;
        this.actions = actions;
        prefs = activity.getSharedPreferences("dd-native-news", Activity.MODE_PRIVATE);
        latest = readRows("latest");
        saved = readRows("saved");
        feedStatus = prefs.getString("status", "");
        tickerOpen = prefs.getBoolean("ticker-open", false);
        for (int i = 0; i < positions.length; i++) {
            positions[i] = prefs.getInt("position-" + i, 0);
            offsets[i] = prefs.getInt("offset-" + i, 0);
            anchors[i] = prefs.getString("anchor-" + i, "");
        }
        setOrientation(VERTICAL);
        setBackgroundColor(0xFF0B1520);
        LinearLayout titleRow = new LinearLayout(activity);
        titleRow.setGravity(Gravity.CENTER_VERTICAL);
        titleRow.setPadding(dp(16), 0, dp(8), 0);
        TextView title = text("News", 23, INK);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        ViewCompat.setAccessibilityHeading(title, true);
        titleRow.addView(title, new LayoutParams(0, dp(48), 1));
        title.setGravity(Gravity.CENTER_VERTICAL);
        refreshButton = button("Refresh", this::requestRefresh);
        titleRow.addView(refreshButton, new LayoutParams(-2, dp(48)));
        addView(titleRow);

        LinearLayout tabs = new LinearLayout(activity);
        tabs.setPadding(dp(10), 0, dp(10), 0);
        headlines = button("Latest", () -> select(false));
        savedButton = button("Saved", () -> select(true));
        Button shared = button("News tools", () -> actions.openSharedNews("", ""));
        shared.setTextSize(13);
        shared.setPadding(0, 0, 0, 0);
        shared.setMinWidth(0);
        shared.setMinimumWidth(0);
        tabs.addView(headlines, new LayoutParams(0, dp(48), 1));
        tabs.addView(savedButton, new LayoutParams(0, dp(48), 1));
        tabs.addView(shared, new LayoutParams(0, dp(48), 1.25f));
        addView(tabs);

        ticker = button("Live news ticker", () -> {
            tickerOpen = !tickerOpen;
            prefs.edit().putBoolean("ticker-open", tickerOpen).apply();
            updateTicker();
        });
        ticker.setGravity(Gravity.CENTER_VERTICAL | Gravity.START);
        ticker.setPadding(dp(16), 0, dp(16), 0);
        addView(ticker, new LayoutParams(-1, dp(48)));
        tickerStory = text("", 14, INK);
        tickerStory.setPadding(dp(16), 0, dp(16), dp(10));
        tickerStory.setMinHeight(dp(48));
        addView(tickerStory);
        status = text("", 12, MUTED);
        status.setPadding(dp(16), dp(6), dp(16), dp(9));
        status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        addView(status);

        empty = text("", 15, MUTED);
        empty.setGravity(Gravity.CENTER);
        empty.setPadding(dp(20), dp(16), dp(20), dp(16));
        addView(empty, new LayoutParams(-1, -2));
        refresh = new SwipeRefreshLayout(activity);
        refresh.setColorSchemeColors(GOLD);
        refresh.setProgressBackgroundColorSchemeColor(0xFF213342);
        list = new ListView(activity);
        list.setDivider(null);
        list.setClipToPadding(false);
        list.setPadding(dp(12), 0, dp(12), dp(12));
        adapter = new StoryAdapter();
        list.setAdapter(adapter);
        list.setOnItemClickListener((parent, view, position, id) -> showStory(adapter.rows.get(position)));
        refresh.addView(list);
        refresh.setOnRefreshListener(this::requestRefresh);
        addView(refresh, new LayoutParams(-1, 0, 1));
        render();
    }

    private JSONArray readRows(String key) {
        try {
            return new JSONArray(prefs.getString(key, "[]"));
        } catch (Exception invalid) {
            return new JSONArray();
        }
    }

    void showOffline() {
        feedStatus = "Offline · Showing saved headlines";
        render();
    }

    void update(JSONArray rows, String nextStatus) {
        boolean changed = rows != null && rows.length() > 0 && !rows.toString().equals(latest.toString());
        if (changed) {
            latest = rows;
            prefs.edit().putString("latest", rows.toString()).putString("status", nextStatus).apply();
        }
        feedStatus = nextStatus;
        if (changed && !showSaved) {
            rememberPosition();
            render();
        } else {
            updateStatus();
        }
    }

    void finishRefresh() {
        refresh.setRefreshing(false);
        refreshButton.setEnabled(true);
    }

    void rememberPosition() {
        if (restoringScroll || list.getChildCount() == 0) return;
        int tab = showSaved ? 1 : 0;
        positions[tab] = list.getFirstVisiblePosition();
        if (positions[tab] >= adapter.getCount()) return;
        anchors[tab] = adapter.getItem(positions[tab]).optString("url");
        offsets[tab] = list.getChildAt(0).getTop() - list.getPaddingTop();
        prefs.edit().putInt("position-" + tab, positions[tab]).putInt("offset-" + tab, offsets[tab])
                .putString("anchor-" + tab, anchors[tab]).apply();
    }

    private void requestRefresh() {
        if (!refreshButton.isEnabled()) return;
        if (showSaved) select(false);
        refreshButton.setEnabled(false);
        refresh.setRefreshing(true);
        actions.refreshNews();
    }

    private void select(boolean savedTab) {
        if (showSaved == savedTab) return;
        rememberPosition();
        showSaved = savedTab;
        render();
    }

    private void render() {
        headlines.setSelected(!showSaved);
        savedButton.setSelected(showSaved);
        headlines.setBackground(controlBackground(!showSaved));
        savedButton.setBackground(controlBackground(showSaved));
        updateTicker();
        updateStatus();
        adapter.rows.clear();
        JSONArray rows = showSaved ? saved : latest;
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row != null && !row.optString("headline").isEmpty() && safeUrl(row.optString("url"))) {
                adapter.rows.add(row);
            }
        }
        restoringScroll = true;
        adapter.notifyDataSetChanged();
        empty.setVisibility(adapter.rows.isEmpty() ? View.VISIBLE : View.GONE);
        empty.setText(showSaved ? "Saved stories will appear here." : "No headlines are available yet. Tap Refresh to retry.");
        int tab = showSaved ? 1 : 0;
        int position = Math.min(positions[tab], Math.max(0, adapter.getCount() - 1));
        for (int i = 0; !anchors[tab].isEmpty() && i < adapter.getCount(); i++) {
            if (anchors[tab].equals(adapter.getItem(i).optString("url"))) {
                position = i;
                break;
            }
        }
        list.setSelectionFromTop(position, offsets[tab]);
        list.post(() -> restoringScroll = false);
    }

    private void updateStatus() {
        status.setText(showSaved ? "Saved on this device" :
                feedStatus.isEmpty() ? "Loading headlines…" : feedStatus);
    }

    private void updateTicker() {
        ticker.setVisibility(showSaved ? View.GONE : View.VISIBLE);
        ticker.setText(tickerOpen ? "Live news ticker  ▴" : "Live news ticker  ▾");
        ticker.setContentDescription(tickerOpen ? "Collapse live news ticker" : "Expand live news ticker");
        tickerStory.setVisibility(tickerOpen && !showSaved ? View.VISIBLE : View.GONE);
        JSONObject top = latest.optJSONObject(0);
        if (top == null) {
            tickerStory.setText("No headlines available");
            tickerStory.setOnClickListener(null);
            tickerStory.setClickable(false);
        } else {
            tickerStory.setText(top.optString("headline") + "  ·  " + top.optString("source"));
            tickerStory.setOnClickListener(view -> showStory(top));
        }
    }

    private void showStory(JSONObject story) {
        String url = story.optString("url");
        if (!safeUrl(url)) return;
        boolean alreadySaved = isSaved(url);
        AlertDialog dialog = new AlertDialog.Builder(activity)
                .setTitle(story.optString("headline"))
                .setItems(new String[]{"Read publisher", "Discussion and research tools",
                        alreadySaved ? "Remove from Saved" : "Save for later"}, (panel, item) -> {
                    if (item == 0) actions.openPublisher(story);
                    if (item == 1) actions.openSharedNews(story.optString("id"), url);
                    if (item == 2) setSaved(story, alreadySaved);
                }).setNegativeButton("Close", null).create();
        dialog.show();
    }

    private boolean isSaved(String url) {
        for (int i = 0; i < saved.length(); i++) {
            JSONObject row = saved.optJSONObject(i);
            if (row != null && url.equals(row.optString("url"))) return true;
        }
        return false;
    }

    private void setSaved(JSONObject story, boolean remove) {
        JSONArray next = new JSONArray();
        if (!remove) next.put(story);
        for (int i = 0; i < saved.length(); i++) {
            JSONObject row = saved.optJSONObject(i);
            if (row != null && !story.optString("url").equals(row.optString("url"))) next.put(row);
        }
        saved = next;
        prefs.edit().putString("saved", next.toString()).apply();
        rememberPosition();
        render();
    }

    static boolean safeUrl(String value) {
        if (value == null || value.length() > 2048) return false;
        try {
            URI url = URI.create(value);
            return "https".equalsIgnoreCase(url.getScheme()) && url.getHost() != null && url.getUserInfo() == null;
        } catch (IllegalArgumentException invalid) {
            return false;
        }
    }

    private String metadata(JSONObject row) {
        String date = row.optString("date");
        if (date.length() >= 10) date = date.substring(0, 10);
        return row.optString("source") + (date.isEmpty() ? "" : "  ·  " + date);
    }

    private TextView text(String value, int size, int colour) {
        TextView view = new TextView(activity);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(colour);
        return view;
    }

    private Button button(String label, Runnable click) {
        Button view = new Button(activity, null, android.R.attr.borderlessButtonStyle);
        view.setText(label);
        view.setAllCaps(false);
        view.setTextColor(GOLD);
        view.setOnClickListener(v -> click.run());
        return view;
    }

    private GradientDrawable controlBackground(boolean selected) {
        GradientDrawable background = new GradientDrawable();
        background.setColor(selected ? 0xFF26374A : 0xFF152536);
        background.setCornerRadius(dp(14));
        if (selected) background.setStroke(dp(1), 0xFF685738);
        return background;
    }

    private int dp(int px) {
        return Math.round(px * getResources().getDisplayMetrics().density);
    }

    private final class StoryAdapter extends BaseAdapter {
        private final List<JSONObject> rows = new ArrayList<>();
        @Override public int getCount() { return rows.size(); }
        @Override public JSONObject getItem(int position) { return rows.get(position); }
        @Override public long getItemId(int position) { return position; }
        @Override public View getView(int position, View convertView, ViewGroup parent) {
            LinearLayout outer;
            if (convertView == null) {
                outer = new LinearLayout(activity);
                outer.setOrientation(VERTICAL);
                outer.setPadding(0, 0, 0, dp(8));
                LinearLayout card = new LinearLayout(activity);
                card.setOrientation(VERTICAL);
                card.setPadding(dp(14), dp(12), dp(14), dp(12));
                card.setBackground(controlBackground(false));
                TextView meta = text("", 12, GOLD);
                TextView title = text("", 17, INK);
                title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
                title.setPadding(0, dp(5), 0, 0);
                card.addView(meta);
                card.addView(title);
                outer.addView(card);
            } else {
                outer = (LinearLayout) convertView;
            }
            LinearLayout card = (LinearLayout) outer.getChildAt(0);
            JSONObject story = getItem(position);
            ((TextView) card.getChildAt(0)).setText(metadata(story));
            ((TextView) card.getChildAt(1)).setText(story.optString("headline"));
            return outer;
        }
    }
}
