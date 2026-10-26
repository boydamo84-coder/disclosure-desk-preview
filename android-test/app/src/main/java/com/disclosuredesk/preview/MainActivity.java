package com.disclosuredesk.preview;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.ExistingPeriodicWorkPolicy;
import java.util.concurrent.TimeUnit;
import android.view.Gravity;
import android.view.WindowInsets;
import android.os.Build;
import android.graphics.Color;
import android.webkit.WebChromeClient.CustomViewCallback;

public final class MainActivity extends Activity {
    private static final String HOME = "https://boydamo84-coder.github.io/disclosure-desk-preview/";
    private WebView web;
    private FrameLayout root;
    private View fullView;
    private View splash;
    private CustomViewCallback fullCallback;
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        ImageView mark=new ImageView(this);
        mark.setImageResource(com.disclosuredesk.preview.R.drawable.dd_emblem);
        mark.setScaleType(ImageView.ScaleType.FIT_CENTER);
        FrameLayout launch=new FrameLayout(this);
        launch.setBackgroundColor(Color.rgb(11,19,28));
        FrameLayout.LayoutParams markParams=new FrameLayout.LayoutParams(dp(200),dp(200),Gravity.CENTER);
        launch.addView(mark,markParams);
        splash=launch;
        root.addView(launch,new FrameLayout.LayoutParams(-1,-1));
        Button notifications=new Button(this);
        notifications.setText("🔔");
        notifications.setContentDescription("Notification preferences");
        notifications.setTextSize(15);
        notifications.setAllCaps(false);
        FrameLayout.LayoutParams bell=new FrameLayout.LayoutParams(dp(55),dp(48),Gravity.TOP|Gravity.RIGHT);
        bell.topMargin=dp(3);bell.rightMargin=dp(4);
        root.addView(notifications,bell);
        notifications.setOnClickListener(v->notificationSettings());
        setContentView(root);
        // Android 15+ enforces edge-to-edge for target SDK 35. Keep web content below the status bar.
        if(Build.VERSION.SDK_INT >= 35){
            root.setOnApplyWindowInsetsListener((view,insets)->{
                int top=insets.getInsets(WindowInsets.Type.statusBars()).top;
                view.setPadding(0,top,0,0);
                return insets;
            });
            root.requestApplyInsets();
        }
        web.setBackgroundColor(Color.rgb(9,16,28));
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageCommitVisible(WebView view,String url){if(splash!=null){root.removeView(splash);splash=null;}}
            @Override public void onPageFinished(WebView view,String url){if(splash!=null){root.removeView(splash);splash=null;}}
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri url=request.getUrl();
                String host=url.getHost();
                if(host != null && (host.equals("boydamo84-coder.github.io") || host.equals("www.youtube-nocookie.com") || host.equals("www.youtube.com") || host.equals("www.dvidshub.net"))) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW,url)); } catch(Exception ignored) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onShowCustomView(View view,CustomViewCallback callback){
                if(fullView!=null){callback.onCustomViewHidden();return;}
                fullView=view;fullCallback=callback;
                web.setVisibility(View.GONE);
                root.addView(view,new FrameLayout.LayoutParams(-1,-1));
            }
            @Override public void onHideCustomView(){
                if(fullView==null)return;
                root.removeView(fullView);fullView=null;
                web.setVisibility(View.VISIBLE);
                if(fullCallback!=null){fullCallback.onCustomViewHidden();fullCallback=null;}
            }
        });
        web.loadUrl(HOME);
    }
    private void notificationSettings(){
        SharedPreferences prefs=getSharedPreferences(DiscoveryWorker.PREFS,MODE_PRIVATE);
        LinearLayout choices=new LinearLayout(this);
        choices.setOrientation(LinearLayout.VERTICAL);
        choices.setPadding(dp(24),dp(12),dp(20),dp(12));
        CheckBox footage=new CheckBox(this);
        footage.setText("Fresh video discoveries");
        footage.setChecked(prefs.getBoolean("videos",false));
        CheckBox news=new CheckBox(this);
        news.setText("Major-media UAP news");
        news.setChecked(prefs.getBoolean("news",false));
        choices.addView(footage);choices.addView(news);
        new AlertDialog.Builder(this).setTitle("Discovery alerts")
          .setMessage("Optional alerts. Checks run approximately every 2 hours. You will not get an alert for the existing library. News comes from attributed mainstream media reporting, not verified proof of extraordinary claims.")
          .setView(choices).setNegativeButton("Cancel",null)
          .setPositiveButton("Save",(dialog,which)->{
              boolean vids=footage.isChecked(),stories=news.isChecked();
              prefs.edit().putBoolean("videos",vids).putBoolean("news",stories).apply();
              if(vids||stories){
                  PeriodicWorkRequest req=new PeriodicWorkRequest.Builder(DiscoveryWorker.class,2,TimeUnit.HOURS).build();
                  WorkManager.getInstance(this).enqueueUniquePeriodicWork(DiscoveryWorker.JOB,ExistingPeriodicWorkPolicy.KEEP,req);
                  if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712);
              }else WorkManager.getInstance(this).cancelUniqueWork(DiscoveryWorker.JOB);
          }).show();
    }
    private int dp(int pixels){return (int)(pixels*getResources().getDisplayMetrics().density+0.5f);}
    @Override public void onBackPressed(){
        if(fullView!=null){ ((WebChromeClient)web.getWebChromeClient()).onHideCustomView();return; }
        web.evaluateJavascript("(function(){var d=document.getElementById('immersiveViewer');if(d&&!d.hidden){var c=document.getElementById('closeImmersive');if(c)c.click();return 'handled'};var active=document.querySelector('.tab.active');if(active&&active.dataset.tab!=='discover'){var n=document.querySelector('[data-tab=discover]');if(n)n.click();return 'handled'};return 'exit'})()",value->{
            if(!"\"handled\"".equals(value)){
                if(web.canGoBack())web.goBack();else finish();
            }
        });
    }
    @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
