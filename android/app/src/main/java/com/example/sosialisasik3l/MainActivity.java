package com.example.sosialisasik3l;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.Manifest;
import android.content.pm.PackageManager;
import android.provider.MediaStore;
import android.content.ContentValues;
import android.net.Uri;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> upload;

    private static final int FILE_REQ = 1001;
    private static final int CAMERA_PERMISSION_REQ = 1002;

    private Uri cameraUri;

    private static final String WEB_APP_URL =
        "https://script.google.com/macros/s/AKfycbxuEXZ55Rq1QjkERdSVgd08o2Yf4K_RtJj4y3Zi0PwlYAHK1ag5Q34780xUAgDrEZjp/exec?embedded=true";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        web = new WebView(this);

        root.addView(
            web,
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );

        setContentView(root);

        WebSettings settings = web.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setUseWideViewPort(false);
        settings.setLoadWithOverviewMode(false);

        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        web.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

        web.setWebViewClient(new WebViewClient() {

            @Override
            public void onPageFinished(WebView view, String url) {

                super.onPageFinished(view, url);

                hideAppsScriptBanner();
                startBannerCleaner();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {

            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params) {

                if (upload != null) {
                    upload.onReceiveValue(null);
                }

                upload = callback;
                cameraUri = null;

                /*
                 * HTML sekarang mempunyai dua input:
                 *
                 * 1. capture="environment" -> kamera
                 * 2. input file biasa       -> galeri
                 *
                 * Android WebView hanya memberikan
                 * callback yang sama, sehingga kita
                 * tampilkan chooser yang menyediakan
                 * Kamera dan Galeri.
                 */

                try {

                    Intent cameraIntent =
                        new Intent(MediaStore.ACTION_IMAGE_CAPTURE);

                    if (cameraIntent.resolveActivity(
                            getPackageManager()) != null) {

                        if (android.os.Build.VERSION.SDK_INT >= 23 &&
                            checkSelfPermission(
                                Manifest.permission.CAMERA
                            ) != PackageManager.PERMISSION_GRANTED) {

                            requestPermissions(
                                new String[]{
                                    Manifest.permission.CAMERA
                                },
                                CAMERA_PERMISSION_REQ
                            );
                        }

                        ContentValues values =
                            new ContentValues();

                        values.put(
                            MediaStore.Images.Media.DISPLAY_NAME,
                            "SosialisasiK3L_" +
                            System.currentTimeMillis() +
                            ".jpg"
                        );

                        values.put(
                            MediaStore.Images.Media.MIME_TYPE,
                            "image/jpeg"
                        );

                        if (android.os.Build.VERSION.SDK_INT >= 29) {

                            values.put(
                                MediaStore.Images.Media.RELATIVE_PATH,
                                "Pictures/SosialisasiK3L"
                            );
                        }

                        cameraUri =
                            getContentResolver().insert(
                                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                                values
                            );

                        cameraIntent.putExtra(
                            MediaStore.EXTRA_OUTPUT,
                            cameraUri
                        );

                        cameraIntent.addFlags(
                            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
                            Intent.FLAG_GRANT_READ_URI_PERMISSION
                        );

                        /*
                         * ACTION_CHOOSER:
                         * Android akan memberikan pilihan aplikasi
                         * yang dapat menangani gambar.
                         */
                        Intent chooser =
                            Intent.createChooser(
                                params.createIntent(),
                                "Pilih Foto"
                            );

                        /*
                         * Tambahkan kamera sebagai pilihan
                         * tambahan pada Android yang mendukung.
                         */
                        if (android.os.Build.VERSION.SDK_INT >= 5) {

                            chooser.putExtra(
                                Intent.EXTRA_INITIAL_INTENTS,
                                new Intent[]{cameraIntent}
                            );
                        }

                        startActivityForResult(
                            chooser,
                            FILE_REQ
                        );

                        return true;
                    }

                    /*
                     * Jika kamera tidak tersedia,
                     * buka galeri/file picker.
                     */
                    Intent gallery =
                        params.createIntent();

                    startActivityForResult(
                        gallery,
                        FILE_REQ
                    );

                    return true;

                } catch (Exception e) {

                    cameraUri = null;

                    try {

                        Intent gallery =
                            params.createIntent();

                        startActivityForResult(
                            gallery,
                            FILE_REQ
                        );

                        return true;

                    } catch (Exception ignored) {

                        upload = null;

                        return false;
                    }
                }
            }
        });

        web.loadUrl(WEB_APP_URL);
    }

    /*
     * Membersihkan banner bawaan Google Apps Script.
     */
    private void hideAppsScriptBanner() {

        final String js =
            "(function(){" +
            "function clean(){" +
            "var els=document.querySelectorAll('body *');" +
            "for(var i=0;i<els.length;i++){" +
            "var e=els[i];" +
            "var t=(e.innerText||e.textContent||'').replace(/\\s+/g,' ').trim();" +
            "if(t.indexOf('Aplikasi ini dibuat oleh pengguna')>=0 ||" +
            "t.indexOf('Google Apps Script')>=0 ||" +
            "t.indexOf('This application was created by a Google Apps Script user')>=0){" +
            "var r=e.getBoundingClientRect();" +
            "if(r.top<120 && r.height>20 && r.height<180){" +
            "e.style.setProperty('display','none','important');" +
            "e.style.setProperty('visibility','hidden','important');" +
            "}" +
            "}" +
            "}" +
            "}" +
            "clean();" +
            "setTimeout(clean,100);" +
            "setTimeout(clean,300);" +
            "setTimeout(clean,700);" +
            "setTimeout(clean,1200);" +
            "setTimeout(clean,2000);" +
            "})()";

        web.evaluateJavascript(
            js,
            value -> {}
        );
    }

    private void startBannerCleaner() {

        web.postDelayed(
            new Runnable() {

                @Override
                public void run() {

                    hideAppsScriptBanner();

                    if (web != null) {
                        web.postDelayed(
                            this,
                            1500
                        );
                    }
                }
            },
            200
        );
    }

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data) {

        if (requestCode == FILE_REQ &&
            upload != null) {

            Uri[] results = null;

            if (resultCode == RESULT_OK) {

                /*
                 * Jika kamera dipilih, hasil foto berada
                 * pada cameraUri.
                 *
                 * Jika Galeri dipilih, data.getData()
                 * berisi URI foto yang dipilih.
                 */
                if (cameraUri != null &&
                    (data == null ||
                     data.getData() == null)) {

                    results =
                        new Uri[]{cameraUri};

                } else if (
                    data != null &&
                    data.getData() != null
                ) {

                    results =
                        new Uri[]{
                            data.getData()
                        };

                } else {

                    /*
                     * Beberapa picker mengembalikan
                     * ClipData.
                     */
                    if (
                        data != null &&
                        data.getClipData() != null
                    ) {

                        int count =
                            data.getClipData().getItemCount();

                        results =
                            new Uri[count];

                        for (int i = 0; i < count; i++) {

                            results[i] =
                                data.getClipData()
                                    .getItemAt(i)
                                    .getUri();
                        }
                    }
                }
            }

            /*
             * Jika batal, hapus URI kamera sementara.
             */
            if (resultCode != RESULT_OK &&
                cameraUri != null) {

                try {
                    getContentResolver()
                        .delete(
                            cameraUri,
                            null,
                            null
                        );
                } catch (Exception ignored) {
                }

                cameraUri = null;
            }

            upload.onReceiveValue(results);

            upload = null;

            /*
             * Jangan menghapus cameraUri sebelum callback
             * selesai menerima URI.
             */
            cameraUri = null;
        }

        super.onActivityResult(
            requestCode,
            resultCode,
            data
        );
    }

    @Override
    public void onBackPressed() {

        if (web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}