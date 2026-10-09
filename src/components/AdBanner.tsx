// src/components/AdBanner.tsx
//
// Anchored adaptive banner ad. Hides on web and for premium users.
// Real ad unit IDs go in the constants below — swap at store submission.

import React from "react";
import { View, Platform } from "react-native";
import { useGameState } from "../store/useGameState";
import { getRequestNonPersonalizedAdsOnly } from "../utils/adTracking";

// Dynamic require — react-native-google-mobile-ads has no web support
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

if (Platform.OS !== "web") {
  const ads = require("react-native-google-mobile-ads");
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

const BANNER_ID = {
  ios: "ca-app-pub-5791395628689572/4906628075",
  android: "ca-app-pub-5791395628689572/1489203804",
};

const adUnitId = __DEV__
  ? TestIds?.ADAPTIVE_BANNER
  : Platform.select(BANNER_ID) ?? BANNER_ID.android;

export function AdBanner() {
  const isPremium = useGameState((s) => s.isPremium);

  if (Platform.OS === "web" || isPremium || !BannerAd) return null;

  return (
    <View style={{ alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(212,168,67,0.1)" }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: getRequestNonPersonalizedAdsOnly() }}
      />
    </View>
  );
}
