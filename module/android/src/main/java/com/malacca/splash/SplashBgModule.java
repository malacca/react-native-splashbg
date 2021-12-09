package com.malacca.splash;

import android.app.Activity;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

public class SplashBgModule extends ReactContextBaseJavaModule {

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
        UiThreadUtil.runOnUiThread(() -> {
            try {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    activity.getWindow().setBackgroundDrawableResource(android.R.color.white);
                }
            } catch (Throwable ignored) {
            }
        });
    }
}
