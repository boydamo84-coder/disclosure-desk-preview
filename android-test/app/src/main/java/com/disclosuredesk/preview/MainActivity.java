package com.disclosuredesk.preview;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import java.text.DateFormat;
import java.util.Date;
import android.view.View;
import android.webkit.WebChromeClient;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.json.JSONObject;
import java.util.Collections;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.graphics.Typeface;
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
import androidx.work.OneTimeWorkRequest;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.WorkManager;
import androidx.work.ExistingPeriodicWorkPolicy;
import java.util.concurrent.TimeUnit;
import android.view.Gravity;
import android.view.WindowInsets;
import android.os.Build;
import android.graphics.Color;
import android.webkit.WebChromeClient.CustomViewCallback;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

public final class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 4312;
    private ValueCallback<Uri[]> pendingFiles;
    private static final String HOME = "https://uapdisclosuredesk.com/";
    private WebView web;
    private FrameLayout root;
    private View fullView;
    private View splash;
    private View offlinePanel;
    private boolean mainPageFailed=false;
    private CustomViewCallback fullCallback;
    private AdView adView;
    private ConsentInformation consentInformation;
    private boolean adStarted=false;
    private boolean adFree=false;
    private boolean adConsentReady=false;
    private LifetimeAdsManager premium;
    // Real unit configured in AdMob: ca-app-pub-6712657097464071/7357709206
    // All test builds MUST use Google test inventory; never use the real unit in this debug APK.
    private static final String TEST_BANNER_UNIT = "ca-app-pub-3940256099942544/6300978111";
    private static final String LIVE_BANNER_UNIT = "ca-app-pub-6712657097464071/7357709206";
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
        offlinePanel=createOfflinePanel();
        root.addView(offlinePanel,new FrameLayout.LayoutParams(-1,-1));
        offlinePanel.setVisibility(View.GONE);
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
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap favicon){
                if(HOME.equals(url))mainPageFailed=false;
            }
            @Override public void onPageCommitVisible(WebView view,String url){
                if(!mainPageFailed && HOME.equals(url))showOnline();
            }
            @Override public void onPageFinished(WebView view,String url){
                if(!mainPageFailed && HOME.equals(url))showOnline();
                if(url!=null && url.startsWith(HOME))deliverChatToken();
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame() && request.getUrl()!=null &&
                   ("uapdisclosuredesk.com".equals(request.getUrl().getHost()) ||
                    "www.uapdisclosuredesk.com".equals(request.getUrl().getHost()))){
                    mainPageFailed=true;
                    showOffline();
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri url=request.getUrl();
                String host=url.getHost();
                if(host != null && (host.equals("uapdisclosuredesk.com") || host.equals("www.uapdisclosuredesk.com") || host.equals("www.youtube-nocookie.com") || host.equals("www.youtube.com") || host.equals("www.dvidshub.net"))) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW,url)); } catch(Exception ignored) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params){
                if(pendingFiles!=null){pendingFiles.onReceiveValue(null);pendingFiles=null;}
                pendingFiles=callback;
                try{
                    Intent picker=params.createIntent();
                    picker.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(picker,FILE_CHOOSER_REQUEST);
                    return true;
                }catch(Exception error){
                    pendingFiles=null;
                    callback.onReceiveValue(null);
                    android.widget.Toast.makeText(MainActivity.this,"Cannot open file picker on this device",android.widget.Toast.LENGTH_LONG).show();
                    return true;
                }
            }
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
        setupChatPushBridge();
        premium=new LifetimeAdsManager(this,this::setAdFree);
        web.loadUrl(notificationUrl(getIntent()));
        prepareTestBanner();
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==FILE_CHOOSER_REQUEST && pendingFiles!=null){
            ValueCallback<Uri[]> callback=pendingFiles;
            pendingFiles=null;
            callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
        }
    }
    private View createOfflinePanel(){
        LinearLayout panel=new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        panel.setPadding(dp(28),dp(24),dp(28),dp(24));
        panel.setBackgroundColor(Color.rgb(9,16,28));
        ImageView emblem=new ImageView(this);
        emblem.setImageResource(com.disclosuredesk.preview.R.drawable.dd_emblem);
        emblem.setScaleType(ImageView.ScaleType.FIT_CENTER);
        panel.addView(emblem,new LinearLayout.LayoutParams(dp(94),dp(94)));
        TextView title=new TextView(this);
        title.setText("DISCLOSURE DESK");
        title.setTextColor(Color.rgb(200,167,101));
        title.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        title.setTextSize(22);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0,dp(26),0,dp(8));
        panel.addView(title);
        TextView message=new TextView(this);
        message.setText("You're offline\\nConnect to the internet to access your latest research. Your saved account data has not been cleared.");
        message.setTextColor(Color.rgb(218,228,239));
        message.setTextSize(16);
        message.setGravity(Gravity.CENTER);
        message.setPadding(0,0,0,dp(22));
        panel.addView(message);
        Button retry=new Button(this);
        retry.setText("Retry connection");
        retry.setAllCaps(false);
        retry.setOnClickListener(v->{
            offlinePanel.setVisibility(View.GONE);
            mainPageFailed=false;
            web.loadUrl(HOME);
        });
        panel.addView(retry,new LinearLayout.LayoutParams(-1,dp(52)));
        return panel;
    }
    private void showOffline(){
        if(isFinishing() || offlinePanel==null)return;
        runOnUiThread(()->{
            if(splash!=null){root.removeView(splash);splash=null;}
            offlinePanel.setVisibility(View.VISIBLE);
            offlinePanel.bringToFront();
        });
    }
    private void showOnline(){
        if(isFinishing())return;
        runOnUiThread(()->{
            if(splash!=null){root.removeView(splash);splash=null;}
            if(offlinePanel!=null)offlinePanel.setVisibility(View.GONE);
        });
    }
    private void setAdFree(boolean active){
        adFree=active;
        runOnUiThread(()->{
            if(active){
                if(adView!=null){adView.destroy();root.removeView(adView);adView=null;}
                adStarted=false;
                FrameLayout.LayoutParams lp=(FrameLayout.LayoutParams)web.getLayoutParams();lp.bottomMargin=0;web.setLayoutParams(lp);
            }else if(adConsentReady && !adStarted)showTestBanner();
        });
    }
    private void prepareTestBanner(){
        consentInformation=UserMessagingPlatform.getConsentInformation(this);
        ConsentRequestParameters params=new ConsentRequestParameters.Builder().build();
        consentInformation.requestConsentInfoUpdate(this,params,
            ()->UserMessagingPlatform.loadAndShowConsentFormIfRequired(this,error->{
                adConsentReady=consentInformation.canRequestAds();if(adConsentReady&&!adFree)showTestBanner();
            }),
            error->{adConsentReady=consentInformation.canRequestAds();if(adConsentReady&&!adFree)showTestBanner();}
        );
    }
    private void showTestBanner(){
        if(adFree || adStarted || isFinishing() || isDestroyed())return;
        adStarted=true;
        MobileAds.initialize(this, status->runOnUiThread(()->{
            if(isFinishing() || isDestroyed() || adFree){adStarted=false;return;}
            adView=new AdView(this);
            adView.setAdUnitId((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0 ? TEST_BANNER_UNIT : LIVE_BANNER_UNIT);
            adView.setAdSize(AdSize.BANNER);
            FrameLayout.LayoutParams layout=new FrameLayout.LayoutParams(-2,dp(50),Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);
            root.addView(adView,layout);
            // Keep the web page clear of the banner rather than covering content.
            FrameLayout.LayoutParams webLayout=(FrameLayout.LayoutParams)web.getLayoutParams();
            webLayout.bottomMargin=dp(50);
            web.setLayoutParams(webLayout);
            adView.loadAd(new AdRequest.Builder().build());
        }));
    }
    private String notificationUrl(Intent intent){
        if(intent!=null){
            String kind=intent.getStringExtra("dd_type");
            String record=intent.getStringExtra("dd_record_id");
            if("chat".equals(kind) && record!=null && record.matches("(?i)[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}"))
                return HOME+"?dd_tab=chatPage&dd_chat="+Uri.encode(record);
            if(("news".equals(kind)||"videos".equals(kind)) && record!=null && record.matches("[A-Za-z0-9_-]{1,150}"))
                return HOME+"?dd_"+kind+"="+Uri.encode(record);
        }
        if(intent!=null && intent.getData()!=null){
            Uri data=intent.getData();
            if(("uapdisclosuredesk.com".equals(data.getHost()) || "www.uapdisclosuredesk.com".equals(data.getHost())) && "/".equals(data.getPath())){
                String id=data.getQueryParameter("dd_news");
                String key="dd_news";
                if(id==null){id=data.getQueryParameter("dd_videos");key="dd_videos";}
                if(id!=null && id.matches("[A-Za-z0-9_-]{1,150}"))return HOME+"?"+key+"="+Uri.encode(id);
            }
        }
        return HOME;
    }
    @Override protected void onNewIntent(Intent intent){
        super.onNewIntent(intent);
        setIntent(intent);
        String target=notificationUrl(intent);
        if(!HOME.equals(target)&&web!=null)web.loadUrl(target);
    }
    private void setupChatPushBridge(){
        // Never use addJavascriptInterface: that API exposes privileged handlers to
        // untrusted third-party iframes. This bridge is main-frame + origin restricted.
        if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)){
            WebViewCompat.addWebMessageListener(web,"DDAndroid",
              Collections.singleton("https://uapdisclosuredesk.com"),
              (view,message,origin,isMainFrame,reply)->{
                if(!isMainFrame || origin==null || !"https".equals(origin.getScheme()) ||
                   !"uapdisclosuredesk.com".equals(origin.getHost()))return;
                try{
                    JSONObject data=new JSONObject(message.getData());
                    if(!"account".equals(data.optString("type")))return;
                    String id=data.optString("user_id","");
                    boolean signedIn=id.matches("(?i)[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}");
                    String previous=getSharedPreferences("dd-chat-push",MODE_PRIVATE).getString("active-user","");
                    if(!signedIn){
                        getSharedPreferences("dd-chat-push",MODE_PRIVATE).edit().remove("active-user").apply();
                        if(!FirebaseApp.getApps(this).isEmpty())FirebaseMessaging.getInstance().deleteToken();
                    }else{
                        getSharedPreferences("dd-chat-push",MODE_PRIVATE).edit().putString("active-user",id).apply();
                        if(!id.equals(previous))deliverChatToken();
                    }
                }catch(Exception ignored){/* Never allow malformed web messages to crash the activity. */}
              });
        }
        if(BuildConfig.DD_FIREBASE_APP_ID.isEmpty() || BuildConfig.DD_FIREBASE_PROJECT_ID.isEmpty() ||
           BuildConfig.DD_FIREBASE_API_KEY.isEmpty() || BuildConfig.DD_FIREBASE_SENDER_ID.isEmpty())return;
        try{
            if(FirebaseApp.getApps(this).isEmpty()){
                FirebaseOptions options=new FirebaseOptions.Builder()
                  .setApplicationId(BuildConfig.DD_FIREBASE_APP_ID)
                  .setApiKey(BuildConfig.DD_FIREBASE_API_KEY)
                  .setProjectId(BuildConfig.DD_FIREBASE_PROJECT_ID)
                  .setGcmSenderId(BuildConfig.DD_FIREBASE_SENDER_ID).build();
                FirebaseApp.initializeApp(this,options);
            }
        }catch(Exception problem){android.util.Log.w("DisclosureDesk","FCM unavailable for this build.");}
    }
    private void deliverChatToken(){
        if(FirebaseApp.getApps(this).isEmpty() || web==null)return;
        String url=web.getUrl();
        if(url==null || !url.startsWith(HOME))return;
        String owner=getSharedPreferences("dd-chat-push",MODE_PRIVATE).getString("active-user","");
        if(owner==null || owner.isEmpty())return;
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token->{
            String address=web.getUrl();
            if(address!=null && address.startsWith(HOME) && !token.isEmpty())
              web.evaluateJavascript("window.dispatchEvent(new CustomEvent('dd-android-token',{detail:"+JSONObject.quote(token)+"}))",null);
        });
    }
    private void notificationSettings(){
        SharedPreferences prefs=getSharedPreferences(DiscoveryWorker.PREFS,MODE_PRIVATE);
        LinearLayout choices=new LinearLayout(this);
        choices.setOrientation(LinearLayout.VERTICAL);
        choices.setPadding(dp(24),dp(12),dp(20),dp(12));
        CheckBox footage=new CheckBox(this);
        footage.setText("Fresh video discoveries");
        footage.setChecked(prefs.getBoolean("videos",false));
        CheckBox chats=new CheckBox(this);
        chats.setText("Private Chat messages");
        chats.setChecked(prefs.getBoolean("chats",true));
        choices.addView(chats);
        CheckBox news=new CheckBox(this);
        news.setText("Major-media UAP news");
        news.setChecked(prefs.getBoolean("news",false));
        choices.addView(footage);choices.addView(news);
        Button removeAds=new Button(this);
        removeAds.setText("Remove Ads · lifetime / restore purchase");
        removeAds.setAllCaps(false);
        choices.addView(removeAds);
        removeAds.setOnClickListener(v->{if(premium!=null)premium.showOptions();});
        Button test=new Button(this);
        test.setText("Schedule TEST alert (about 1 minute)");
        test.setAllCaps(false);
        choices.addView(test);
        test.setOnClickListener(v->{
            if(Build.VERSION.SDK_INT>=33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED){
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712);
                android.widget.Toast.makeText(this,"Allow notifications, then tap TEST again.",android.widget.Toast.LENGTH_LONG).show();
                return;
            }
            Data data=new Data.Builder().putBoolean("dd_test",true).build();
            OneTimeWorkRequest req=new OneTimeWorkRequest.Builder(DiscoveryWorker.class).setInputData(data).setInitialDelay(1,TimeUnit.MINUTES).build();
            WorkManager.getInstance(this).enqueueUniqueWork("dd-test-notification",ExistingWorkPolicy.REPLACE,req);
            android.widget.Toast.makeText(this,"TEST scheduled. Close the app; Android can delay background jobs.",android.widget.Toast.LENGTH_LONG).show();
        });
        Button checkNow=new Button(this);
        checkNow.setAllCaps(false);
        checkNow.setText("Check live feeds now");
        choices.addView(checkNow);
        checkNow.setOnClickListener(v->{
            OneTimeWorkRequest req=new OneTimeWorkRequest.Builder(DiscoveryWorker.class).build();
            WorkManager.getInstance(this).enqueueUniqueWork("dd-manual-check",ExistingWorkPolicy.REPLACE,req);
            android.widget.Toast.makeText(this,"Feed check queued. Reopen settings to see the result.",android.widget.Toast.LENGTH_LONG).show();
        });
        TextView status=new TextView(this);
        long checked=prefs.getLong("last-check-time",0);
        status.setText("Last feed check: "+(checked>0?DateFormat.getDateTimeInstance().format(new Date(checked))+"\n":"")+prefs.getString("last-check-summary","Not checked yet"));
        status.setTextSize(12);
        status.setPadding(0,dp(10),0,dp(8));
        choices.addView(status);
        Button battery=new Button(this);
        battery.setAllCaps(false);
        battery.setText("Battery settings / notification help");
        choices.addView(battery);
        battery.setOnClickListener(v->
            new AlertDialog.Builder(this).setTitle("Background notifications")
             .setMessage("Samsung battery restrictions may delay background checks. For more reliable alerts, open app settings, choose Battery, then Unrestricted if available. This is optional, may increase battery usage and does not guarantee instant alerts.")
             .setNegativeButton("Cancel",null)
             .setPositiveButton("Open settings",(d,which)->{
                try{startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getPackageName())));}
                catch(Exception ignored){}
             }).show()
        );
        new AlertDialog.Builder(this).setTitle("Discovery alerts")
          .setMessage("Optional alerts. Checks run approximately every 2 hours. You will not get an alert for the existing library. News comes from attributed mainstream media reporting, not verified proof of extraordinary claims.")
          .setView(choices).setNegativeButton("Cancel",null)
          .setPositiveButton("Save",(dialog,which)->{
              boolean vids=footage.isChecked(),stories=news.isChecked(),chatAlerts=chats.isChecked();
              prefs.edit().putBoolean("videos",vids).putBoolean("news",stories).putBoolean("chats",chatAlerts).apply();
              if(vids||stories){
                  PeriodicWorkRequest req=new PeriodicWorkRequest.Builder(DiscoveryWorker.class,2,TimeUnit.HOURS).build();
                  WorkManager.getInstance(this).enqueueUniquePeriodicWork(DiscoveryWorker.JOB,ExistingPeriodicWorkPolicy.KEEP,req);
                  if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
                    requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712);
              }else WorkManager.getInstance(this).cancelUniqueWork(DiscoveryWorker.JOB);
              if(chatAlerts && Build.VERSION.SDK_INT>=33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
                  requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712);
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
    @Override protected void onPause(){if(adView!=null)adView.pause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(adView!=null)adView.resume();if(premium!=null)premium.restore();}
    @Override protected void onDestroy(){if(pendingFiles!=null){pendingFiles.onReceiveValue(null);pendingFiles=null;}if(premium!=null)premium.close();if(adView!=null)adView.destroy();web.destroy();super.onDestroy();}
}
