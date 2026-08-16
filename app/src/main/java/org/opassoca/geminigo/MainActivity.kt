package org.opassoca.geminigo

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.AlarmClock
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()
        webView.addJavascriptInterface(AndroidBridge(this), "Android")
        webView.loadUrl("file:///android_asset/index.html")
        setContentView(webView)
    }
}

class AndroidBridge(private val activity: Activity) {
    @JavascriptInterface
    fun criarAlarme(hora: Int, minuto: Int, mensagem: String) {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hora)
            putExtra(AlarmClock.EXTRA_MINUTES, minuto)
            putExtra(AlarmClock.EXTRA_MESSAGE, mensagem)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
        }
        activity.startActivity(intent)
    }

    @JavascriptInterface
    fun criarEvento(titulo: String, inicioMs: Long, fimMs: Long) {
        val intent = Intent(Intent.ACTION_INSERT).apply {
            data = Uri.parse("content://com.android.calendar/events")
            putExtra("title", titulo)
            putExtra("beginTime", inicioMs)
            putExtra("endTime", fimMs)
        }
        activity.startActivity(intent)
    }
}
