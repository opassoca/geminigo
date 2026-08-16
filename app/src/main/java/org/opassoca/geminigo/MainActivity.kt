package org.opassoca.geminigo

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.AlarmClock
import android.provider.MediaStore
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

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
    private fun safe(intent: Intent, label: String) {
        try {
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Log.w("geminigo", "$label sem handler: ${e.message}")
            Toast.makeText(activity, "Sem app para: $label", Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun criarAlarme(hora: Int, minuto: Int, mensagem: String) {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hora)
            putExtra(AlarmClock.EXTRA_MINUTES, minuto)
            putExtra(AlarmClock.EXTRA_MESSAGE, mensagem)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        safe(intent, "alarme")
    }

    @JavascriptInterface
    fun criarEvento(titulo: String, inicioMs: Long, fimMs: Long) {
        val intent = Intent(Intent.ACTION_INSERT).apply {
            data = Uri.parse("content://com.android.calendar/events")
            putExtra("title", titulo)
            putExtra("beginTime", inicioMs)
            putExtra("endTime", fimMs)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        safe(intent, "calendario")
    }

    @JavascriptInterface
    fun criarTimer(duracaoSegundos: Int, rotulo: String) {
        val intent = Intent(AlarmClock.ACTION_SET_TIMER).apply {
            putExtra(AlarmClock.EXTRA_LENGTH, duracaoSegundos)
            putExtra(AlarmClock.EXTRA_MESSAGE, rotulo)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        safe(intent, "timer")
    }

    @JavascriptInterface
    fun criarLembrete(titulo: String, horaEpochMs: Long) {
        // ACTION_INSERT no Notes/Reminder provider; fallback puro p/ apps sem handler.
        val intent = Intent(Intent.ACTION_INSERT).apply {
            data = Uri.parse("content://com.android.reminder/notes")
            putExtra("title", titulo)
            if (horaEpochMs > 0) putExtra("alarm_time", horaEpochMs)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        safe(intent, "lembrete")
    }

    @JavascriptInterface
    fun abrirCamera() {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        safe(intent, "camera")
    }

    @JavascriptInterface
    fun abrirUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        safe(intent, "navegador")
    }
}
