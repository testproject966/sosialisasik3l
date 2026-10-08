package com.example.sosialisasik3l
import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import android.webkit.ValueCallback
import android.content.Intent
import android.net.Uri

class MainActivity: Activity() {
    private lateinit var web: WebView
    private var upload: ValueCallback<Array<Uri>>? = null
    private val FILE_REQ = 1001
    private val WEB_APP_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.webViewClient = WebViewClient()
        web.webChromeClient = object: WebChromeClient() {
            override fun onShowFileChooser(wv: WebView?, cb: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {
                upload?.onReceiveValue(null); upload = cb
                startActivityForResult(params!!.createIntent(), FILE_REQ); return true
            }
        }
        web.loadUrl(WEB_APP_URL)
    }
    override fun onActivityResult(req:Int, result:Int, data:Intent?) {
        if(req==FILE_REQ){ upload?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data)); upload=null }
        super.onActivityResult(req,result,data)
    }
    override fun onBackPressed(){ if(web.canGoBack()) web.goBack() else super.onBackPressed() }
}
