# Privacy Policy

**App:** Nowhere
**Package name:** com.cactusapps.nowhere
**Developer:** Cactus Apps
**Last updated:** October 19, 2026

## 1. Overview

Nowhere is an open-source Android app that uses Android's mock location feature to simulate GPS positions on your device. We do not require an account and do not collect, store, or sell personal data. The app contains no analytics, advertising, or tracking SDKs.

The app retrieves in-app announcements from a backend service (Supabase) and receives over-the-air updates via Expo (EAS Update). Both are described in Section 3. Neither involves an account, and we do not send any personal data or user identifiers to them.

## 2. Data stored on your device

The following data is stored only locally on your device (via Android's AsyncStorage) and is never transmitted to us:

- App settings (movement mode, speeds, units, map style, language, joystick side)
- Onboarding and hint status
- Your favorite places and recently used places (coordinates and labels)

You can delete this data at any time by clearing the app's data in your Android system settings or by uninstalling the app.

## 3. Third-party services

To provide its features, the app sends requests directly from your device to the following third-party services. We do not receive or process this data. As with any internet request, these services can see your IP address and device/request metadata.

**Routing (OSRM)**
When you calculate a route, the coordinates of your start, stops, and destination are sent to public OSRM servers (routing.openstreetmap.de, with router.project-osrm.org as a fallback).

**Reverse geocoding (Nominatim)**
To show a readable address instead of raw coordinates, the app sends your current (simulated) position to the Nominatim service operated by the OpenStreetMap Foundation.

**Traffic rules data (Overpass API)**
If you use the "traffic" speed mode, the app requests traffic signals and speed limits for the area around your route. The bounding box of your route is sent to Overpass API servers: "https://overpass-api.de/api/interpreter",
"https://overpass.osm.ch/api/interpreter",
"https://overpass.kumi.systems/api/interpreter",
"https://overpass.private.coffee/api/interpreter",.

**Map tiles (OpenFreeMap)**
To display the map, the app loads map data. These requests reveal the map area you are viewing.

**In-app announcements (Supabase)**
The app can show announcements (pop-ups), for example about new features or important changes. To do this, the app fetches a public announcements table from Supabase. The same announcements are shown to all users; they are not targeted at individuals. The request contains no account, device ID, or other user identifier. Whether you have seen an announcement is stored only on your device (see Section 2) and is not sent to us or to Supabase. Supabase, as our hosting provider, may process technical request data such as your IP address in its server logs. We do not use this data to identify you.

**App updates (Expo / EAS Update)**
The app can receive over-the-air (OTA) updates of its code and assets via EAS Update, provided by Expo. When the app checks for or downloads an update, your device sends technical request data to Expo's servers, such as the app's runtime version, platform, current update ID, and your IP address. This is required to deliver the correct update. We do not receive personal data through this process.

These providers have their own privacy policies:

- OpenStreetMap Foundation: https://osmfoundation.org/wiki/Privacy_Policy
- OpenFreeMap: https://openfreemap.org
- Supabase: https://supabase.com/privacy
- Expo: https://expo.dev/privacy
- Further providers: please consult their respective websites.

### 3a. Location data and permissions

The app requires you to select it as the "mock location app" in Android's developer options. It uses this to provide simulated coordinates to other apps on your device. Simulated coordinates are only sent to the services listed above as described in Section 3.

## 4. Data sharing and retention

We do not share, sell, or rent any personal data. Locally stored data remains on your device until you delete it. Data processed by third-party providers is subject to their respective retention policies.

## 5. Children

The app is not directed at children under 13 and does not knowingly collect data from children.

## 6. Your rights

Since we do not collect or process personal data, there is no data about you for us to access, correct, or delete. If you are in the EU/EEA, you have rights under the GDPR with respect to the third-party providers above and can contact them directly.

## 7. Open source

The source code is publicly available at https://github.com/Cactus-Apps/Nowhere, so you can verify how the app handles data.

## 8. Responsible use

This app is intended for Development, testing and entertainment. Please use it in compliance with applicable laws and the terms of service of any app you use it with. We are not responsible for consequences of misuse.

## 9. Changes

We may update this policy from time to time. Changes will be published in the repository and in the app store listing, with an updated date above.

## 10. Contact

Cactus Apps
cactus_apps@proton.me
