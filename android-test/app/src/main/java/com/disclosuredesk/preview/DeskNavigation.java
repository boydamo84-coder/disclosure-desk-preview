package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.core.view.ViewCompat;
import java.util.function.Consumer;

final class DeskNavigation extends LinearLayout {
    private static final String[] MAIN = {"discover", "archivePage", "discussionsPage", "chatPage", "more"};
    private static final String[] LABELS = {"News", "Archive", "Discuss", "Chat", "More"};
    private static final String[][] MORE = {
            {"clips", "Videos"}, {"mapPage", "Map"}, {"boards", "Investigation Boards"},
            {"researchStudio", "W.NE Research"}, {"livePage", "Live hearings"},
            {"watchRead", "Watch & Read"}, {"witness", "Witness reports"},
            {"hub", "Explore"}, {"profilePage", "My Profile"}
    };
    private static final int GOLD = 0xFFF2D7A2;
    private static final int MUTED = 0xFFADBFCC;
    private final Activity activity;
    private final Consumer<String> navigate;
    private final Tab[] tabs = new Tab[MAIN.length];
    private String section = "";
    private String videoCount = "";
    private boolean keyboardOpen;

    DeskNavigation(Activity activity, Consumer<String> navigate) {
        super(activity);
        this.activity = activity;
        this.navigate = navigate;
        setBackgroundColor(0xFF0D1A26);
        setPadding(dp(4), dp(3), dp(4), dp(3));
        for (int i = 0; i < MAIN.length; i++) {
            final String target = MAIN[i];
            Tab tab = new Tab(i);
            tab.setOnClickListener(view -> {
                if ("more".equals(target)) showMore(); else navigate.accept(target);
            });
            tabs[i] = tab;
            addView(tab, new LayoutParams(0, -1, 1));
        }
    }

    boolean isKeyboardOpen() { return keyboardOpen; }
    void setKeyboardOpen(boolean open) { keyboardOpen = open; }

    void update(String active, String chatCount, String videos) {
        section = active;
        videoCount = count(videos);
        boolean more = true;
        for (int i = 0; i < MAIN.length - 1; i++) {
            boolean selected = MAIN[i].equals(active);
            tabs[i].update(selected, i == 3 ? count(chatCount) : "");
            more &= !selected;
        }
        tabs[4].update(more, videoCount);
    }

    private static String count(String value) {
        return value.matches("[1-9][0-9]{0,2}\\+?") ? value : "";
    }

    private void showMore() {
        Dialog dialog = new Dialog(activity);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        LinearLayout sheet = new LinearLayout(activity);
        sheet.setOrientation(VERTICAL);
        sheet.setPadding(dp(18), dp(14), dp(18), dp(16));
        GradientDrawable background = new GradientDrawable();
        background.setColor(0xFF152637);
        background.setCornerRadii(new float[]{dp(24),dp(24),dp(24),dp(24),0,0,0,0});
        sheet.setBackground(background);
        TextView title = new TextView(activity);
        title.setText("More");
        title.setTextColor(GOLD);
        title.setTextSize(21);
        ViewCompat.setAccessibilityHeading(title, true);
        title.setPadding(dp(10), 0, 0, dp(6));
        sheet.addView(title);
        ScrollView scroll = new ScrollView(activity);
        LinearLayout entries = new LinearLayout(activity);
        entries.setOrientation(VERTICAL);
        for (String[] entry : MORE) {
            Button button = new Button(activity, null, android.R.attr.borderlessButtonStyle);
            String label = entry[1];
            if ("clips".equals(entry[0]) && !videoCount.isEmpty()) label += "  ·  " + videoCount + " new";
            button.setText(label);
            button.setAllCaps(false);
            button.setGravity(Gravity.CENTER_VERTICAL | Gravity.START);
            button.setTextColor(entry[0].equals(section) ? GOLD : Color.WHITE);
            button.setSelected(entry[0].equals(section));
            button.setOnClickListener(view -> {
                dialog.dismiss();
                navigate.accept(entry[0]);
            });
            entries.addView(button, new LayoutParams(-1, dp(48)));
        }
        scroll.addView(entries);
        int maxHeight = activity.getResources().getDisplayMetrics().heightPixels * 3 / 5;
        sheet.addView(scroll, new LayoutParams(-1, Math.min(maxHeight, dp(48 * MORE.length))));
        dialog.setContentView(sheet);
        Window window = dialog.getWindow();
        if (window == null) return;
        window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        window.setGravity(Gravity.BOTTOM);
        window.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
        window.setDimAmount(0.55f);
        dialog.show();
        window.setLayout(-1, -2);
    }

    private int dp(int px) { return Math.round(px * getResources().getDisplayMetrics().density); }

    private final class Tab extends LinearLayout {
        private final int index;
        private final TextView label;
        private final Glyph icon;
        private String badge = "";

        Tab(int index) {
            super(activity);
            this.index = index;
            setOrientation(VERTICAL);
            setGravity(Gravity.CENTER);
            setFocusable(true);
            android.util.TypedValue ripple = new android.util.TypedValue();
            activity.getTheme().resolveAttribute(android.R.attr.selectableItemBackground, ripple, true);
            setForeground(activity.getDrawable(ripple.resourceId));
            icon = new Glyph();
            icon.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            addView(icon, new LayoutParams(dp(46), dp(28)));
            label = new TextView(activity);
            label.setText(LABELS[index]);
            label.setTextSize(11);
            label.setGravity(Gravity.CENTER);
            label.setSingleLine(true);
            label.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            addView(label);
            update(false, "");
        }

        void update(boolean selected, String count) {
            badge = count;
            setSelected(selected);
            label.setTextColor(selected ? GOLD : MUTED);
            setContentDescription(LABELS[index] + (badge.isEmpty() ? "" : ", " + badge + " new"));
            icon.invalidate();
        }

        @Override public CharSequence getAccessibilityClassName() { return Button.class.getName(); }

        private final class Glyph extends View {
            private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            private final Path path = new Path();
            Glyph() { super(activity); }

            @Override protected void onDraw(Canvas canvas) {
                super.onDraw(canvas);
                canvas.save();
                canvas.translate(getWidth() / 2f, getHeight() / 2f);
                float scale = getResources().getDisplayMetrics().density;
                canvas.scale(scale, scale);
                if (Tab.this.isSelected()) {
                    paint.setStyle(Paint.Style.FILL);
                    paint.setColor(0xFF2D3947);
                    canvas.drawRoundRect(-22, -13, 22, 13, 13, 13, paint);
                }
                paint.setColor(Tab.this.isSelected() ? GOLD : MUTED);
                paint.setStyle(Paint.Style.STROKE);
                paint.setStrokeWidth(1.65f);
                paint.setStrokeCap(Paint.Cap.ROUND);
                paint.setStrokeJoin(Paint.Join.ROUND);
                if (index == 0) {
                    canvas.drawRoundRect(-7, -8, 7, 8, 2, 2, paint);
                    canvas.drawLine(-3, -3, 3, -3, paint);
                    canvas.drawLine(-3, 1, 3, 1, paint);
                    canvas.drawLine(-3, 5, 1, 5, paint);
                } else if (index == 1) {
                    canvas.drawRoundRect(-8, -7, 8, 8, 2, 2, paint);
                    canvas.drawLine(-8, -2, 8, -2, paint);
                    canvas.drawLine(-2, 2, 2, 2, paint);
                } else if (index == 2 || index == 3) {
                    path.reset();
                    path.moveTo(-7, -6); path.lineTo(7, -6); path.lineTo(7, 4);
                    path.lineTo(-2, 4); path.lineTo(-7, 8); path.close();
                    canvas.drawPath(path, paint);
                    if (index == 2) {
                        canvas.drawLine(-3, -2, 3, -2, paint);
                        canvas.drawLine(-3, 1, 1, 1, paint);
                    }
                } else {
                    for (int x = -5; x <= 5; x += 5) canvas.drawCircle(x, 0, 0.9f, paint);
                }
                if (!badge.isEmpty()) {
                    paint.setStyle(Paint.Style.FILL);
                    paint.setColor(0xFFE3BD79);
                    canvas.drawCircle(13, -7, 3, paint);
                }
                canvas.restore();
            }
        }
    }
}
