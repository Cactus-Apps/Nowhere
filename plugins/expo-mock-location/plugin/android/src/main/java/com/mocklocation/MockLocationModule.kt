package com.mocklocation

import android.app.AppOpsManager
import android.content.Context
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

class MockLocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var provider: MockLocationProvider? = null
    private var updateTimer: ScheduledExecutorService? = null

    @Volatile
    private var currentLat = 0.0

    @Volatile
    private var currentLng = 0.0

    @Volatile
    private var currentAltitude = 0.0

    override fun getName() = "MockLocation"

    private fun stopInternal() {
        updateTimer?.shutdownNow()
        updateTimer = null
        provider?.shutdown()
        provider = null
    }

    private fun isMockAppSelected(): Boolean {
        val context = reactApplicationContext
        val packageName = context.packageName

        // 1) AppOps: reliable from Android 6 onward and across OEMs.
        try {
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_MOCK_LOCATION,
                    Process.myUid(),
                    packageName
                )
            } else {
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_MOCK_LOCATION,
                    Process.myUid(),
                    packageName
                )
            }
            if (mode == AppOpsManager.MODE_ALLOWED) return true
        } catch (e: Exception) {
            // continue with fallback
        }

        // 2) Settings.Secure: package name of the selected mock app (fallback).
        try {
            val mockPackage = Settings.Secure.getString(
                context.contentResolver,
                "mock_location"
            )
            if (mockPackage != null && mockPackage.isNotEmpty() &&
                (mockPackage == packageName || mockPackage == "true")
            ) {
                return true
            }
        } catch (e: Exception) {
            // ignore
        }

        return false
    }

    @ReactMethod
    fun getSetupStatus(promise: Promise) {
        try {
            val resolver = reactApplicationContext.contentResolver

            val developerEnabled = try {
                Settings.Global.getInt(
                    resolver,
                    Settings.Global.DEVELOPMENT_SETTINGS_ENABLED,
                    0
                ) == 1
            } catch (e: Exception) {
                false
            }

            val result = Arguments.createMap().apply {
                putBoolean("developer", developerEnabled)
                putBoolean("mockApp", isMockAppSelected())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun startMocking(lat: Double, lng: Double, altitude: Double, promise: Promise) {
        try {
            stopInternal()
            currentLat = lat
            currentLng = lng
            currentAltitude = altitude

            val mockProvider = MockLocationProvider(reactApplicationContext)
            provider = mockProvider
            mockProvider.setImmediate(currentLat, currentLng, currentAltitude)

            val executor = Executors.newSingleThreadScheduledExecutor()
            updateTimer = executor
            executor.scheduleAtFixedRate(
                {
                    try {
                        provider?.tick()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                },
                PUSH_INTERVAL_MS,
                PUSH_INTERVAL_MS,
                TimeUnit.MILLISECONDS
            )

            promise.resolve("Mocking gestartet")
        } catch (e: Exception) {
            stopInternal()
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun updateLocation(lat: Double, lng: Double, altitude: Double, promise: Promise) {
        try {
            val mockProvider = provider
            if (mockProvider == null) {
                promise.reject("ERROR", "Erst startMocking() aufrufen")
                return
            }
            currentLat = lat
            currentLng = lng
            currentAltitude = altitude
            mockProvider.setImmediate(currentLat, currentLng, currentAltitude)
            promise.resolve("Standort aktualisiert")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    /**
     * Sets a new target. The native timer interpolates towards it over
     * [durationMs], so position updates stay continuous even when JS can only
     * provide a new target once per second.
     */
    @ReactMethod
    fun setTarget(
        lat: Double,
        lng: Double,
        altitude: Double,
        durationMs: Double,
        promise: Promise
    ) {
        try {
            val mockProvider = provider
            if (mockProvider == null) {
                promise.reject("ERROR", "Erst startMocking() aufrufen")
                return
            }
            currentLat = lat
            currentLng = lng
            currentAltitude = altitude
            mockProvider.setTarget(
                currentLat,
                currentLng,
                currentAltitude,
                durationMs.toLong()
            )
            promise.resolve("Ziel gesetzt")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopMocking(promise: Promise) {
        try {
            stopInternal()
            promise.resolve("Mocking gestoppt")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    companion object {
        /** 20 Hz – keeps small, smooth steps for consumers. */
        private const val PUSH_INTERVAL_MS = 50L
    }
}
