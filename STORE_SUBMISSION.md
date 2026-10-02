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

## Group B — Accounts & credentials

**Update 2026-10-02, confirmed with Souriya:** these are **Sean's** Apple Developer and Google Play accounts, not a Rumble Hold org account (the `com.rumblehold.paxello` bundle ID is just the identifier string — it doesn't need to match the account holder's name). Status:

- [x] **Google Play Console** — Souriya has access now. Android path is unblocked on the accounts side; proceed once Group A code blockers are fixed.
- [ ] **Apple Developer Program** — Sean owns the account; the App Store Connect user invite to Souriya **never arrived** (or Souriya can't accept it). Don't wait on this — see "Unblocking Apple" below for a faster path that doesn't depend on the invite at all.
- [ ] **EAS has no `submit` profile in `eas.json`** (only `development`/`preview`/`production` build profiles exist) — needs adding once credentials are sorted.
- [ ] `eas-cli` isn't installed anywhere I could check. First run will also need an Expo/EAS account — confirm whose account the project lives under (`extra.eas.projectId` in `app.json` is `2448a5a2-6454-43b9-925d-61101cd415fd`) and that Souriya has access to *that* too; this can be a separate stuck-invite problem from the Apple one.

### Unblocking Apple without the stuck invite

Confirmed directly from Apple's own App Store Connect documentation: an **Account Holder or Admin can generate a Team API Key and hand the credentials to someone else** — this sidesteps the broken user-invite entirely and is also the standard non-interactive way `eas submit` authenticates anyway (better than an Apple ID + app-specific password for this kind of handoff). Ask Sean to:

1. Log into **App Store Connect → Users and Access → Integrations → Team Keys**.
2. Click **Generate API Key**, name it (e.g. "Paxello EAS"), and assign the **App Manager** role (sufficient for build/submit/TestFlight; no need to hand over Admin).
3. **Download the `.p8` file immediately** — Apple only allows downloading it once — and send it to Souriya along with the **Key ID** and **Issuer ID** shown next to it, via a secure channel (not a casual Slack/email with the key attached in plaintext if avoidable).

Once you have those three values, `eas.json` gets a `submit` profile like:
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
and `eas submit --platform ios` can run without Souriya ever needing personal App Store Connect login access.

**Caveat (worth confirming against current EAS docs when you get there, not fully verified here):** this API key cleanly solves *submission*. The *first* `eas build --platform ios` for a new app still typically needs an interactive Apple login to generate the distribution certificate + provisioning profile (EAS then stores and reuses them for later builds). Two ways around that: (a) Sean runs that one `eas build` himself, logging in with his own Apple ID when prompted, after which EAS's managed credentials are stored on the project and Souriya can build/submit from then on; or (b) separately chase the stuck App Store Connect invite (worth asking Sean to double-check the email address he invited and resend — Apple invites silently go nowhere if the email doesn't exactly match an Apple ID). (a) is faster and doesn't depend on fixing the invite at all.

Also still worth confirming: whether Android actually needs anything equivalent from Sean (a Play Console service account JSON with release permissions) for `eas submit --platform android`, or whether Souriya's own Play Console access is already enough to create that key himself now that he's in.

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
