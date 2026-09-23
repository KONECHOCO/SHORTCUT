import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob'
import { UnityAds } from 'capacitor-unity-ads'
import { monetizationConfig } from './config'
import {
  grantTemporaryAdFree,
  isAdFree,
  isPurchased,
  refreshEntitlement,
  subscribePremium,
} from './premium'

// Ads stack:
//  - Unity Ads (direct SDK): full-screen video on every cold start, an
//    interstitial every INTERSTITIAL_EVERY_VIEWS screen changes, and the opt-in
//    rewarded video (→ REWARDED_AD_FREE_MS without ads).
//  - AdMob: bottom banner only (non-personalized unless tracking is allowed).
//    Keeping AdMob out of full-screen ads avoids its "ads on app open" policy.
// Nothing is shown while the user is ad-free (purchase or rewarded window).
//
// Env (Codemagic): VITE_UNITY_GAME_ID[_IOS|_ANDROID], VITE_UNITY_*_PLACEMENT_ID,
// VITE_ADMOB_BANNER_ID[_IOS|_ANDROID]. The older VITE_LEVELPLAY_* variables are
// still read: they hold the Unity Game ID and placement IDs for these apps.

export type AdPlacement = string

const INTERSTITIAL_EVERY_VIEWS = 3
// Minimum gap between two full-screen ads. Faster pacing is what ad networks
// flag as invalid traffic / bad ad experience, so keep it.
const MIN_INTERSTITIAL_GAP_MS = 60_000
// If the launch video isn't ready by then, skip it rather than interrupting
// the user once they've started reading.
const LAUNCH_AD_TIMEOUT_MS = 8_000
export const REWARDED_AD_FREE_MS = 30 * 60_000

const platform = Capacitor.getPlatform()
const env = import.meta.env
const pick = (ios?: string, android?: string, shared?: string) =>
  ((platform === 'ios' ? ios : android) || shared)?.trim() || undefined
const suffix = platform === 'ios' ? 'iOS' : 'Android'

const legacyAppKey = pick(env.VITE_LEVELPLAY_APP_KEY_IOS, env.VITE_LEVELPLAY_APP_KEY_ANDROID, env.VITE_LEVELPLAY_APP_KEY)
const gameId =
  pick(env.VITE_UNITY_GAME_ID_IOS, env.VITE_UNITY_GAME_ID_ANDROID, env.VITE_UNITY_GAME_ID) ??
  // Unity Game IDs are numeric; a real LevelPlay app key is not.
  (legacyAppKey && /^\d+$/.test(legacyAppKey) ? legacyAppKey : undefined)
const interstitialPlacementId =
  pick(
    env.VITE_UNITY_INTERSTITIAL_PLACEMENT_ID_IOS,
    env.VITE_UNITY_INTERSTITIAL_PLACEMENT_ID_ANDROID,
    env.VITE_UNITY_INTERSTITIAL_PLACEMENT_ID,
  ) ??
  pick(
    env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID_IOS,
    env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID_ANDROID,
    env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID,
  ) ??
  `Interstitial_${suffix}`
const rewardedPlacementId =
  pick(
    env.VITE_UNITY_REWARDED_PLACEMENT_ID_IOS,
    env.VITE_UNITY_REWARDED_PLACEMENT_ID_ANDROID,
    env.VITE_UNITY_REWARDED_PLACEMENT_ID,
  ) ??
  pick(
    env.VITE_LEVELPLAY_REWARDED_AD_UNIT_ID_IOS,
    env.VITE_LEVELPLAY_REWARDED_AD_UNIT_ID_ANDROID,
    env.VITE_LEVELPLAY_REWARDED_AD_UNIT_ID,
  )
const bannerAdId = pick(env.VITE_ADMOB_BANNER_ID_IOS, env.VITE_ADMOB_BANNER_ID_ANDROID, env.VITE_ADMOB_BANNER_ID)
const isTesting = env.VITE_ADS_TEST_MODE !== 'false'

let bootPromise: Promise<boolean> | undefined
let admobReady = false
let interstitialShowing = false
let lastInterstitialAt = 0
let viewsSinceInterstitial = 0
let bannerShown = false
let launchDone = false
let personalizedAllowed = false

export const adsEnabled = Capacitor.isNativePlatform() && Boolean(gameId || bannerAdId)
export const rewardedEnabled = Capacitor.isNativePlatform() && Boolean(gameId && rewardedPlacementId)

export function bootstrapAds() {
  if (!adsEnabled) return Promise.resolve(false)

  bootPromise ??= initializeAds()
  return bootPromise
}

export async function showInterstitialAfterNavigation() {
  if (!gameId || !(await bootstrapAds()) || isAdFree() || !launchDone) return

  viewsSinceInterstitial += 1
  if (viewsSinceInterstitial < INTERSTITIAL_EVERY_VIEWS) return
  if (Date.now() - lastInterstitialAt < MIN_INTERSTITIAL_GAP_MS) return

  viewsSinceInterstitial = 0
  await showInterstitial()
}

/**
 * Opt-in rewarded video. Resolves true once the user watched it to the end;
 * that grants the temporary ad-free window.
 */
export async function showRewardedForAdFree() {
  if (!rewardedPlacementId || !gameId || !(await bootstrapAds())) return false

  try {
    const { loaded } = await UnityAds.isRewardedVideoLoaded()
    if (!loaded) {
      void loadRewarded()
      return false
    }
    const { success } = await UnityAds.showRewardedVideo()
    if (success) grantTemporaryAdFree(REWARDED_AD_FREE_MS)
    return success
  } catch (error) {
    console.warn('[ads] Rewarded non mostrato', error)
    return false
  } finally {
    void loadRewarded()
  }
}

/** Kept for apps that toggle the banner per screen; the banner is global now. */
export async function showBannerAd(_placement?: AdPlacement) {
  if (!(await bootstrapAds()) || isAdFree()) return
  await createBanner()
}

export async function hideBannerAd(_placement?: AdPlacement) {
  // Intentionally a no-op: the banner stays on every screen for free users.
}

export async function showPrivacyOptions() {
  if (!(await bootstrapAds()) || !admobReady) return

  try {
    await AdMob.showPrivacyOptionsForm()
  } catch (error) {
    console.warn('[ads] Opzioni privacy non disponibili', error)
  }
}

async function initializeAds() {
  // Paying users: never touch the ad SDKs at all.
  if (isPurchased() || (await refreshEntitlementQuickly())) return false

  // AdMob first: consent form and ATT prompt must come before Unity starts.
  await initializeAdMob()
  await initializeUnity()

  subscribePremium(() => {
    if (isAdFree()) void removeBanner()
    else void restoreAds()
  })

  void showLaunchAd()
  return true
}

async function initializeAdMob() {
  if (!bannerAdId) return
  try {
    // Google-certified consent (UMP) for EEA/UK users.
    const consent = await AdMob.requestConsentInfo()
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm()
    }
    // App Tracking Transparency only for apps whose App Privacy declares tracking.
    if (monetizationConfig.requestTracking && platform === 'ios') {
      await AdMob.requestTrackingAuthorization().catch(() => undefined)
      const { status } = await AdMob.trackingAuthorizationStatus().catch(() => ({ status: 'denied' as const }))
      personalizedAllowed = status === 'authorized'
    }
    await AdMob.initialize({ initializeForTesting: isTesting })
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      // Keep page content above the native banner.
      document.body.style.paddingBottom = `${size.height}px`
    })
    admobReady = true
  } catch (error) {
    console.warn('[ads] Inizializzazione AdMob fallita', error)
  }
}

async function initializeUnity() {
  if (!gameId) return
  try {
    await UnityAds.initialize({ gameId, testMode: isTesting })
    await loadInterstitial()
    void loadRewarded()
  } catch (error) {
    console.warn('[ads] Inizializzazione Unity Ads fallita', error)
  }
}

// The store answer usually arrives in well under a second; don't hold the
// ad SDKs hostage if it doesn't.
function refreshEntitlementQuickly() {
  return Promise.race([refreshEntitlement(), wait(1_500).then(() => false)])
}

async function showLaunchAd() {
  if (gameId && !isAdFree()) {
    const deadline = Date.now() + LAUNCH_AD_TIMEOUT_MS
    let ready = false
    while (!ready && Date.now() < deadline) {
      ready = await UnityAds.isInterstitialLoaded()
        .then((r) => r.loaded)
        .catch(() => false)
      if (!ready) await wait(250)
    }
    if (ready && !isAdFree()) await showInterstitial()
  }
  launchDone = true
  // Banner after the launch video so the two don't load at the same time.
  if (!isAdFree()) await createBanner()
}

async function showInterstitial() {
  if (interstitialShowing) return
  interstitialShowing = true
  try {
    const { loaded } = await UnityAds.isInterstitialLoaded()
    if (!loaded) return
    await UnityAds.showInterstitial()
    lastInterstitialAt = Date.now()
  } catch (error) {
    console.warn('[ads] Interstitial non mostrato', error)
  } finally {
    interstitialShowing = false
    void loadInterstitial()
  }
}

async function createBanner() {
  if (!bannerAdId || !admobReady || bannerShown) return
  bannerShown = true

  try {
    await AdMob.showBanner({
      adId: bannerAdId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting,
      // Non-personalized unless the user allowed tracking (apps with requestTracking).
      npa: !personalizedAllowed,
    })
  } catch (error) {
    bannerShown = false
    console.warn('[ads] Banner non mostrato', error)
  }
}

async function loadInterstitial() {
  if (!gameId || isAdFree()) return
  try {
    await UnityAds.loadInterstitial({ placementId: interstitialPlacementId })
  } catch (error) {
    console.warn('[ads] Caricamento interstitial fallito', error)
  }
}

async function loadRewarded() {
  if (!gameId || !rewardedPlacementId || isPurchased()) return
  try {
    await UnityAds.loadRewardedVideo({ placementId: rewardedPlacementId })
  } catch (error) {
    console.warn('[ads] Caricamento rewarded fallito', error)
  }
}

async function removeBanner() {
  if (!bannerShown) return
  bannerShown = false
  document.body.style.paddingBottom = ''
  try {
    await AdMob.removeBanner()
  } catch (error) {
    console.warn('[ads] Banner non rimosso', error)
  }
}

// Rewarded window expired: bring banner and interstitials back.
async function restoreAds() {
  if (!launchDone) return
  await createBanner()
  await loadInterstitial()
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
