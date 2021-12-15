package com.malacca.splash;

import android.app.Activity;
import androidx.annotation.NonNull;
import android.content.res.Configuration;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public class SplashBgModule extends ReactContextBaseJavaModule {

    private boolean removed = false;
    SplashBgModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "SplashBgModule";
    }

    @ReactMethod
    public void remove() {
        if (removed) {
            return;
        }
        removed = true;
        UiThreadUtil.runOnUiThread(() -> {
            try {
                Activity activity = getCurrentActivity();
                if (activity == null) {
                    return;
                }
                int id;
                try {
                    // 先尝试获取 xml 中名为 splash_background 的颜色
                    id = activity.getResources().getIdentifier(
                            "splash_background", "color", activity.getPackageName()
                    );
                } catch (Exception e) {
                    int nightModeFlags = activity.getResources().getConfiguration().uiMode &
                            Configuration.UI_MODE_NIGHT_MASK;
                    id = Configuration.UI_MODE_NIGHT_YES == nightModeFlags
                            ? android.R.color.background_dark : android.R.color.background_light;
                }
                activity.getWindow().setBackgroundDrawableResource(id);
            } catch (Throwable ignored) {
            }
        });
    }
}
