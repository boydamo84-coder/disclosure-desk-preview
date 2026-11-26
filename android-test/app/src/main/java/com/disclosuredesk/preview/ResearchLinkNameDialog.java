package com.disclosuredesk.preview;

import android.app.Activity;
import android.app.AlertDialog;
import android.text.InputFilter;
import android.text.InputType;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

final class ResearchLinkNameDialog {
    static void show(Activity activity, ResearchInboxStore store, String url, boolean afterShare,
                     Runnable onSaved) {
        if (activity.isFinishing() || activity.isDestroyed()) return;
        ResearchInboxStore.Item selected = null;
        for (ResearchInboxStore.Item item : store.list()) {
            if (item.url.equals(url)) {
                selected = item;
                break;
            }
        }
        if (selected == null) return;

        LinearLayout body = new LinearLayout(activity);
        int side = Math.round(24 * activity.getResources().getDisplayMetrics().density);
        body.setPadding(side, 0, side, 0);
        EditText name = new EditText(activity);
        name.setHint("Link name");
        name.setSingleLine(true);
        name.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        name.setFilters(new InputFilter[]{new InputFilter.LengthFilter(120)});
        name.setText(selected.title);
        name.setSelectAllOnFocus(true);
        body.addView(name, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        AlertDialog editor = new AlertDialog.Builder(activity)
                .setTitle(afterShare ? "Name your saved link" : "Rename research link")
                .setView(body)
                .setNegativeButton(afterShare ? "Later" : "Cancel", null)
                .setPositiveButton("Save name", null)
                .create();
        editor.setOnShowListener(dialog ->
                editor.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(view -> {
                    String proposed = ResearchLinkParser.cleanCustomTitle(name.getText().toString());
                    if (proposed == null) {
                        name.setError("Enter a name for this link.");
                        return;
                    }
                    if (!store.rename(url, proposed)) {
                        name.setError("Could not save this name.");
                        return;
                    }
                    editor.dismiss();
                    Toast.makeText(activity, "Link name saved.", Toast.LENGTH_SHORT).show();
                    onSaved.run();
                }));
        editor.show();
    }
}
