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
import android.webkit.WebResourceResponse;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.HashSet;
import android.widget.ScrollView;
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
    // Paid entitlement lacks server-side receipt verification: disabled in all M75 builds.
    private static final boolean PLAY_BILLING_APPROVED = false;
    private final Set<String> snapshotFiles=new HashSet<>();
    private boolean firstRunAlertsPromptShown=false;
    private static final String FIRST_RUN_ALERTS_CHOICE="dd-alerts-opt-in-m77";
    private String snapshotCommit="unknown";
    // Real unit configured in AdMob: ca-app-pub-6712657097464071/7357709206
    // All test builds MUST use Google test inventory; never use the real unit in this debug APK.
    private static final String TEST_BANNER_UNIT = "ca-app-pub-3940256099942544/6300978111";
    private static final String LIVE_BANNER_UNIT = "ca-app-pub-6712657097464071/7357709206";
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        loadSnapshotManifest();
        if(snapshotFiles.isEmpty())throw new IllegalStateException("Android beta requires its verified embedded development website snapshot.");
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
        offlinePanel=createOfflinePanel();
        root.addView(offlinePanel,new FrameLayout.LayoutParams(-1,-1));
        offlinePanel.setVisibility(View.GONE);
        setContentView(root);
        // Upgrade existing 2h subscriptions automatically without resetting the user's choices.
        syncDiscoverySchedules();
        // Android 15+ enforces edge-to-edge for target SDK 35. Keep web content below the status bar.
        if(Build.VERSION.SDK_INT >= 35){
            root.setOnApplyWindowInsetsListener((view,insets)->{
                int top=insets.getInsets(WindowInsets.Type.statusBars()).top;
                int bottom=insets.getInsets(WindowInsets.Type.navigationBars()).bottom;
                view.setPadding(0,top,0,bottom);
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
        // Keep content:// reads enabled for the existing Android document/image chooser.
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE); // Private APK always uses its embedded UI version.
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                return embeddedWebsiteAsset(request);
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap favicon){
                if(isAppHomeUrl(url))mainPageFailed=false;
            }
            @Override public void onPageCommitVisible(WebView view,String url){
                if(!mainPageFailed && isAppHomeUrl(url))showOnline();
            }
            @Override public void onPageFinished(WebView view,String url){
                if(!mainPageFailed && isAppHomeUrl(url))showOnline();
                if(isAppHomeUrl(url)){
                    useTwoLineBreakingNews();
                    installProfileNotificationControl();
                    showFirstRunAlertsPrompt();
                    deliverChatToken();
                }
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
        if(PLAY_BILLING_APPROVED)premium=new LifetimeAdsManager(this,this::setAdFree);
        if(savedInstanceState==null || web.restoreState(savedInstanceState)==null){
            web.loadUrl(notificationUrl(getIntent()));
        }
        prepareTestBanner();
    }
    @Override protected void onSaveInstanceState(Bundle state){
        if(web!=null)web.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==FILE_CHOOSER_REQUEST && pendingFiles!=null){
            ValueCallback<Uri[]> callback=pendingFiles;
            pendingFiles=null;
            callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
        }
    }
    // The packaged UI is built from the M74 branch with the exact public web allowlist.
    // It is served under the canonical HTTPS origin; Supabase auth, OAuth redirects and
    // existing same-origin routes therefore keep their normal origin semantics.
    // Dynamic Netlify requests and third-party feeds are deliberately NOT intercepted.
    private boolean isAppHomeUrl(String url){
        if(url==null)return false;
        Uri parsed=Uri.parse(url);
        return "https".equals(parsed.getScheme()) && "uapdisclosuredesk.com".equals(parsed.getHost())
            && "/".equals(parsed.getPath());
    }
    private void loadSnapshotManifest(){
        try(InputStream in=getAssets().open("dd-site/snapshot-manifest.json");
            BufferedReader reader=new BufferedReader(new InputStreamReader(in,StandardCharsets.UTF_8))){
            StringBuilder json=new StringBuilder();String line;
            while((line=reader.readLine())!=null)json.append(line);
            JSONObject root=new JSONObject(json.toString());
            if(!"Disclosure Desk embedded Android development snapshot".equals(root.optString("type")))return;
            snapshotCommit=root.optString("commit","unknown");
            org.json.JSONArray files=root.getJSONArray("files");
            for(int i=0;i<files.length();i++){
                String rel=files.getString(i);
                if(!rel.startsWith("/")&&!rel.contains("\\")&&!rel.contains(".."))snapshotFiles.add(rel);
            }
        }catch(Exception e){android.util.Log.e("DisclosureDesk","The reviewed Android snapshot is missing or invalid.");}
    }
    private WebResourceResponse embeddedWebsiteAsset(WebResourceRequest request){
        if(request==null || !"GET".equalsIgnoreCase(request.getMethod()))return null;
        Uri url=request.getUrl();
        if(url==null || !"https".equals(url.getScheme()) || !"uapdisclosuredesk.com".equals(url.getHost()))return null;
        String path=Uri.decode(url.getEncodedPath());
        if(path==null)return null;
        String name="/".equals(path)?"index.html":path.startsWith("/")?path.substring(1):path;
        if(!snapshotFiles.contains(name))return null;
        String mime="text/plain";
        if(name.endsWith(".html"))mime="text/html";
        else if(name.endsWith(".js"))mime="application/javascript";
        else if(name.endsWith(".css"))mime="text/css";
        else if(name.endsWith(".json"))mime="application/json";
        else if(name.endsWith(".svg"))mime="image/svg+xml";
        else if(name.endsWith(".png"))mime="image/png";
        else if(name.endsWith(".jpg")||name.endsWith(".jpeg"))mime="image/jpeg";
        else if(name.endsWith(".webp"))mime="image/webp";
        else if(name.endsWith(".gif"))mime="image/gif";
        else if(name.endsWith(".ico"))mime="image/x-icon";
        else if(name.endsWith(".woff2"))mime="font/woff2";
        else if(name.endsWith(".webmanifest"))mime="application/manifest+json";
        else if(name.endsWith(".xml"))mime="application/xml";
        try{
            InputStream bytes=getAssets().open("dd-site/"+name);
            return new WebResourceResponse(mime,"UTF-8",bytes);
        }catch(Exception ex){
            android.util.Log.e("DisclosureDesk","Bundled site asset could not be opened: "+name);
            return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",
              Collections.singletonMap("Cache-Control","no-store"),new java.io.ByteArrayInputStream(new byte[0]));
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
        message.setText("You're offline\nConnect to the internet to access your latest research. Your saved account data has not been cleared.");
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
                    if("open_notification_settings".equals(data.optString("type"))){
                        runOnUiThread(this::notificationSettings);
                        return;
                    }
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
    private void syncDiscoverySchedules(){
        SharedPreferences saved=getSharedPreferences(DiscoveryWorker.PREFS,MODE_PRIVATE);
        WorkManager work=WorkManager.getInstance(this);
        // Retire the original mixed news/video job so it cannot duplicate alerts.
        work.cancelUniqueWork(DiscoveryWorker.JOB);
        if(saved.getBoolean("news",false)){
            Data data=new Data.Builder().putString("dd_scope","news").build();
            PeriodicWorkRequest newsCheck=new PeriodicWorkRequest.Builder(
                DiscoveryWorker.class,30,TimeUnit.MINUTES).setInputData(data).build();
            work.enqueueUniquePeriodicWork(DiscoveryWorker.JOB_NEWS,ExistingPeriodicWorkPolicy.UPDATE,newsCheck);
        }else work.cancelUniqueWork(DiscoveryWorker.JOB_NEWS);
        if(saved.getBoolean("videos",false)){
            Data data=new Data.Builder().putString("dd_scope","videos").build();
            PeriodicWorkRequest videoCheck=new PeriodicWorkRequest.Builder(
                DiscoveryWorker.class,2,TimeUnit.HOURS).setInputData(data).build();
            work.enqueueUniquePeriodicWork(DiscoveryWorker.JOB_VIDEOS,ExistingPeriodicWorkPolicy.UPDATE,videoCheck);
        }else work.cancelUniqueWork(DiscoveryWorker.JOB_VIDEOS);
    }
    private void useTwoLineBreakingNews(){
        // Android app ONLY: make the lead headline easier to read without growing
        // the 39px breaking-news band or changing the public website.
        // At 15px line-height, two lines + 8px padding fit within 38px.
        if(web==null)return;
        String script="(function(){"
          +"if(document.getElementById('dd-android-breaking-2line'))return;"
          +"var style=document.createElement('style');"
          +"style.id='dd-android-breaking-2line';"
          +"style.textContent='"
          +".dd-news-ticker-breaking{height:39px;min-height:39px;max-height:39px;}"
          +".dd-news-ticker-breaking .dd-ticker-viewport{height:39px;min-height:0;max-height:39px;}"
          +".dd-news-ticker-breaking .dd-ticker-link{display:-webkit-box;"
          +"-webkit-box-orient:vertical;-webkit-line-clamp:2;white-space:normal;"
          +"line-height:15px;padding:4px 9px;max-height:38px;box-sizing:border-box;"
          +"overflow:hidden;text-overflow:ellipsis;}"
          +"';document.head.appendChild(style);"
          +"})()";
        web.evaluateJavascript(script,null);
    }

    private void installProfileNotificationControl(){
        // This item exists ONLY in the Android APK's in-site Profile screen;
        // it does not add a floating bell or alter the public website's Profile.
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)||web==null)return;
        String javascript="(function(){try{"
          +"var settings=document.getElementById('ddProfileSettings');"
          +"if(!settings||document.getElementById('ddAndroidAlertsSettings'))return;"
          +"var panel=document.createElement('details');panel.id='ddAndroidAlertsSettings';"
          +"panel.className='dd-profile-card dd-profile-fold dd-android-alert-settings';"
          +"var summary=document.createElement('summary');"
          +"var label=document.createElement('span');label.textContent='🔔 App notifications';"
          +"var chevron=document.createElement('span');chevron.className='dd-profile-chevron';"
          +"chevron.setAttribute('aria-hidden','true');chevron.textContent='⌄';"
          +"summary.append(label,chevron);"
          +"var note=document.createElement('p');note.textContent='News and video alerts. Chat push notifications are being prepared.';"
          +"note.className='muted small';note.style.cssText='margin:10px 0 12px';"
          +"var action=document.createElement('button');action.type='button';action.className='outline';"
          +"action.textContent='Notification settings';action.setAttribute('aria-label','Open Android notification settings');"
          +"action.style.cssText='min-height:44px;padding:10px 15px;margin-bottom:12px';"
          +"action.addEventListener('click',function(){"
          +"if(window.DDAndroid&&typeof window.DDAndroid.postMessage==='function')"
          +"window.DDAndroid.postMessage(JSON.stringify({type:'open_notification_settings'}));"
          +"});panel.append(summary,note,action);"
          +"var meta=settings.querySelector('.dd-profile-settings-meta');"
          +"if(meta)meta.insertAdjacentElement('afterend',panel);else settings.append(panel);"
          +"}catch(e){}})()";
        web.evaluateJavascript(javascript,null);
    }
    private void showFirstRunAlertsPrompt(){
        SharedPreferences prefs=getSharedPreferences(DiscoveryWorker.PREFS,MODE_PRIVATE);
        if(firstRunAlertsPromptShown || prefs.getBoolean(FIRST_RUN_ALERTS_CHOICE,false)
            || isFinishing() || mainPageFailed)return;
        firstRunAlertsPromptShown=true;
        new AlertDialog.Builder(this)
          .setTitle("Keep up with new discoveries?")
          .setMessage("Enable all currently available alerts: major UAP news and newly discovered videos. News is checked approximately every 30 minutes, videos every 2 hours; Android may delay updates to save battery. Private Chat push alerts are not ready yet. You can change your choices anytime in Profile > Profile settings > App notifications.")
          .setNegativeButton("Not now",(dialog,which)->
              prefs.edit().putBoolean(FIRST_RUN_ALERTS_CHOICE,true).apply())
          .setPositiveButton("Enable available alerts",(dialog,which)->{
              prefs.edit().putBoolean(FIRST_RUN_ALERTS_CHOICE,true)
                .putBoolean("news",true).putBoolean("videos",true)
                .putBoolean("chats",false).apply();
              syncDiscoverySchedules();
              if(Build.VERSION.SDK_INT>=33 &&
                 checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
                  requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712);
          })
          .setOnCancelListener(dialog->prefs.edit().putBoolean(FIRST_RUN_ALERTS_CHOICE,true).apply())
          .show();
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
        chats.setText("Private Chat push · setup pending");
        chats.setChecked(false);
        chats.setEnabled(false);
        choices.addView(chats);
        CheckBox news=new CheckBox(this);
        news.setText("Major-media UAP news");
        news.setChecked(prefs.getBoolean("news",false));
        choices.addView(footage);choices.addView(news);
        Button removeAds=new Button(this);
        removeAds.setText("Remove Ads · lifetime / restore purchase");
        removeAds.setAllCaps(false);
        if(PLAY_BILLING_APPROVED && premium!=null)choices.addView(removeAds);
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
        Button systemPermissions=new Button(this);
        systemPermissions.setAllCaps(false);
        systemPermissions.setText("Android notification permission");
        choices.addView(systemPermissions);
        systemPermissions.setOnClickListener(v->{
            try{
                Intent settingsIntent=new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                settingsIntent.putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName());
                startActivity(settingsIntent);
            }catch(Exception error){
                startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getPackageName())));
            }
        });
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
        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(false);
        scroll.addView(choices);
        new AlertDialog.Builder(this).setTitle("Discovery alerts")
          .setMessage("Optional alerts. News checks run approximately every 30 minutes; video discoveries every 2 hours. Android may delay background work to save battery. Your existing library never triggers an initial alert. News reports are attributed to publishers, not proof of extraordinary claims.")
          .setView(scroll).setNegativeButton("Cancel",null)
          .setPositiveButton("Save",(dialog,which)->{
              boolean vids=footage.isChecked(),stories=news.isChecked(),chatAlerts=chats.isChecked();
              prefs.edit().putBoolean("videos",vids).putBoolean("news",stories).putBoolean("chats",chatAlerts).apply();
              syncDiscoverySchedules();
              if((stories||vids||chatAlerts) && Build.VERSION.SDK_INT>=33 &&
                 checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)
                  requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},712);
          }).show();
    }
    private int dp(int pixels){return (int)(pixels*getResources().getDisplayMetrics().density+0.5f);}
    @Override public void onBackPressed(){
        if(fullView!=null){((WebChromeClient)web.getWebChromeClient()).onHideCustomView();return;}
        // Back closes the current popover/dialog or nested Discussion before
        // switching tabs. In W.NE or another actual document URL, use WebView history.
        String script="(function(){try{"
          +"var url=new URL(location.href);"
          +"if(url.pathname!=='/'&&url.pathname!=='/index.html')return 'exit';"
          +"var dlg=document.querySelector('dialog[open]');if(dlg){dlg.close();return 'handled'};"
          +"var d=document.getElementById('immersiveViewer');"
          +"if(d&&!d.hidden){var c=document.getElementById('closeImmersive');if(c)c.click();return 'handled'};"
          +"var reply=document.getElementById('ddForumReplyPane');"
          +"var backPost=document.getElementById('ddForumBackThreads');"
          +"if(reply&&!reply.hidden&&backPost){backPost.click();return 'handled'};"
          +"var section=document.getElementById('ddForumThreadPane');"
          +"var backSections=document.getElementById('ddForumBackSections');"
          +"if(section&&!section.hidden&&backSections){backSections.click();return 'handled'};"
          +"var active=document.querySelector('.tab.active');"
          +"if(active&&active.dataset.tab!=='discover'){var home=document.querySelector('[data-tab=discover]');"
          +"if(home)home.click();return 'handled'};"
          +"return 'exit'}catch(e){return 'exit'}})()";
        web.evaluateJavascript(script,value->{
            if(!"\"handled\"".equals(value)){
                if(web.canGoBack())web.goBack();
                else finish();
            }
        });
    }
    @Override protected void onPause(){if(adView!=null)adView.pause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(adView!=null)adView.resume();if(premium!=null)premium.restore();}
    @Override protected void onDestroy(){if(pendingFiles!=null){pendingFiles.onReceiveValue(null);pendingFiles=null;}if(premium!=null)premium.close();if(adView!=null)adView.destroy();web.destroy();super.onDestroy();}
}
