package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Typeface;
import android.os.Build;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

final class AppTour {
    private final String[][] steps;
    private final AlertDialog dialog;
    private final ScrollView scroll;
    private final TextView progress;
    private final TextView heading;
    private final TextView body;
    private final Button inbox;
    private int step;

    AppTour(Activity activity, Runnable openInbox) {
        steps = new String[][]{
            {"Find your way around",
                "Use the bottom tabs to move between News, Archive, Map and more. Swipe the tab row to see the rest. You can browse without signing in. Use Profile for your account and saved work."},
            {"Open the Desk menu",
                "Tap Desk at the top right for Research Inbox, Offline Archive and Notification centre. You can replay this tour from Desk at any time."},
            {"Save a link from another app",
                ResearchInboxActivity.shareInstructions(activity)
                    + " Give it a name you’ll recognise, or tap Later and rename it from the Inbox."},
            {"Find and organise your links",
                "Open Desk → Research Inbox. Search by title or website and tap a link to open it. Use ⋯ to rename, copy or remove it. Anyone using this installation can see the links. They stay on this device and don’t sync to your account."},
            {"Use the archive and alerts",
                "Open Desk → Offline Archive to read bundled case records without a connection. Original sources may need internet access. To opt into news or video alerts, open Desk → Notification settings. Recent alerts are in Notification centre."}
        };

        float density = activity.getResources().getDisplayMetrics().density;
        int inset = Math.round(24 * density);
        int gap = Math.round(12 * density);
        LinearLayout content = new LinearLayout(activity);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(inset, gap, inset, gap);

        progress = new TextView(activity);
        progress.setTextSize(13);
        progress.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        content.addView(progress);

        heading = new TextView(activity);
        heading.setTextSize(22);
        heading.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        heading.setPadding(0, gap, 0, gap);
        if (Build.VERSION.SDK_INT >= 28) heading.setAccessibilityHeading(true);
        content.addView(heading);

        body = new TextView(activity);
        body.setTextSize(16);
        body.setLineSpacing(Math.round(3 * density), 1f);
        content.addView(body);

        inbox = new Button(activity);
        inbox.setText("Open Research Inbox");
        inbox.setAllCaps(false);
        LinearLayout.LayoutParams inboxLayout = new LinearLayout.LayoutParams(-1, -2);
        inboxLayout.topMargin = gap;
        content.addView(inbox, inboxLayout);

        scroll = new ScrollView(activity);
        scroll.addView(content);
        dialog = new AlertDialog.Builder(activity)
            .setTitle("Disclosure Desk app tour")
            .setView(scroll)
            .setNegativeButton("Skip", null)
            .setNeutralButton("Back", null)
            .setPositiveButton("Next", null)
            .create();
        dialog.setCanceledOnTouchOutside(false);
        inbox.setOnClickListener(view -> {
            dialog.dismiss();
            openInbox.run();
        });
    }

    AlertDialog show() {
        dialog.show();
        dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(view -> render(step - 1));
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(view -> {
            if (step == steps.length - 1) dialog.dismiss();
            else render(step + 1);
        });
        render(0);
        return dialog;
    }

    private void render(int position) {
        step = position;
        progress.setText("Step " + (step + 1) + " of " + steps.length);
        heading.setText(steps[step][0]);
        body.setText(steps[step][1]);
        inbox.setVisibility(step == 3 ? View.VISIBLE : View.GONE);
        dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setVisibility(step == 0 ? View.GONE : View.VISIBLE);
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setText(step == steps.length - 1 ? "Done" : "Next");
        scroll.scrollTo(0, 0);
    }
}
