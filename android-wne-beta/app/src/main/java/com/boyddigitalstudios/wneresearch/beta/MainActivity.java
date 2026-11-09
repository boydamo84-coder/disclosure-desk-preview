package com.boyddigitalstudios.wneresearch.beta;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.URLUtil;
import android.widget.Toast;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONObject;
import org.json.JSONException;

import java.io.OutputStream;
import java.util.Base64;
import java.util.Collections;
import java.util.Locale;

public final class MainActivity extends Activity {
    // App-asset HTTPS origin: Research UI comes from this APK, not the
    // currently deployed Disclosure Desk/old GitHub Pages website.
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String START = ORIGIN + "/research/index.html";
    private static final int FILE_CHOOSER = 1707;
    private static final int MAX_FILE_BYTES = 12 * 1024 * 1024;

    private WebView web;
    private WebChromeClient.FileChooserParams pendingChooser;
    private android.webkit.ValueCallback<Uri[]> fileCallback;
    private WebViewAssetLoader assetLoader;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(10, 22, 34));
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Android document picker URIs.
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);

        CookieManager.getInstance().setAcceptCookie(true);
        // Research login uses Supabase auth over HTTPS, not a local server.
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);

        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("https".equals(url.getScheme()) &&
                    "appassets.androidplatform.net".equals(url.getHost())) return false;
                openExternal(url);
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,
                    android.webkit.ValueCallback<Uri[]> callback, FileChooserParams parameters) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                pendingChooser = parameters;
                try {
                    Intent chooser = parameters.createIntent();
                    chooser.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(chooser, FILE_CHOOSER);
                    return true;
                } catch (Exception e) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                    toast("Can't open the file picker. Try again.");
                    return false;
                }
            }
        });

        // Origin-scoped native messaging, NOT the unsafe addJavascriptInterface.
        // Only our bundled HTTPS research pages/frames get the download bridge.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(web, "WneAndroid",
                Collections.singleton(ORIGIN),
                new WebViewCompat.WebMessageListener() {
                    @Override public void onPostMessage(WebView view, WebMessageCompat message,
                            Uri sourceOrigin, boolean isMainFrame, JavaScriptReplyProxy proxy) {
                        if (!ORIGIN.equals(sourceOrigin.toString())) return;
                        handleLocalDownload(message.getData());
                    }
                });
        }

        web.setDownloadListener(new DownloadListener() {
            @Override public void onDownloadStart(String url, String userAgent,
                    String disposition, String mime, long length) {
                if (url.startsWith("blob:" + ORIGIN + "/") || url.startsWith("data:")) {
                    downloadBlob(url, disposition, mime);
                } else if (url.startsWith("https://")) {
                    downloadHttps(url, userAgent, disposition, mime);
                } else {
                    toast("This download type isn't supported in the beta.");
                }
            }
        });
        web.loadUrl(START);
    }

    private void downloadBlob(String url, String disposition, String mime) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            toast("Update Android System WebView to save Word files.");
            return;
        }
        String filename = URLUtil.guessFileName("https://appassets.androidplatform.net/export.docx",
            disposition, mime);
        // The script is only run inside trusted bundled HTML at the asset origin.
        String script = "(async()=>{try{"
            + "const r=await fetch(" + JSONObject.quote(url) + ");"
            + "if(!r.ok)throw Error('Export unavailable');"
            + "const blob=await r.blob();"
            + "if(blob.size>" + MAX_FILE_BYTES + ")throw Error('File exceeds beta download limit');"
            + "const reader=new FileReader();"
            + "reader.onload=()=>{const b64=String(reader.result).split(',')[1];"
            + "window.WneAndroid.postMessage(JSON.stringify({name:"
            + JSONObject.quote(filename) + ",mime:" + JSONObject.quote(mime == null ? "" : mime)
            + ",data:b64}));};"
            + "reader.onerror=()=>alert('Export could not be read');"
            + "reader.readAsDataURL(blob);"
            + "}catch(e){alert('Word download failed: '+String(e.message||e));}})();";
        web.evaluateJavascript(script, null);
    }

    private void handleLocalDownload(String payload) {
        try {
            if (payload == null || payload.length() > (MAX_FILE_BYTES * 4 / 3) + 8192)
                throw new Exception("Export too large");
            JSONObject msg = new JSONObject(payload);
            String name = msg.optString("name", "WNE-Research-Copy.docx");
            // File names cannot contain paths, traversal, control chars or separators.
            name = name.replaceAll("[^A-Za-z0-9._ -]", "_");
            if (name.startsWith(".")) name = "WNE-" + name.substring(1);
            if (name.length() > 100) name = name.substring(name.length() - 100);
            String lower = name.toLowerCase(Locale.ROOT);
            if (!(lower.endsWith(".docx") || lower.endsWith(".pdf") ||
                  lower.endsWith(".json") || lower.endsWith(".zip") ||
                  lower.endsWith(".txt") || lower.endsWith(".epub")))
                throw new Exception("Unsupported export extension");
            String mime = msg.optString("mime", "application/octet-stream");
            byte[] bytes = Base64.getDecoder().decode(msg.getString("data"));
            if (bytes.length == 0 || bytes.length > MAX_FILE_BYTES)
                throw new Exception("Invalid export size");

            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, name);
            values.put(MediaStore.Downloads.MIME_TYPE, mime.isEmpty()
                ? "application/octet-stream" : mime);
            values.put(MediaStore.Downloads.RELATIVE_PATH,
                Environment.DIRECTORY_DOWNLOADS + "/WNE Research Beta");
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri target = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (target == null) throw new Exception("Could not create Downloads file");
            try {
                try (OutputStream output = getContentResolver().openOutputStream(target)) {
                    if (output == null) throw new Exception("Could not open download");
                    output.write(bytes);
                }
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(target, values, null, null);
            } catch (Exception e) {
                getContentResolver().delete(target, null, null);
                throw e;
            }
            toast("Saved to Downloads / WNE Research Beta");
        } catch (Exception e) {
            toast("Could not save export: " + e.getMessage());
        }
    }

    private void downloadHttps(String url, String userAgent, String disposition, String mime) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(URLUtil.guessFileName(url, disposition, mime));
            request.setMimeType(mime);
            request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,
                URLUtil.guessFileName(url, disposition, mime));
            if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) request.addRequestHeader("Cookie", cookie);
            ((DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);
            toast("Download started");
        } catch (Exception e) {
            toast("Could not download: " + e.getMessage());
        }
    }

    private void openExternal(Uri uri) {
        if (!"https".equals(uri.getScheme()) && !"mailto".equals(uri.getScheme())) {
            toast("Blocked an unsupported link");
            return;
        }
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception e) { toast("No app available to open that link"); }
    }

    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code != FILE_CHOOSER || fileCallback == null) return;
        Uri[] selection = WebChromeClient.FileChooserParams.parseResult(result, data);
        fileCallback.onReceiveValue(selection);
        fileCallback = null;
        pendingChooser = null;
    }

    @Override public void onBackPressed() {
        String current = web.getUrl() == null ? "" : web.getUrl();
        if (current.contains("/research/research-workspace.html") ||
            current.contains("/research/wne.html")) {
            new AlertDialog.Builder(this)
                .setTitle("Keep your research safe")
                .setMessage("Use Save and the Research Home menu before leaving the editor. Android Back won't close an unsaved report.")
                .setPositiveButton("Stay in Research", (dialog, which) -> {})
                .setNegativeButton("Exit beta", (dialog, which) -> finish())
                .show();
            return;
        }
        if (web.canGoBack()) web.goBack();
        else new AlertDialog.Builder(this).setTitle("Exit W.NE Research Beta?")
            .setPositiveButton("Exit", (dialog, which) -> finish())
            .setNegativeButton("Stay", (dialog, which) -> {}).show();
    }

    private void toast(String s) {
        runOnUiThread(() -> Toast.makeText(this, s, Toast.LENGTH_LONG).show());
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        web.destroy();
        super.onDestroy();
    }
}
