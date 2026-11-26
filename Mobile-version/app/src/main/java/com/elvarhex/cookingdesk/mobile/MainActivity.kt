package com.elvarhex.cookingdesk.mobile

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.*
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.elvarhex.cookingdesk.lite.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var pendingExportJson: String? = null
    private var downloadId: Long = -1
    private var downloadDialog: AlertDialog? = null
    private var progressBar: ProgressBar? = null
    private var progressText: TextView? = null

    private val createFileLauncher =
        registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
            uri?.let { saveToFile(it, pendingExportJson ?: "") }
            pendingExportJson = null
        }

    private val openFileLauncher =
        registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            uri?.let { readFromFile(it) }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        window.decorView.setBackgroundColor(Color.parseColor("#003d20"))

        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        setContentView(R.layout.activity_main)

        val rootView = findViewById<View>(android.R.id.content)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { view, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        webView = findViewById(R.id.webView)

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/res/", WebViewAssetLoader.ResourcesPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            javaScriptCanOpenWindowsAutomatically = true
        }

        webView.addJavascriptInterface(WebAppInterface(this), "Android")
        webView.webChromeClient = WebChromeClient()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        checkForUpdates()
    }

    private fun checkForUpdates() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val url = URL("https://api.github.com/repos/elvarHex/CookingDesk/releases")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")

                if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                    val response = connection.inputStream.bufferedReader().use { it.readText() }
                    val releases = JSONArray(response)

                    var latestTag: String? = null
                    var latestDownloadUrl: String? = null

                    for (i in 0 until releases.length()) {
                        val release = releases.getJSONObject(i)
                        val tagName = release.getString("tag_name")

                        if (tagName.startsWith("mobile-v")) {
                            latestTag = tagName
                            val assets = release.getJSONArray("assets")
                            for (j in 0 until assets.length()) {
                                val asset = assets.getJSONObject(j)
                                if (asset.getString("name").endsWith(".apk")) {
                                    latestDownloadUrl = asset.getString("browser_download_url")
                                    break
                                }
                            }
                            break
                        }
                    }

                    if (latestTag != null && latestDownloadUrl != null) {
                        val cleanLatestVersion = latestTag.removePrefix("mobile-v")
                        val currentVersion = packageManager.getPackageInfo(packageName, 0).versionName

                        if (cleanLatestVersion != currentVersion) {
                            withContext(Dispatchers.Main) {
                                showUpdateDialog(cleanLatestVersion, latestDownloadUrl!!)
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun showUpdateDialog(newVersion: String, downloadUrl: String) {
        AlertDialog.Builder(this)
            .setTitle("New version available!")
            .setMessage("Version $newVersion is available for download. Update to get the latest features.")
            .setCancelable(false)
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .setPositiveButton("Download") { dialog, _ ->
                downloadApk(downloadUrl, newVersion)
                dialog.dismiss()
            }
            .show()
    }

    private fun downloadApk(url: String, version: String) {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 60, 60, 60)
        }

        progressText = TextView(this).apply {
            text = "Downloading... 0%"
            textSize = 16f
            setPadding(0, 0, 0, 40)
        }

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
        }

        layout.addView(progressText)
        layout.addView(progressBar)

        downloadDialog = AlertDialog.Builder(this)
            .setTitle("Downloading")
            .setView(layout)
            .setCancelable(false)
            .create()

        downloadDialog?.show()

        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle("Downloading Update")
            .setDescription("Downloading CookingDesk-Mobile-$version.apk")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "CookingDesk-Mobile-$version.apk")

        val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
        downloadId = downloadManager.enqueue(request)

        trackDownloadProgress()
    }

    private fun trackDownloadProgress() {
        lifecycleScope.launch(Dispatchers.Main) {
            val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            var downloading = true
            while (downloading) {
                val query = DownloadManager.Query().setFilterById(downloadId)
                val cursor = downloadManager.query(query)
                if (cursor != null && cursor.moveToFirst()) {
                    val bytesDownloaded = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                    val bytesTotal = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                    val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        downloading = false
                        downloadDialog?.dismiss()
                        installApk()
                    } else if (status == DownloadManager.STATUS_FAILED) {
                        downloading = false
                        downloadDialog?.dismiss()
                    } else {
                        if (bytesTotal > 0) {
                            val progress = ((bytesDownloaded * 100L) / bytesTotal).toInt()
                            progressBar?.progress = progress
                            progressText?.text = "Downloading... $progress%"
                        }
                    }
                    cursor.close()
                }
                delay(200)
            }
        }
    }

    private fun installApk() {
        val downloadManager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
        val uri = downloadManager.getUriForDownloadedFile(downloadId)

        if (uri != null) {
            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            }
            startActivity(installIntent)
        }
    }

    fun exportJson(json: String) {
        pendingExportJson = json
        createFileLauncher.launch("cookingdesk-backup.json")
    }

    private fun saveToFile(uri: Uri, json: String) {
        contentResolver.openOutputStream(uri)?.use {
            it.write(json.toByteArray())
        }
    }

    fun showDialog(message: String) {
        runOnUiThread {
            AlertDialog.Builder(this)
                .setMessage(message)
                .setCancelable(false)
                .setPositiveButton("OK") { dialog, _ ->
                    dialog.dismiss()
                }
                .show()
        }
    }

    fun importJson() {
        openFileLauncher.launch(arrayOf("application/json"))
    }

    private fun readFromFile(uri: Uri) {
        val json = contentResolver.openInputStream(uri)
            ?.bufferedReader()
            ?.readText()

        json?.let {
            webView.post {
                webView.evaluateJavascript(
                    "receiveImportedData(${JSONObject.quote(it)})",
                    null
                )
            }
        }
    }

    fun getAppVersionName(): String {
        return try {
            packageManager.getPackageInfo(packageName, 0).versionName ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }
    }
}

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun showDialog(message: String) {
        (context as? MainActivity)?.showDialog(message)
    }

    @JavascriptInterface
    fun openExternal(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    }

    @JavascriptInterface
    fun exportData(json: String) {
        (context as? MainActivity)?.exportJson(json)
    }

    @JavascriptInterface
    fun importData() {
        (context as? MainActivity)?.importJson()
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return (context as? MainActivity)?.getAppVersionName() ?: "Unknown"
    }
}