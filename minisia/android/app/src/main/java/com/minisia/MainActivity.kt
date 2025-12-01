package com.minisia

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.rtngodot.RTNLibGodot
import org.godotengine.godot.utils.PermissionsUtil

import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.view.WindowInsets

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        RTNLibGodot.getInstance().init(this)
        PermissionsUtil.requestManifestPermissions(this)

        hideSystemBars()
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemBars()
        }
    }

    /**
     * Immersive Fullscreen Mode (NavigationBar + StatusBar 완전 숨김)
     */
    private fun hideSystemBars() {
        // Decor fitting 설정
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)

        controller.hide(
            WindowInsets.Type.statusBars() or
            WindowInsets.Type.navigationBars()
        )

        // 바를 스와이프로 잠깐 보여줄 수 있게 (게임 필수)
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    override fun getMainComponentName(): String = "Minisia"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
