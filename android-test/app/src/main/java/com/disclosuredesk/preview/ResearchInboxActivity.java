package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Native device-only inbox, opened above the current website tab. */
public final class ResearchInboxActivity extends Activity {
    private static final int BACKGROUND = 0xff0b131c;
    private static final int SURFACE = 0xff141f2c;
    private static final int BORDER = 0xff344050;
    private static final int GOLD = 0xfff2d7a2;
    private static final int TEXT = 0xfff1f3f7;
    private static final int MUTED = 0xffb8c4d2;
    private static final String INSTRUCTIONS =
            "Tap Share in Chrome or another app and choose Disclosure Desk Beta M92. "
            + "Tap a saved link to open it, or use its menu to rename, copy or remove it.";
    private static final String PRIVACY = "Saved on this device. Anyone using this app can see these links.";

    private ResearchInboxStore store;
    private List<ResearchInboxStore.Item> entries = Collections.emptyList();
    private EditText search;
    private TextView count;
    private TextView emptyTitle;
    private TextView emptyBody;
    private ListView list;
    private LinkAdapter adapter;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        store = new ResearchInboxStore(this);
        buildScreen();
        if (state != null) {
            search.setText(state.getString("query", ""));
            reload();
            list.setSelectionFromTop(state.getInt("position"), state.getInt("offset"));
        }
    }

    @Override protected void onResume() {
        super.onResume();
        reload();
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.putString("query", search.getText().toString());
        state.putInt("position", list.getFirstVisiblePosition());
        View first = list.getChildAt(0);
        state.putInt("offset", first == null ? 0 : first.getTop());
    }

    private void buildScreen() {
        LinearLayout root = column();
        root.setBackgroundColor(BACKGROUND);
        root.setFocusableInTouchMode(true);

        LinearLayout header = column();
        header.setPadding(dp(20), dp(6), dp(20), dp(12));
        root.addView(header, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        Button back = action("‹  Back");
        back.setContentDescription("Back to Disclosure Desk");
        back.setOnClickListener(view -> finish());
        toolbar.addView(back, new LinearLayout.LayoutParams(-2, -2));
        toolbar.addView(new View(this), new LinearLayout.LayoutParams(0, 1, 1));
        Button more = action("⋯");
        more.setContentDescription("Research Inbox options");
        more.setOnClickListener(this::showInboxOptions);
        toolbar.addView(more, new LinearLayout.LayoutParams(dp(48), -2));
        header.addView(toolbar, new LinearLayout.LayoutParams(-1, -2));

        TextView title = text("Research Inbox", 30, GOLD, true);
        if (Build.VERSION.SDK_INT >= 28) title.setAccessibilityHeading(true);
        addSpaced(header, title, 8);
        count = text("", 14, TEXT, true);
        count.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        addSpaced(header, count, 8);
        TextView privacy = text(PRIVACY, 13, MUTED, false);
        addSpaced(header, privacy, 4);

        search = new EditText(this);
        search.setHint("Search titles or websites");
        search.setTextColor(TEXT);
        search.setHintTextColor(MUTED);
        search.setTextSize(16);
        search.setSingleLine(true);
        search.setMinHeight(dp(50));
        search.setPadding(dp(14), dp(8), dp(14), dp(8));
        search.setInputType(android.text.InputType.TYPE_CLASS_TEXT
                | android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
        search.setImeOptions(EditorInfo.IME_ACTION_SEARCH);
        search.setBackground(shape(SURFACE, 12, BORDER));
        search.setOnEditorActionListener((view, actionId, event) -> {
            if (actionId != EditorInfo.IME_ACTION_SEARCH) return false;
            InputMethodManager keyboard = getSystemService(InputMethodManager.class);
            if (keyboard != null) keyboard.hideSoftInputFromWindow(view.getWindowToken(), 0);
            return true;
        });
        addSpaced(header, search, 14);

        FrameLayout content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        list = new ListView(this);
        list.setPadding(dp(20), 0, dp(20), dp(16));
        list.setClipToPadding(false);
        list.setDivider(null);
        list.setDividerHeight(0);
        list.setItemsCanFocus(true);
        content.addView(list, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout empty = column();
        empty.setGravity(Gravity.CENTER_HORIZONTAL);
        empty.setBackground(shape(SURFACE, 14, BORDER));
        empty.setPadding(dp(20), dp(23), dp(20), dp(23));
        emptyTitle = text("", 19, TEXT, true);
        emptyTitle.setGravity(Gravity.CENTER);
        empty.addView(emptyTitle);
        emptyBody = text("", 14, MUTED, false);
        emptyBody.setGravity(Gravity.CENTER);
        addSpaced(empty, emptyBody, 8);
        FrameLayout.LayoutParams emptyLayout = new FrameLayout.LayoutParams(-1, -2, Gravity.TOP);
        emptyLayout.setMargins(dp(20), dp(6), dp(20), dp(16));
        content.addView(empty, emptyLayout);

        adapter = new LinkAdapter();
        list.setEmptyView(empty);
        list.setAdapter(adapter);
        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int length, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int added) {
                filter(s.toString());
                list.setSelection(0);
            }
            @Override public void afterTextChanged(Editable s) {}
        });
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                boolean compact = getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE
                        && insets.isVisible(WindowInsets.Type.ime());
                toolbar.setVisibility(compact ? View.GONE : View.VISIBLE);
                title.setVisibility(compact ? View.GONE : View.VISIBLE);
                count.setVisibility(compact ? View.GONE : View.VISIBLE);
                privacy.setVisibility(compact ? View.GONE : View.VISIBLE);
                return insets;
            });
        }
        setContentView(root);
        root.requestFocus();
        root.requestApplyInsets();
    }

    private void reload() {
        entries = store.list();
        if (entries.isEmpty() && search.length() > 0) search.setText("");
        search.setVisibility(entries.isEmpty() ? View.GONE : View.VISIBLE);
        filter(search.getText().toString());
    }

    private void filter(String query) {
        List<ResearchInboxStore.Item> matches = new ArrayList<>();
        for (ResearchInboxStore.Item item : entries) {
            if (ResearchLinkParser.matchesInboxSearch(item.title, item.url, query)) matches.add(item);
        }
        String total = entries.size() + (entries.size() == 1 ? " link saved" : " links saved");
        count.setText(query.trim().isEmpty() ? total : matches.size() + " of " + total);
        emptyTitle.setText(entries.isEmpty() ? "No saved links yet" : "No matching links");
        emptyBody.setText(entries.isEmpty() ? INSTRUCTIONS : "Try a different title or website.");
        adapter.setRows(matches);
    }

    private void showInboxOptions(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add("How to save a link").setOnMenuItemClickListener(item -> {
            new AlertDialog.Builder(this).setTitle("How to save a link").setMessage(INSTRUCTIONS)
                    .setPositiveButton("Close", null).show();
            return true;
        });
        if (!entries.isEmpty()) {
            menu.getMenu().add("Clear all links").setOnMenuItemClickListener(item -> {
                new AlertDialog.Builder(this).setTitle("Clear Research Inbox?")
                        .setMessage("Remove all links saved in this inbox on this device?")
                        .setNegativeButton("Cancel", null)
                        .setPositiveButton("Clear links", (dialog, which) -> {
                            toast(store.clear() ? "Research Inbox cleared." : "Could not clear the inbox.");
                            reload();
                        }).show();
                return true;
            });
        }
        menu.show();
    }

    private void showLinkOptions(ResearchInboxStore.Item item) {
        LinearLayout header = column();
        header.setPadding(dp(24), dp(19), dp(24), dp(10));
        TextView title = text(item.title, 19, GOLD, true);
        title.setMaxLines(3);
        title.setEllipsize(TextUtils.TruncateAt.END);
        header.addView(title);
        TextView source = text(item.url, 13, MUTED, false);
        source.setMaxLines(3);
        source.setEllipsize(TextUtils.TruncateAt.END);
        source.setTextIsSelectable(true);
        addSpaced(header, source, 7);
        new AlertDialog.Builder(this).setCustomTitle(header)
                .setItems(new String[]{"Open in browser", "Rename", "Copy link", "Remove"}, (dialog, which) -> {
                    switch (which) {
                        case 0:
                            open(item);
                            break;
                        case 1:
                            ResearchLinkNameDialog.show(this, store, item.url, false, this::reload);
                            break;
                        case 2:
                            ClipboardManager clipboard = getSystemService(ClipboardManager.class);
                            if (clipboard != null) {
                                clipboard.setPrimaryClip(ClipData.newPlainText("Research source", item.url));
                                if (Build.VERSION.SDK_INT < 33) toast("Link copied.");
                            }
                            break;
                        case 3:
                            confirmRemove(item);
                            break;
                    }
                }).setNegativeButton("Close", null).show();
    }

    private void open(ResearchInboxStore.Item item) {
        try {
            Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse(item.url))
                    .addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(open);
        } catch (ActivityNotFoundException | SecurityException error) {
            toast("No browser could open this link.");
        }
    }

    private void confirmRemove(ResearchInboxStore.Item item) {
        new AlertDialog.Builder(this).setTitle("Remove this saved link?")
                .setMessage(item.title)
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Remove", (dialog, which) -> {
                    toast(store.remove(item.url) ? "Link removed." : "Link could not be removed.");
                    reload();
                }).show();
    }

    private final class LinkAdapter extends BaseAdapter {
        private List<ResearchInboxStore.Item> rows = Collections.emptyList();

        void setRows(List<ResearchInboxStore.Item> matches) {
            rows = matches;
            notifyDataSetChanged();
        }

        @Override public int getCount() { return rows.size(); }
        @Override public ResearchInboxStore.Item getItem(int position) { return rows.get(position); }
        @Override public long getItemId(int position) { return position; }

        @Override public View getView(int position, View recycled, ViewGroup parent) {
            Row row;
            if (recycled == null) {
                row = new Row();
                recycled = row.container;
                recycled.setTag(row);
            } else {
                row = (Row) recycled.getTag();
            }
            row.bind(getItem(position));
            return recycled;
        }
    }

    private final class Row {
        final LinearLayout container = column();
        final LinearLayout link = column();
        final TextView name = text("", 16, TEXT, true);
        final TextView host = text("", 13, MUTED, false);
        final Button options = action("⋯");

        Row() {
            container.setPadding(0, dp(4), 0, dp(4));
            LinearLayout card = new LinearLayout(ResearchInboxActivity.this);
            card.setGravity(Gravity.CENTER_VERTICAL);
            card.setBackground(shape(SURFACE, 12, BORDER));
            link.setPadding(dp(14), dp(12), dp(8), dp(12));
            link.setMinimumHeight(dp(56));
            link.setGravity(Gravity.CENTER_VERTICAL);
            link.setBackground(ripple(Color.TRANSPARENT, 12));
            link.setFocusable(true);
            name.setMaxLines(3);
            name.setEllipsize(TextUtils.TruncateAt.END);
            host.setSingleLine(true);
            host.setEllipsize(TextUtils.TruncateAt.END);
            link.addView(name);
            addSpaced(link, host, 4);
            name.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            host.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            card.addView(link, new LinearLayout.LayoutParams(0, -2, 1));
            LinearLayout.LayoutParams menuLayout = new LinearLayout.LayoutParams(dp(48), -2);
            menuLayout.rightMargin = dp(4);
            card.addView(options, menuLayout);
            container.addView(card, new LinearLayout.LayoutParams(-1, -2));
        }

        void bind(ResearchInboxStore.Item item) {
            String domain = Uri.parse(item.url).getHost();
            if (domain == null) domain = item.url;
            boolean showDomain = !ResearchLinkParser.formatInboxRow(item.title, domain).equals(item.title);
            name.setText(item.title);
            host.setText(domain);
            host.setVisibility(showDomain ? View.VISIBLE : View.GONE);
            link.setContentDescription("Open " + item.title + (showDomain ? ", " + domain : ""));
            link.setOnClickListener(view -> open(item));
            options.setContentDescription("Options for " + item.title);
            options.setOnClickListener(view -> showLinkOptions(item));
        }
    }

    private LinearLayout column() {
        LinearLayout view = new LinearLayout(this);
        view.setOrientation(LinearLayout.VERTICAL);
        return view;
    }

    private TextView text(String content, int size, int color, boolean strong) {
        TextView view = new TextView(this);
        view.setText(content);
        view.setTextSize(size);
        view.setTextColor(color);
        if (strong) view.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        return view;
    }

    private Button action(String label) {
        Button view = new Button(this);
        view.setText(label);
        view.setTextSize(16);
        view.setTextColor(GOLD);
        view.setAllCaps(false);
        view.setMinWidth(0);
        view.setMinimumWidth(0);
        view.setMinimumHeight(dp(48));
        view.setMinHeight(dp(48));
        view.setPadding(dp(7), dp(3), dp(7), dp(3));
        view.setBackground(ripple(Color.TRANSPARENT, 10));
        view.setStateListAnimator(null);
        return view;
    }

    private GradientDrawable shape(int color, int radius, int border) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radius));
        if (border != 0) drawable.setStroke(dp(1), border);
        return drawable;
    }

    private RippleDrawable ripple(int color, int radius) {
        return new RippleDrawable(ColorStateList.valueOf(0x33f2d7a2),
                shape(color, radius, 0), shape(Color.WHITE, radius, 0));
    }

    private void addSpaced(LinearLayout parent, View child, int margin) {
        LinearLayout.LayoutParams layout = new LinearLayout.LayoutParams(-1, -2);
        layout.topMargin = dp(margin);
        parent.addView(child, layout);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void toast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }
}
