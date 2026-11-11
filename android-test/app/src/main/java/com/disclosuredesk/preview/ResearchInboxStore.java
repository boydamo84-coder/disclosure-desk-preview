package com.disclosuredesk.preview;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** Device-only Android share-target inbox. No database, account or cloud writes. */
public final class ResearchInboxStore {
    private static final String PREFS="dd-native-research-inbox-v1";
    private static final String KEY="saved-links";
    public static final int MAX_ITEMS=50;
    private final SharedPreferences preferences;

    public static final class Item {
        public final String url;
        public final String title;
        public final long addedAt;
        Item(String url,String title,long addedAt) {
            this.url=url;this.title=title;this.addedAt=addedAt;
        }
    }

    public ResearchInboxStore(Context context) {
        preferences=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    }

    public synchronized List<Item> list() {
        List<Item> items=new ArrayList<>();
        try {
            JSONArray rows=new JSONArray(preferences.getString(KEY,"[]"));
            for (int i=0;i<rows.length() && items.size()<MAX_ITEMS;i++) {
                JSONObject row=rows.optJSONObject(i);
                if (row==null)continue;
                String url=ResearchLinkParser.cleanUrl(row.optString("url",""));
                if (url==null)continue;
                String title=row.optString("title","Shared research link").trim();
                if (title.isEmpty())title="Shared research link";
                if (title.length()>120)title=title.substring(0,120);
                items.add(new Item(url,title,row.optLong("addedAt",0)));
            }
        } catch (Exception ignored) {
            // Corrupt local preference cannot crash the app; no automatic deletion.
        }
        return items;
    }

    public synchronized boolean add(ResearchLinkParser.Entry incoming) {
        if (incoming==null || ResearchLinkParser.cleanUrl(incoming.url)==null)return false;
        JSONArray updated=new JSONArray();
        put(updated,incoming.url,incoming.title,System.currentTimeMillis());
        for (Item item:list()) {
            if (updated.length()>=MAX_ITEMS)break;
            if (!item.url.equals(incoming.url))put(updated,item.url,item.title,item.addedAt);
        }
        return preferences.edit().putString(KEY,updated.toString()).commit();
    }

    public synchronized boolean remove(String target) {
        JSONArray updated=new JSONArray();
        boolean found=false;
        for (Item item:list()) {
            if (item.url.equals(target)){found=true;continue;}
            put(updated,item.url,item.title,item.addedAt);
        }
        if (!found)return false;
        return preferences.edit().putString(KEY,updated.toString()).commit();
    }

    public synchronized boolean clear() {
        return preferences.edit().remove(KEY).commit();
    }

    private static void put(JSONArray rows,String url,String title,long addedAt) {
        try {
            JSONObject item=new JSONObject();
            item.put("url",url);
            item.put("title",title);
            item.put("addedAt",addedAt);
            rows.put(item);
        } catch (Exception ignored) {
            // Validated short strings and primitive values do not normally fail.
        }
    }
}
