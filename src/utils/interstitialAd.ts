// src/utils/interstitialAd.ts
//
// Singleton interstitial ad manager.
// Call preloadInterstitial() once at app launch.
// Call showInterstitialIfNeeded() after a card is mastered.

import { Platform, Alert } from "react-native";
import { getRequestNonPersonalizedAdsOnly } from "./adTracking";

// Dynamic require so the web bundle doesn't try to load native modules
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;

if (Platform.OS !== "web") {
  const ads = require("react-native-google-mobile-ads");
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
}

const INTERSTITIAL_ID = {
  ios: "ca-app-pub-REPLACE_ME/REPLACE_ME_IOS_INTERSTITIAL", // TODO: real ID at store submission
  android: "ca-app-pub-REPLACE_ME/REPLACE_ME_ANDROID_INTERSTITIAL",
};

const adUnitId = __DEV__
  ? TestIds?.INTERSTITIAL
  : Platform.select(INTERSTITIAL_ID) ?? INTERSTITIAL_ID.android;

let adInstance: any = null;
let isLoaded = false;
let interstitialsShown = 0;

function loadInterstitial() {
  if (Platform.OS === "web" || !InterstitialAd) return;

  const ad = InterstitialAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: getRequestNonPersonalizedAdsOnly(),
  });
  adInstance = ad;
  isLoaded = false;

  ad.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
  });

  ad.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    loadInterstitial(); // preload next one immediately
  });

  ad.load();
}

/** Call once at app launch to preload the first interstitial. */
export function preloadInterstitial() {
  if (Platform.OS === "web") return;
  loadInterstitial();
}

/**
 * Show the preloaded interstitial if the threshold has been met.
 * shouldShow: result of calling shouldShowInterstitial() from useGameState
 * isPremium: skip for premium users
 * onUpgrade: callback to trigger the RevenueCat purchase flow (optional)
 */
export function showInterstitialIfNeeded(
  shouldShow: boolean,
  isPremium: boolean,
  onUpgrade?: () => void
) {
  if (Platform.OS === "web" || isPremium || !shouldShow) return;
  if (!isLoaded || !adInstance) return;

  adInstance.show();
  interstitialsShown += 1;

  // Subtle upsell prompt every 3rd interstitial
  if (interstitialsShown % 3 === 0) {
    setTimeout(() => {
      Alert.alert(
        "Enjoying Paxello?",
        "Remove ads forever for just $4.99 — one-time purchase, no subscription.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "Remove Ads", onPress: onUpgrade ?? (() => {}) },
        ]
      );
    }, 600);
  }
}
