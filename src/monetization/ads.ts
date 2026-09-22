import { Capacitor } from '@capacitor/core'
import { AdEvent, LevelPlayAds } from 'capacitor-levelplay-ads'
import { monetizationConfig } from './config'
import {
  grantTemporaryAdFree,
  isAdFree,
  isPurchased,
  refreshEntitlement,
  subscribePremium,
} from './premium'

// Unity LevelPlay mediation (AdMob and other networks are enabled from the
// LevelPlay dashboard + `levelplay.networks` in package.json).
//
// Placements:
//  - launch: full-screen video interstitial on every cold start
//  - in-app: interstitial every INTERSTITIAL_EVERY_VIEWS screen changes
//  - banner: adaptive, bottom, always on
//  - rewarded (opt-in): watch a video → REWARDED_AD_FREE_MS without ads
// Nothing is shown while the user is ad-free (purchase or rewarded window).

export type AdPlacement = string

const INTERSTITIAL_EVERY_VIEWS = 3
// Minimum gap between two full-screen ads. Faster pacing is what AdMob and
// Unity flag as invalid traffic / bad ad experience, so keep it.
const MIN_INTERSTITIAL_GAP_MS = 60_000
// If the launch video isn't loaded by then, skip it rather than interrupting
// the user once they've started reading.
const LAUNCH_AD_TIMEOUT_MS = 8_000
export const REWARDED_AD_FREE_MS = 30 * 60_000

const platform = Capacitor.getPlatform()
const env = import.meta.env
const pick = (ios?: string, android?: string, shared?: string) =>
  ((platform === 'ios' ? ios : android) || shared)?.trim() || undefined

const appKey = pick(env.VITE_LEVELPLAY_APP_KEY_IOS, env.VITE_LEVELPLAY_APP_KEY_ANDROID, env.VITE_LEVELPLAY_APP_KEY)
const bannerAdUnitId = pick(
  env.VITE_LEVELPLAY_BANNER_AD_UNIT_ID_IOS,
  env.VITE_LEVELPLAY_BANNER_AD_UNIT_ID_ANDROID,
  env.VITE_LEVELPLAY_BANNER_AD_UNIT_ID,
)
const interstitialAdUnitId = pick(
  env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID_IOS,
  env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID_ANDROID,
  env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID,
)
const rewardedAdUnitId = pick(
  env.VITE_LEVELPLAY_REWARDED_AD_UNIT_ID_IOS,
  env.VITE_LEVELPLAY_REWARDED_AD_UNIT_ID_ANDROID,
  env.VITE_LEVELPLAY_REWARDED_AD_UNIT_ID,
)
const privacyPolicyUrl = env.VITE_PRIVACY_POLICY_URL?.trim()
const legalNoticeUrl = env.VITE_LEGAL_NOTICE_URL?.trim()
const isTesting = env.VITE_ADS_TEST_MODE !== 'false'

let bootPromise: Promise<boolean> | undefined
let interstitialReady = false
let interstitialShowing = false
let rewardedReady = false
let lastInterstitialAt = 0
let viewsSinceInterstitial = 0
let bannerCreated = false
let launchDone = false

export const adsEnabled = Capacitor.isNativePlatform() && Boolean(appKey)
export const rewardedEnabled = adsEnabled && Boolean(rewardedAdUnitId)

export function bootstrapAds() {
  if (!adsEnabled) return Promise.resolve(false)

  bootPromise ??= initializeAds()
  return bootPromise
}

export async function showInterstitialAfterNavigation() {
  if (!interstitialAdUnitId || !(await bootstrapAds()) || isAdFree()) return

  viewsSinceInterstitial += 1
  if (viewsSinceInterstitial < INTERSTITIAL_EVERY_VIEWS) return
  if (Date.now() - lastInterstitialAt < MIN_INTERSTITIAL_GAP_MS) return
  if (!interstitialReady) return

  viewsSinceInterstitial = 0
  await showInterstitial()
}

/**
 * Opt-in rewarded video. Resolves true once the video is shown; the ad-free
 * window is granted only when the SDK reports the reward (user watched it).
 */
export async function showRewardedForAdFree() {
  if (!rewardedAdUnitId || !(await bootstrapAds())) return false
  if (!rewardedReady) {
    void loadRewarded()
    return false
  }

  try {
    rewardedReady = false
    await LevelPlayAds.showRewarded()
    return true
  } catch (error) {
    console.warn('[ads] Rewarded non mostrato', error)
    void loadRewarded()
    return false
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
  if (!(await bootstrapAds())) return

  await LevelPlayAds.showPrivacyOptions(consentOptions())
}

async function initializeAds() {
  // Paying users: never touch the ad SDK at all.
  if (isPurchased() || (await refreshEntitlementQuickly())) return false

  try {
    await LevelPlayAds.requestConsentInfo(consentOptions())
    await LevelPlayAds.initialize({ appKey: appKey as string, isTesting })
    if (monetizationConfig.requestTracking) await LevelPlayAds.requestTrackingAuthorization()

    await LevelPlayAds.addListener(AdEvent.InterstitialLoaded, () => {
      interstitialReady = true
    })
    await LevelPlayAds.addListener(AdEvent.InterstitialClosed, () => {
      interstitialReady = false
      void loadInterstitial()
    })
    await LevelPlayAds.addListener(AdEvent.InterstitialLoadFailed, (error) => {
      interstitialReady = false
      console.warn('[ads] Caricamento interstitial fallito', error)
    })
    await LevelPlayAds.addListener(AdEvent.RewardedLoaded, () => {
      rewardedReady = true
    })
    await LevelPlayAds.addListener(AdEvent.RewardedLoadFailed, () => {
      rewardedReady = false
    })
    await LevelPlayAds.addListener(AdEvent.RewardedRewarded, () => {
      grantTemporaryAdFree(REWARDED_AD_FREE_MS)
    })
    await LevelPlayAds.addListener(AdEvent.RewardedClosed, () => {
      rewardedReady = false
      void loadRewarded()
    })
    await LevelPlayAds.addListener(AdEvent.AdRevenue, (event) => {
      console.info('[ads] Revenue impression', event)
    })

    subscribePremium(() => {
      if (isAdFree()) void removeAllAds()
      else void restoreAds()
    })

    await loadInterstitial()
    void loadRewarded()
    void showLaunchAd()
    return true
  } catch (error) {
    console.warn('[ads] Inizializzazione LevelPlay fallita', error)
    return false
  }
}

// The store answer usually arrives in well under a second; don't hold the
// ad SDK hostage if it doesn't.
function refreshEntitlementQuickly() {
  return Promise.race([refreshEntitlement(), wait(1_500).then(() => false)])
}

async function showLaunchAd() {
  if (isAdFree()) {
    launchDone = true
    return
  }
  const deadline = Date.now() + LAUNCH_AD_TIMEOUT_MS
  while (!interstitialReady && Date.now() < deadline) await wait(250)

  if (interstitialReady && !isAdFree()) await showInterstitial()
  // Banner after the launch video so the two don't load at the same time.
  launchDone = true
  if (!isAdFree()) await createBanner()
}

async function showInterstitial() {
  if (interstitialShowing) return
  interstitialShowing = true
  try {
    await LevelPlayAds.showInterstitial()
    lastInterstitialAt = Date.now()
  } catch (error) {
    console.warn('[ads] Interstitial non mostrato', error)
  } finally {
    interstitialShowing = false
    interstitialReady = false
    void loadInterstitial()
  }
}

async function createBanner() {
  if (!bannerAdUnitId || bannerCreated) return
  bannerCreated = true

  try {
    await LevelPlayAds.createBanner({
      adUnitId: bannerAdUnitId,
      adSize: 'ADAPTIVE',
      position: 'BOTTOM',
      isAutoShow: true,
      isOverlap: false,
    })
  } catch (error) {
    bannerCreated = false
    console.warn('[ads] Banner non creato', error)
  }
}

async function loadInterstitial() {
  if (!interstitialAdUnitId || isAdFree()) return

  try {
    await LevelPlayAds.loadInterstitial({ adUnitId: interstitialAdUnitId, autoShow: false })
  } catch (error) {
    console.warn('[ads] Caricamento interstitial fallito', error)
  }
}

async function loadRewarded() {
  if (!rewardedAdUnitId || isPurchased()) return

  try {
    await LevelPlayAds.loadRewarded({ adUnitId: rewardedAdUnitId })
  } catch (error) {
    console.warn('[ads] Caricamento rewarded fallito', error)
  }
}

async function removeAllAds() {
  if (!bannerCreated) return
  bannerCreated = false
  try {
    await LevelPlayAds.destroyBanner()
  } catch (error) {
    console.warn('[ads] Banner non rimosso', error)
  }
}

// Rewarded window expired: bring banner and interstitials back.
async function restoreAds() {
  if (!launchDone) return
  await createBanner()
  if (!interstitialReady) await loadInterstitial()
}

function consentOptions() {
  return {
    appName: monetizationConfig.appName,
    accentColor: monetizationConfig.accentColor,
    privacyPolicyUrl,
    legalNoticeUrl,
    networks: monetizationConfig.adNetworks,
    ...monetizationConfig.consentCopy,
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
