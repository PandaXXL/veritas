// src/utils/adTracking.ts
//
// App Tracking Transparency (ATT) state, shared between App.tsx (where
// permission is requested once at launch) and the ad components (which
// need to know whether to request personalized or non-personalized ads).
//
// The privacy policy says we ask before accessing the IDFA — this is what
// makes that true. Without it, AdBanner/interstitialAd were always
// requesting personalized ads regardless of what the user chose.

import { Platform } from "react-native";

let trackingGranted = false;

/** Set once at launch from App.tsx after the ATT prompt resolves. */
export function setTrackingGranted(granted: boolean) {
  trackingGranted = granted;
}

/**
 * Whether ad requests should be restricted to non-personalized ads.
 * iOS: true unless the user explicitly granted ATT permission.
 * Android: ATT doesn't apply — leave personalization as-is (false).
 */
export function getRequestNonPersonalizedAdsOnly(): boolean {
  if (Platform.OS !== "ios") return false;
  return !trackingGranted;
}
