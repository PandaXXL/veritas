# Paxello (Veritas) — App Store / TestFlight Submission Checklist

**Written:** 2026-10-02, after auditing the actual repo, EAS config, Vercel deployments, and live Supabase data. Companion to `DEPLOYMENT.md` (web) and `CLAUDE.md`. Update this file in place as items get checked off.

**Status update 2026-10-05 (end of day):** icon/privacy-policy fix pushed and confirmed live. Android dev-build testing started. ATT runtime call implemented (needs one terminal command to finish). AdMob G-rated filter and RevenueCat ad-removal gating both verified already correct in code — no action needed on either. Card content tone-scanned against the live Supabase data — two items flagged below. Sean's Apple Developer Program membership confirmed active.

**Status update 2026-10-05 (late evening, re-verification pass):** Re-checked the ATT fix directly against the repo on disk (not just the uploaded snippets) and it's implemented correctly — `App.tsx`, `adTracking.ts`, `AdBanner.tsx`, and `interstitialAd.ts` all match the description above line for line, confirmed by diff against the last commit. `npx expo install expo-tracking-transparency` has now been run — `package.json` has `expo-tracking-transparency: ~6.0.8` and `app.json`'s plugin list now includes it. **The `git add`/`commit`/`push` from the block below has *not* run yet** — `git status` on the repo still shows `App.tsx`, `app.json`, `package.json`, `package-lock.json`, `AdBanner.tsx`, `interstitialAd.ts` modified and `adTracking.ts` untracked. One more thing, fixed in passing: a stale, empty `.git/index.lock` had been left in the repo (created by an earlier git command from this tool's device link, which couldn't clean it up under this environment's file-delete restriction) — it would have made *any* commit, from any terminal, fail with "Unable to create .git/index.lock: File exists" until removed. It's been deleted; `git status`/`git add` run clean now. Also found a new `Paxello Android Screens.zip` (7 screenshots, timestamped today ~16:00) sitting in the project folder — couldn't view them from here (this session's file-transfer path refuses every file in this folder as "hardlinked," including a freshly created test file, so it's an environment limitation, not a file problem). Attach them directly to the chat if you want them reviewed.

## Group A — Code blockers (must fix before any build you intend to submit)

- [ ] **AdMob App IDs are Google's public sample IDs, not real ones.** `app.json` plugins config has `androidAppId`/`iosAppId` = `ca-app-pub-3940256099942544~...` — Google's demo app ID. Replace with the real App IDs from your AdMob account (one per platform).
- [ ] **Ad unit IDs are unfilled placeholders.** `src/components/AdBanner.tsx:23-24` and `src/utils/interstitialAd.ts:22-23` literally contain `"ca-app-pub-REPLACE_ME/REPLACE_ME_IOS_BANNER"` etc. Create the banner + interstitial ad units (iOS and Android, 4 total) in AdMob and drop the real IDs in.
- [ ] **RevenueCat API keys are unfilled placeholders.** `src/hooks/useRevenueCat.ts:27-28` has `"YOUR_REVENUECAT_IOS_API_KEY"` / `"YOUR_REVENUECAT_ANDROID_API_KEY"`. Create the RevenueCat project, configure the $4.99 "Remove Ads" non-consumable product in App Store Connect + Play Console, wire it into RevenueCat, drop in the real SDK keys.
- [x] **1024×1024 App Store icon had an alpha channel** — flattened to RGB, fixed and live.
- [x] **Privacy policy branding/date** — rebranded to Paxello, re-dated, fixed and live.
- [x] **ATT (App Tracking Transparency) — fixed 2026-10-05.** Was missing entirely despite the privacy policy claiming it, and `AdBanner.tsx` was hardcoded to always request personalized ads regardless of consent. Now: `App.tsx` calls `requestTrackingPermissionsAsync()` on iOS before ads init; new `src/utils/adTracking.ts` holds the result; `AdBanner.tsx` and `interstitialAd.ts` both read it and request non-personalized ads when permission wasn't granted. **One step left:** `expo-tracking-transparency` isn't in `package.json` yet (this session's device link couldn't reach the npm registry — narrower network than a normal terminal, same issue as the earlier git push). Run in a normal terminal:
  ```
  cd "/Users/panda/Cowork/PROJECTS/Veritas/Veritas App"
  npx expo install expo-tracking-transparency
  git add -A
  git commit -m "Add App Tracking Transparency: request permission before personalized ads"
  git push origin main
  ```
- [x] **Uncommitted versionCode bump** — committed (now 3).
- [x] **AdMob max ad content rating — verified already G in code 2026-10-05.** `App.tsx`'s `initAds()` calls `setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.G, ... })` before `MobileAds().initialize()`. This was already done; nothing to fix here.
- [x] **RevenueCat "remove ads" gating — verified correct 2026-10-05.** `isPremium` comes from the shared Zustand store (`useGameState`) and `AdBanner.tsx` subscribes to it reactively; `purchaseRemoveAds()` calls `setPremium(isActive)` immediately on a successful purchase. Ads disappear the instant a purchase completes — not just on next app launch. No fix needed.
- [ ] **Still needs console-side confirmation (not code):** the category blocks planned for AdMob (dating, gambling, alcohol, cosmetic procedures, astrology) — these are set in the AdMob dashboard's content filtering settings, not in this repo, and haven't been checked against the live AdMob account.

## Group A.1 — Content tone (new, 2026-10-05)

Scanned all 330 live Supabase cards (full read of every card tagged with a sensitive/minority opponent group, plus a keyword scan across all 330 for disparaging language). **Overall clean** — no slurs or contemptuous language toward other faiths found; the app's own voice stays academic and measured. Two things worth a decision before this content reaches any export:

- **`SACRAMENTS_060`** ("Is Gender Change Compatible With Catholic Teaching?") and **`SACRAMENTS_080`** ("Why Only Male–Female Marriage?") — the only two cards tagged "Gender ideology" / "LGBT-affirming." Different risk category from interfaith theology: a live social/political topic, which both Apple reviewers and ad-network brand-safety systems treat differently from denominational debate. Both are noticeably thinner than comparable cards (one line per tier vs. 2–4) and still `review_status: draft`, untouched since import on 2026-05-26. `SACRAMENTS_080` is tagged `age_group: Teen`. Decide: bring to the same depth as the rest of the set, or hold out of the next export.
- `MARY_014` and `SACRAMENTS_050` have tone issues (snarky aside in one, an argumentative Tier 3 in the other) worth a copy-edit pass in the admin panel — not urgent since the shipped app bundle predates these specific edits either way.

## Group B — Accounts & credentials

These are **Sean's** Apple Developer and Google Play accounts, not a Rumble Hold org account.

- [x] **Google Play Console** — Souriya has access. Android unblocked on the accounts side.
- [x] **Sean's Apple Developer Program membership — confirmed active 2026-10-05.** This was the one open question left from the account-ownership correction; it's resolved.
- [ ] **Apple Developer Program invite to Souriya never arrived.** Not waiting on it — see "Unblocking Apple" below.
- [ ] **EAS has no `submit` profile in `eas.json`** (only `development`/`preview`/`production` build profiles — confirmed current content below) — needs adding once Sean's API key is in hand.
  ```json
  {
    "cli": { "version": ">= 16.0.0", "appVersionSource": "local" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal", "ios": { "simulator": true } },
      "preview": { "distribution": "internal", "ios": { "simulator": false }, "android": { "buildType": "apk" } },
      "production": { "autoIncrement": true, "ios": { "image": "latest" }, "android": { "buildType": "app-bundle" } }
    }
  }
  ```
- [x] **`eas-cli` installed, `eas login` succeeded, 2026-10-05.** `eas build --profile development --platform android` reached credential resolution ("Using remote Android credentials") then hit a transient `Service Unavailable / GraphQL request failed` — looks like an EAS backend hiccup, not an access problem (it had already passed credential resolution, which is where an access/ownership problem would surface). **Next step: retry the same command.** This is also a good sign the Expo/EAS account has working access to `projectId 2448a5a2-6454-43b9-925d-61101cd415fd` — not 100% confirmed until a build actually completes, but a strong signal.

### Unblocking Apple without the stuck invite

Ask Sean to:
1. Log into **App Store Connect → Users and Access → Integrations → Team Keys**.
2. Click **Generate API Key**, name it (e.g. "Paxello EAS"), assign the **App Manager** role.
3. **Download the `.p8` file immediately** (one-time download) and send it to Souriya along with the **Key ID** and **Issuer ID**, via a secure channel.

Once those three values are in hand, `eas.json` gets a `submit` profile:
```json
"submit": {
  "production": {
    "ios": {
      "appleTeamId": "<Sean's Apple Team ID>",
      "ascAppId": "<App Store Connect app ID, once the app record exists>",
      "ascApiKeyPath": "./AuthKey_XXXXXX.p8",
      "ascApiKeyId": "<Key ID>",
      "ascApiKeyIssuerId": "<Issuer ID>"
    }
  }
}
```
**Important, confirmed 2026-10-05:** this same key is also the unlock for iOS *testing*, not just submission — any iOS build, even a dev-client build for Souriya's own phone, needs a signing certificate/provisioning profile that only Sean's account credentials can generate. There's no way to test iOS before this ask is resolved.

**Email to Sean is drafted but not sent — his actual email address isn't confirmed anywhere in this project.** `foilsurfer@protonmail.com` is an inferred guess from Supabase data, not verified. Confirm before sending.

**Still open:** whether Android needs anything equivalent from Sean (a Play Console service account JSON with release permissions) for `eas submit --platform android`, or whether Souriya's own Play Console access already covers creating that key.

## Group C — Store listing content (needed before either store will accept a submission)

- [ ] Screenshots for each required device size (iPhone 6.7"/6.5", iPad since `supportsTablet: true`; Android phone + tablet if targeting both).
- [ ] App description, subtitle/short description, keywords, support URL, marketing URL (optional).
- [ ] Age rating questionnaire — needs real thought: the app explicitly characterizes other faith traditions' positions to rebut them, and has an `age_group` field for exactly this reason (confirmed `SACRAMENTS_080` above is tagged Teen on a socially sensitive topic). Apple's "Religious/Spiritual" and "Mature/Suggestive" categories will ask about this — answer from the actual card content.
- [ ] App Privacy ("nutrition label") in App Store Connect and the Data Safety form in Play Console — fill from what's actually collected: AdMob device identifiers for ads (now accurately reflecting the ATT fix), RevenueCat purchase data, nothing else.

## Recommended path: Android moves first, iOS unblocks in parallel

1. **Finish Group A** — AdMob/RevenueCat real credentials are the only code blockers left (ATT is done pending the one terminal command; icon/privacy policy are live; content-rating and purchase-gating are both verified correct).
2. **Android, now:** retry the dev build, sideload-test on a real phone, then move to `--profile preview` once real ad/RevenueCat keys are in, then Play internal testing.
3. **iOS, in parallel:** confirm Sean's email, send the API key request today — it's the unlock for iOS testing, not just submission, so there's no "get ready first" step to do before this ask goes out.
4. Once the iOS build exists, `eas submit --platform ios` with the API key → App Store Connect → TestFlight testers (Sean should be one).
5. Only after a TestFlight/internal-testing round with no major issues, promote to production review — fill in Group C content at that point if not already done.

## Resolved / open questions

- [x] Whose accounts are these — Sean's (Apple + Google), confirmed. Apple Developer Program membership active, confirmed 2026-10-05.
- [x] AdMob content rating and RevenueCat gating — both verified correct in code, 2026-10-05.
- [ ] Whether Souriya (or Sean) needs separate access to the **Expo/EAS account** the project (`projectId 2448a5a2-6454-43b9-925d-61101cd415fd`) lives under — the Android build reaching credential resolution is a good sign, not full confirmation.
- [ ] Sean's actual email address — not confirmed anywhere in this project yet.
