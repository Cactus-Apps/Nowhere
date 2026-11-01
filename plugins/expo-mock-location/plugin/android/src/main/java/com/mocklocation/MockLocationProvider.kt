package com.mocklocation

import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.SystemClock
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot

class MockLocationProvider(context: Context) {

    private val appContext = context.applicationContext

    private val locationManager =
        appContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    private val fusedClient: FusedLocationProviderClient? = try {
        LocationServices.getFusedLocationProviderClient(appContext)
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }

    private val providers = listOf(
        LocationManager.GPS_PROVIDER,
        LocationManager.NETWORK_PROVIDER,
        LocationManager.PASSIVE_PROVIDER
    )

    private val activeProviders = mutableListOf<String>()
    private var fusedMockEnabled = false

    /**
     * Interpolation between the last position and the next target. The native
     * layer therefore keeps moving smoothly even if JS only sends a new target
     * once per second (e.g. while the app is in the background).
     */
    private var previousLat = 0.0
    private var previousLng = 0.0
    private var targetLat = 0.0
    private var targetLng = 0.0
    private var segmentStartMs = 0L
    private var segmentDurationMs = 0L

    private var currentLat = 0.0
    private var currentLng = 0.0
    private var currentAltitude = 0.0
    private var currentSpeed = 0f
    private var currentBearing = 0f

    /** Fixed horizontal accuracy in metres – realistic, not suspiciously perfect. */
    private val accuracyMeters = 3f

    init {
        providers.forEach { provider ->
            try {
                locationManager.addTestProvider(
                    provider,
                    false, false, false, false,
                    true, true, true,
                    android.location.Criteria.POWER_LOW,
                    android.location.Criteria.ACCURACY_FINE
                )
                locationManager.setTestProviderEnabled(provider, true)
                activeProviders.add(provider)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        // Many consumers (including expo-location) use the Google fused
        // provider, which has its own mock switch. Without it, real fixes keep
        // leaking through and the location jumps between real and fake.
        try {
            fusedClient?.setMockMode(true)
            fusedMockEnabled = fusedClient != null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /** Jump to a position immediately (manual updates, start position). */
    @Synchronized
    fun setImmediate(lat: Double, lng: Double, altitude: Double) {
        startSegment(lat, lng, altitude, 0L)
    }

    /** Move to a position over [durationMs], interpolated on every tick. */
    @Synchronized
    fun setTarget(lat: Double, lng: Double, altitude: Double, durationMs: Long) {
        startSegment(lat, lng, altitude, durationMs.coerceAtLeast(0L))
    }

    /** Advance the interpolation and emit the current location. */
    @Synchronized
    fun tick() {
        val now = System.currentTimeMillis()
        val progress = progressAt(now)
        currentLat = lerp(previousLat, targetLat, progress)
        currentLng = lerp(previousLng, targetLng, progress)
        emitLocation()
    }

    private fun startSegment(
        lat: Double,
        lng: Double,
        altitude: Double,
        durationMs: Long
    ) {
        val now = System.currentTimeMillis()

        // Continue from the position that is currently visible, not from a
        // stale target – otherwise every new target would cause a tiny jump.
        previousLat = lerp(previousLat, targetLat, progressAt(now))
        previousLng = lerp(previousLng, targetLng, progressAt(now))
        targetLat = lat
        targetLng = lng
        currentAltitude = altitude
        segmentStartMs = now
        segmentDurationMs = durationMs

        val dLat = targetLat - previousLat
        val dLng = targetLng - previousLng
        val dy = dLat * 111320.0
        val dx = dLng * 111320.0 * cos(Math.toRadians(previousLat))
        val distance = hypot(dx, dy)
        val seconds = segmentDurationMs / 1000.0

        currentSpeed = if (seconds > 0.0) (distance / seconds).toFloat() else 0f
        currentBearing = if (distance > 0.0001) {
            ((Math.toDegrees(atan2(dx, dy)) + 360.0) % 360.0).toFloat()
        } else {
            0f
        }

        if (durationMs == 0L) {
            currentLat = targetLat
            currentLng = targetLng
            emitLocation()
        }
    }

    private fun progressAt(now: Long): Double {
        if (segmentDurationMs <= 0L) return 1.0
        return ((now - segmentStartMs).toDouble() / segmentDurationMs)
            .coerceIn(0.0, 1.0)
    }

    private fun lerp(from: Double, to: Double, fraction: Double): Double =
        from + (to - from) * fraction

    private fun emitLocation() {
        val elapsed = SystemClock.elapsedRealtimeNanos()
        val time = System.currentTimeMillis()

        val location = Location(LocationManager.GPS_PROVIDER).apply {
            latitude = currentLat
            longitude = currentLng
            altitude = currentAltitude
            accuracy = accuracyMeters
            speed = currentSpeed
            bearing = currentBearing
            this.time = time
            elapsedRealtimeNanos = elapsed

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                isMock = true
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                verticalAccuracyMeters = accuracyMeters
                speedAccuracyMetersPerSecond = 0.1f
                bearingAccuracyDegrees = 0.1f
            }
        }

        activeProviders.forEach { providerName ->
            val providerLocation = Location(location).apply {
                this.provider = providerName
            }
            try {
                locationManager.setTestProviderLocation(providerName, providerLocation)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        if (fusedMockEnabled) {
            try {
                fusedClient?.setMockLocation(location)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @Synchronized
    fun shutdown() {
        if (fusedMockEnabled) {
            try {
                fusedClient?.setMockMode(false)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            fusedMockEnabled = false
        }

        activeProviders.forEach { provider ->
            try {
                locationManager.setTestProviderEnabled(provider, false)
                locationManager.removeTestProvider(provider)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        activeProviders.clear()
    }
}
