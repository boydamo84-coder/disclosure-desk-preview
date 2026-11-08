package com.disclosuredesk.preview;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.time.OffsetDateTime;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

public final class DiscoveryWorker extends Worker {
    public static final String JOB="dd-alert-checks";
    public static final String PREFS="dd-notifications";
    private static final String BASE="https://uapdisclosuredesk.com/data/";
    public DiscoveryWorker(@NonNull Context ctx,@NonNull WorkerParameters params){super(ctx,params);}
    private JSONArray fetch(String name) throws Exception {
        HttpURLConnection conn=(HttpURLConnection)new URL(BASE+name).openConnection();
        try {
            conn.setConnectTimeout(10000);conn.setReadTimeout(12000);
            if(conn.getResponseCode()!=200)throw new Exception("HTTP "+conn.getResponseCode());
            byte[] data;
            try(InputStream stream=conn.getInputStream()){data=stream.readNBytes(2500000);}
            return new JSONArray(new String(data,StandardCharsets.UTF_8));
        } finally {conn.disconnect();}
    }
    private void check(String type,String filename,boolean video,SharedPreferences prefs){
        if(!prefs.getBoolean(type,false))return;
        try{
            JSONArray entries=fetch(filename);
            Set<String> current=new HashSet<>();
            for(int i=0;i<entries.length();i++){
                JSONObject c=entries.optJSONObject(i);
                if(c==null)continue;
                if(!video){
                    if(!"major".equals(c.optString("priority","standard")))continue;
                    try{
                        Instant published=OffsetDateTime.parse(c.optString("date","")).toInstant();
                        long hours=Duration.between(published,Instant.now()).toHours();
                        if(hours<0 || hours>48)continue;
                    }catch(Exception badDate){continue;}
                }
                if(video && (c.optBoolean("videoAvailable",true)==false || !(c.has("youtubeId")||c.has("dvidsId")||c.has("media"))))continue;
                String id=c.optString("id","");
                if(!id.isEmpty())current.add(id);
            }
            if(current.isEmpty()){
                prefs.edit().putString("check-"+type,"No eligible records in published feed").apply();
                return;
            }
            String storage="known-"+type;
            Set<String> previous=prefs.getStringSet(storage,null);
            int added=0;
            JSONObject newest=null;
            if(previous!=null)for(int i=0;i<entries.length();i++){
                JSONObject candidate=entries.optJSONObject(i);
                if(candidate==null)continue;
                String candidateId=candidate.optString("id","");
                if(current.contains(candidateId)&&!previous.contains(candidateId)){
                    added++;
                    if(newest==null)newest=candidate;
                }
            }
            prefs.edit().putStringSet(storage,new HashSet<>(current)).apply();
            prefs.edit().putString("check-"+type,(previous==null?"Baseline recorded: ":"Feed OK: ")+current.size()+" eligible; "+added+" new").apply();
            if(previous!=null&&added>0 && newest!=null){
                String headline=newest.optString(video?"title":"headline",video?"New research video":"New major UAP story");
                sendNotification(type,video?"New research video":"Major UAP news",headline+(added>1?"  ·  +"+(added-1)+" more":""),video?501:502,newest.optString("id",""));
            }
        }catch(Exception ex){
            prefs.edit().putString("check-"+type,"Check failed: "+ex.getClass().getSimpleName()).apply();
            android.util.Log.w("DisclosureDesk","Alert check deferred: "+type,ex);
        }
    }
    @NonNull @Override public Result doWork(){
        if(getInputData().getBoolean("dd_test",false)){
            sendNotification("test","TEST · Disclosure Desk","Background alert test — not a real news story.",503,"");
            return Result.success();
        }
        SharedPreferences p=getApplicationContext().getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        check("videos","disclosure-clips.json",true,p);
        check("news","news-alerts.json",false,p);
        String summary="Videos: "+p.getString("check-videos","Off or not checked")+"; News: "+p.getString("check-news","Off or not checked");
        p.edit().putLong("last-check-time",System.currentTimeMillis()).putString("last-check-summary",summary).apply();
        return Result.success();
    }
    private void sendNotification(String type,String title,String message,int notificationId,String recordId){
        Context ctx=getApplicationContext();
        if(Build.VERSION.SDK_INT>=33&&ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        NotificationManager mgr=(NotificationManager)ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if(mgr==null)return;
        String channel="dd-"+type;
        mgr.createNotificationChannel(new NotificationChannel(channel,type.equals("news")?"Major-media UAP news":type.equals("test")?"Test alerts":"Fresh video discoveries",NotificationManager.IMPORTANCE_DEFAULT));
        Intent open=new Intent(ctx,MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if(!recordId.isEmpty() && !type.equals("test")){
            open.putExtra("dd_type",type);
            open.putExtra("dd_record_id",recordId);
            open.setData(android.net.Uri.parse("https://uapdisclosuredesk.com/?dd_"+type+"="+android.net.Uri.encode(recordId)));
        }
        PendingIntent intent=PendingIntent.getActivity(ctx,notificationId,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notice=new Notification.Builder(ctx,channel)
            .setSmallIcon(android.R.drawable.ic_menu_search).setContentTitle(title).setContentText(message).setStyle(new Notification.BigTextStyle().bigText(message))
            .setContentIntent(intent).setAutoCancel(true).build();
        mgr.notify(notificationId,notice);
    }
}
