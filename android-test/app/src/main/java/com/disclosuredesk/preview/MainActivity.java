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
import android.widget.ProgressBar;
import android.graphics.Color;
import android.webkit.WebChromeClient.CustomViewCallback;

public final class MainActivity extends Activity {
    private static final String HOME = "https://boydamo84-coder.github.io/disclosure-desk-preview/";
    private WebView web;
    private FrameLayout root;
    private View fullView;
    private CustomViewCallback fullCallback;
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        web.setBackgroundColor(Color.rgb(9,16,28));
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient(){
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
    @Override public void onBackPressed(){
        if(fullView!=null){ ((WebChromeClient)web.getWebChromeClient()).onHideCustomView();return; }
        if(web.canGoBack()){web.goBack();return;}
        super.onBackPressed();
    }
    @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
