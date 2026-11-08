package com.disclosuredesk.preview;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * FCM data-message receiver for private 1:1 Chat.
 * Messages deliberately never contain/chat-log a body or public email.
 * Server must authenticate and target the recipient's registered device(s).
 */
public final class ChatPushService extends FirebaseMessagingService {
    private static final String CHANNEL="dd-private-chat";
    @Override public void onMessageReceived(@NonNull RemoteMessage message){
        if(!"chat".equals(message.getData().get("type")))return;
        String pair=message.getData().get("pair_id");
        if(pair==null || !pair.matches("(?i)[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}"))return;
        if(!getSharedPreferences(DiscoveryWorker.PREFS,Context.MODE_PRIVATE).getBoolean("chats",true))return;
        if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        NotificationManager manager=(NotificationManager)getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        manager.createNotificationChannel(new NotificationChannel(CHANNEL,"Private Chat",NotificationManager.IMPORTANCE_DEFAULT));
        Intent go=new Intent(this,MainActivity.class);
        go.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        go.putExtra("dd_type","chat");
        go.putExtra("dd_record_id",pair);
        go.setData(android.net.Uri.parse("https://uapdisclosuredesk.com/?dd_tab=chatPage&dd_chat="+pair));
        PendingIntent tap=PendingIntent.getActivity(this,pair.hashCode(),go,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notification=new Notification.Builder(this,CHANNEL)
          .setSmallIcon(android.R.drawable.ic_dialog_email)
          .setContentTitle("Disclosure Desk Chat")
          .setContentText("You have a new private message.")
          .setVisibility(Notification.VISIBILITY_PRIVATE)
          .setContentIntent(tap).setAutoCancel(true).build();
        manager.notify(pair.hashCode(),notification);
    }
}
