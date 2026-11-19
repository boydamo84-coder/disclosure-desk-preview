package com.disclosuredesk.preview;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/**
 * Device-only notification inbox; contains titles and safe route IDs, never
 * message bodies, auth tokens, sender identities or server-side vote data.
 * Account-bound chat entries are wiped on account change and logout.
 */
final class NotificationInboxStore {
    private static final String PREFS="dd-android-notification-inbox-m96";
    private static final String KEY="entries";
    private static final int LIMIT=60;
    private static final long TTL=14L*24L*60L*60L*1000L;
    private NotificationInboxStore() { }

    static final class Entry {
        final String type,id,owner,title;
        final long time;
        final boolean read;
        Entry(String type,String id,String owner,String title,long time,boolean read){
            this.type=type;this.id=id;this.owner=owner;this.title=title;this.time=time;this.read=read;
        }
        String key(){return type+"|"+owner+"|"+id;}
    }

    private static SharedPreferences prefs(Context context){
        return context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    }
    private static boolean valid(Entry e){
        if(!("chat".equals(e.type)||"news".equals(e.type)||"videos".equals(e.type)||"test".equals(e.type)))return false;
        if(e.id.length()>150||e.title.length()>150||e.title.isEmpty())return false;
        if("chat".equals(e.type))return ChatNotificationGate.canOpen(e.owner,e.owner,e.id);
        if(!e.owner.isEmpty())return false;
        return "test".equals(e.type)?e.id.isEmpty():e.id.matches("[A-Za-z0-9_-]{1,150}");
    }
    private static List<Entry> load(Context context){
        List<Entry> result=new ArrayList<>();
        long now=System.currentTimeMillis();
        try{
            JSONArray array=new JSONArray(prefs(context).getString(KEY,"[]"));
            for(int i=0;i<array.length() && result.size()<LIMIT;i++){
                JSONObject o=array.optJSONObject(i);
                if(o==null)continue;
                Entry e=new Entry(o.optString("type"),o.optString("id"),o.optString("owner"),
                    o.optString("title"),o.optLong("time"),o.optBoolean("read"));
                if(valid(e)&&e.time>now-TTL&&e.time<=now+60_000L)result.add(e);
            }
        }catch(Exception ignored){ /* Invalid/old records do not grant visibility. */ }
        return result;
    }
    private static void save(Context context,List<Entry> entries){
        JSONArray out=new JSONArray();
        for(Entry e:entries){
            if(out.length()>=LIMIT)break;
            try{
                JSONObject o=new JSONObject();
                o.put("type",e.type);o.put("id",e.id);o.put("owner",e.owner);
                o.put("title",e.title);o.put("time",e.time);o.put("read",e.read);
                out.put(o);
            }catch(Exception ignored){}
        }
        prefs(context).edit().putString(KEY,out.toString()).apply();
    }
    static synchronized void record(Context context,String type,String id,String owner,String title){
        Entry added=new Entry(type,id,owner,title==null?"":title.trim().substring(0,Math.min(140,title.trim().length())),
            System.currentTimeMillis(),false);
        if(!valid(added))return;
        List<Entry> next=new ArrayList<>();next.add(added);
        for(Entry e:load(context)){
            if(!e.key().equals(added.key())&&next.size()<LIMIT)next.add(e);
        }
        save(context,next);
    }
    static synchronized List<Entry> visible(Context context,String signedInUser){
        List<Entry> result=new ArrayList<>();
        for(Entry e:load(context)){
            if(!"chat".equals(e.type)||ChatNotificationGate.canOpen(e.owner,signedInUser,e.id))result.add(e);
        }
        return result;
    }
    static synchronized void markRead(Context context,Entry item){
        List<Entry> entries=load(context),updated=new ArrayList<>();
        for(Entry e:entries){
            updated.add(e.key().equals(item.key())?new Entry(e.type,e.id,e.owner,e.title,e.time,true):e);
        }
        save(context,updated);
    }
    static synchronized void markAllRead(Context context,String owner){
        List<Entry> updated=new ArrayList<>();
        for(Entry e:load(context)){
            boolean visible=!"chat".equals(e.type)||ChatNotificationGate.canOpen(e.owner,owner,e.id);
            updated.add(visible?new Entry(e.type,e.id,e.owner,e.title,e.time,true):e);
        }
        save(context,updated);
    }
    static synchronized void clearPrivate(Context context){
        List<Entry> updated=new ArrayList<>();
        for(Entry e:load(context))if(!"chat".equals(e.type))updated.add(e);
        save(context,updated);
    }
}
