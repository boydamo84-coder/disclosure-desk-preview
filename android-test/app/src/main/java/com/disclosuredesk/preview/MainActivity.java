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
