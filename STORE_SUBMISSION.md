# Paxello (Veritas) — App Store / TestFlight Submission Checklist

**Written:** 2026-10-02, after auditing the actual repo, EAS config, Vercel deployments, and live Supabase data (not assumptions). Companion to `DEPLOYMENT.md` (web) and `CLAUDE.md`. Update this file in place as items get checked off — don't let it go stale the way the original handoff brief did.

**Bottom line:** no build has ever been submitted to TestFlight or the App/Play Store. `eas` isn't even installed locally, there's no `submit` profile in `eas.json`, and — more importantly — the ad and purchase code currently ships with literal placeholder IDs. A build made from `main` today would compile, but ads and the $4.99 "Remove Ads" purchase would not work for real users. Fix the blockers below before burning a build.

## Group A — Code blockers (must fix before any build you intend to submit)

- [ ] **AdMob App IDs are Google's public sample IDs, not real ones.** `app.json` plugins config has `androidAppId`/`iosAppId` = `ca-app-pub-3940256099942544~...` — that's Google's demo app ID, shared by every AdMob tutorial. Replace with the real App IDs from your AdMob account (one app per platform).
- [ ] **Ad unit IDs are unfilled placeholders.** `src/components/AdBanner.tsx:23-24` and `src/utils/interstitialAd.ts:22-23` literally contain `"ca-app-pub-REPLACE_ME/REPLACE_ME_IOS_BANNER"` etc., each flagged with a `// TODO: real ID at store submission` comment someone left for this exact moment. Create the banner + interstitial ad units (iOS and Android, 4 total) in AdMob and drop the real IDs in.
- [ ] **RevenueCat API keys are unfilled placeholders.** `src/hooks/useRevenueCat.ts:27-28` has `"YOUR_REVENUECAT_IOS_API_KEY"` / `"YOUR_REVENUECAT_ANDROID_API_KEY"`. Create the RevenueCat project (if not already done — the brief mentioned RevenueCat as the decision but I found no evidence a project exists yet), configure the $4.99 "Remove Ads" non-consumable product in App Store Connect + Play Console, wire it into RevenueCat, and drop the real SDK keys in.
- [ ] **1024×1024 App Store icon has an alpha channel** (`assets/icon.png` is RGBA). Apple's App Store Connect rejects a marketing icon with transparency — it needs to be flattened to RGB with no alpha before the icon will even upload cleanly.
- [ ] **Privacy policy still says "Veritas" / dated April 8**, live right now at `https://veritas-ten-pi.vercel.app/privacy-policy.html` (verified reachable). The app itself has been "Paxello" since May 31 — a mismatched name between the live app and its privacy policy is the kind of thing a reviewer notices. Update the branding and bump the effective date, then redeploy.
- [ ] **No App Tracking Transparency (ATT) prompt call anywhere in the code**, despite the privacy policy promising "we request permission before accessing the IDFA." `react-native-google-mobile-ads`'s plugin config already sets the iOS usage-description string (`user_tracking_usage_description`), but nothing actually calls `requestTrackingPermissionsAsync()` at runtime. Without it, iOS ads run non-personalized only (not a rejection risk by itself, but the privacy policy's claim becomes inaccurate, and you're leaving ad revenue on the table) — decide whether to implement the call or soften the policy wording.
- [ ] **Uncommitted change sitting in the working tree:** `app.json` android `versionCode` was bumped 2→3 locally but never committed. Decide if that's intentional and commit it (or let EAS's `autoIncrement: true` production profile handle it and revert).

## Group B — Accounts & credentials (can't be verified from here — confirm directly)

- [ ] **Apple Developer Program membership** ($99/yr, under whatever entity — "Rumble Hold" per the bundle ID `com.rumblehold.paxello`) — active? The original brief claimed "developer accounts already submitted," but nothing in the repo or EAS config evidences a completed enrollment, and Apple's review can take 24-48h, so this should be the first thing confirmed/started if it isn't done, in parallel with Group A.
- [ ] **Google Play Console developer account** ($25 one-time) — same question.
- [ ] **EAS has no `submit` profile in `eas.json`** (only `development`/`preview`/`production` build profiles exist). Before `eas submit` will work you need either:
  - iOS: an Apple ID + app-specific password, or (cleaner, recommended) an App Store Connect API key, plus the app record created in App Store Connect under bundle ID `com.rumblehold.paxello`.
  - Android: a Google Play service account JSON key with release permissions, plus the app created in Play Console under package `com.rumblehold.paxello`.
- [ ] `eas-cli` isn't installed anywhere I could check. Running `npx eas-cli@latest build ...` the first time will also prompt for Expo account login and, for iOS, can auto-generate the distribution certificate + provisioning profile if you let it manage credentials (recommended over doing it by hand in Xcode).

## Group C — Store listing content (needed before either store will accept a submission)

- [ ] Screenshots for each required device size (iPhone 6.7"/6.5", iPad if supporting tablet — `supportsTablet: true` is set, so iPad screenshots are required; Android phone + tablet if targeting both).
- [ ] App description, subtitle/short description, keywords, support URL, marketing URL (optional).
- [ ] Age rating questionnaire — this one needs real thought, not a rubber stamp: the app explicitly engages with other faith traditions' positions (Protestant, JW, Muslim, etc.) and has an `age_group` field in the card data for exactly this reason (e.g. topics like pornography flagged `age_group`-gated). Apple's "Religious/Spiritual" and "Mature/Suggestive" categories will ask about this — answer based on the actual card content, not the app's self-image.
- [ ] App Privacy ("nutrition label") in App Store Connect and the Data Safety form in Play Console — fill these from what's actually collected: AdMob device identifiers for ads, RevenueCat purchase data, nothing else (matches the privacy policy — once Group A's ATT item is resolved, make sure the "used for tracking" answer matches whatever you decide there).

## Recommended path: TestFlight first, not direct-to-App-Store

1. Fix Group A (code blockers) — these matter for TestFlight too; Apple's internal TestFlight review is lighter than full App Store review but a build with placeholder RevenueCat keys will still misbehave for internal testers.
2. Confirm/complete Group B accounts in parallel — this is the long-pole item if either account isn't actually active yet.
3. `eas build --profile production --platform ios` (and `--platform android` for a parallel Play internal test track) once Group A/B are done. Let EAS manage credentials unless you already have a preferred cert/profile workflow.
4. `eas submit --platform ios` → App Store Connect → add internal/external TestFlight testers (Sean should be one, given he's closest to the content).
5. Only after a TestFlight round with no major issues, promote to App Store / Play production review — fill in Group C content at that point if not already done (TestFlight doesn't require full store listing content; production submission does).

## Open question for Souriya

Apple Developer Program and Google Play Console status (Group B, item 1-2) couldn't be verified from the repo or EAS config — the original brief's "already submitted" claim doesn't match what's actually configured. Confirming this first determines whether Group B starts today or has a 1-2 day Apple review wait baked into the timeline.
