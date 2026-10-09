// src/hooks/useRevenueCat.ts
//
// RevenueCat integration for the "Remove Ads" IAP ($4.99 one-time).
//
// SETUP REQUIRED:
// 1. Create a RevenueCat account at https://app.revenuecat.com
// 2. Create a new project and add your app
// 3. Create an entitlement named "remove_ads"
// 4. Create an offering with a $4.99 lifetime package
// 5. Replace the placeholder API keys below with your real keys
// 6. In App Store Connect / Google Play Console, create the product

import { Platform, Alert } from "react-native";
import { useGameState } from "../store/useGameState";

// Dynamic require — react-native-purchases doesn't support web
let Purchases: any = null;
let LOG_LEVEL: any = null;

if (Platform.OS !== "web") {
  const rc = require("react-native-purchases");
  Purchases = rc.default;
  LOG_LEVEL = rc.LOG_LEVEL;
}

const RC_API_KEYS = {
  ios: "YOUR_REVENUECAT_IOS_API_KEY", // TODO: still a placeholder — blocked on Sean's App Store Connect API key (no RevenueCat iOS app exists yet)
  android: "goog_yAmtAsCadPPNqhqrbjyWejauand", // Paxello (Play Store), wired 2026-10-09
};

const ENTITLEMENT_ID = "remove_ads";

/**
 * Initialize RevenueCat and check current entitlements.
 * Call once at app launch from App.tsx.
 */
export async function initRevenueCat(setPremium: (v: boolean) => void) {
  if (Platform.OS === "web" || !Purchases) return;

  try {
    const apiKey = Platform.select(RC_API_KEYS) ?? RC_API_KEYS.android;

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey });

    const customerInfo = await Purchases.getCustomerInfo();
    const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    setPremium(isActive);
  } catch {
    // Non-blocking — app works fine without premium status on failure
  }
}

/** Hook for purchase/restore actions. Use in components. */
export function useRevenueCat() {
  const isPremium = useGameState((s) => s.isPremium);
  const setPremium = useGameState((s) => s.setPremium);

  const purchaseRemoveAds = async () => {
    if (Platform.OS === "web" || !Purchases) return;

    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];

      if (!pkg) {
        Alert.alert(
          "Not Available",
          "Purchase is not available right now. Please try again later."
        );
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      setPremium(isActive);

      if (isActive) {
        Alert.alert("Thank You!", "Ads have been removed. Enjoy Paxello ad-free!");
      }
    } catch (e: any) {
      if (e?.userCancelled) return; // user tapped cancel — not an error
      Alert.alert("Purchase Failed", "Something went wrong. Please try again.");
    }
  };

  const restorePurchases = async () => {
    if (Platform.OS === "web" || !Purchases) return;

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isActive = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
      setPremium(isActive);

      Alert.alert(
        isActive ? "Purchases Restored" : "No Purchases Found",
        isActive
          ? "Ads have been removed. Welcome back!"
          : "No previous purchases found for this account."
      );
    } catch {
      Alert.alert("Restore Failed", "Something went wrong. Please try again.");
    }
  };

  return { isPremium, purchaseRemoveAds, restorePurchases };
}
