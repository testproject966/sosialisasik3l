package com.example.sosialisasik3l;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> upload;
    private static final int FILE_REQ = 1001;
    private static final String WEB_APP_URL =
        "https://script.google.com/macros/s/AKfycbxuEXZ55Rq1QjkERdSVgd08o2Yf4K_RtJj4y3Zi0PwlYAHK1ag5Q34780xUAgDrEZjp/exec";

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(true);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (upload != null) upload.onReceiveValue(null);
                upload = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_REQ);
                } catch (Exception e) {
                    upload = null;
                    return false;
                }
                return true;
            }
        });
        web.loadUrl(WEB_APP_URL);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_REQ && upload != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            upload.onReceiveValue(results);
            upload = null;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}