import { Capacitor } from '@capacitor/core'
import { AdEvent, LevelPlayAds } from 'capacitor-levelplay-ads'

const appKey = import.meta.env.VITE_LEVELPLAY_APP_KEY?.trim()
const bannerAdUnitId = import.meta.env.VITE_LEVELPLAY_BANNER_AD_UNIT_ID?.trim()
const interstitialAdUnitId = import.meta.env.VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID?.trim()
const privacyPolicyUrl = import.meta.env.VITE_PRIVACY_POLICY_URL?.trim()
const legalNoticeUrl = import.meta.env.VITE_LEGAL_NOTICE_URL?.trim()
const isTesting = import.meta.env.VITE_ADS_TEST_MODE !== 'false'

let bootPromise: Promise<boolean> | undefined
let interstitialReady = false
let viewsSinceInterstitial = 0

export const adsEnabled = Capacitor.isNativePlatform() && Boolean(appKey)

export function bootstrapAds() {
  if (!adsEnabled) {
    return Promise.resolve(false)
  }

  bootPromise ??= initializeAds()
  return bootPromise
}

export async function showInterstitialAfterNavigation() {
  if (!interstitialAdUnitId || !(await bootstrapAds())) return

  viewsSinceInterstitial += 1
  if (viewsSinceInterstitial < 4 || !interstitialReady) return

  try {
    await LevelPlayAds.showInterstitial()
  } catch (error) {
    console.warn('[ads] Interstitial non mostrato', error)
  } finally {
    viewsSinceInterstitial = 0
    interstitialReady = false
    void loadInterstitial()
  }
}

export async function showPrivacyOptions() {
  if (!(await bootstrapAds())) return

  await LevelPlayAds.showPrivacyOptions(consentOptions())
}

// No App Tracking Transparency request: this app does not track users (no
// IDFA use, no cross-app/company data linking). Unity Ads serves
// non-personalized ads without it — see PRIVACY.md.
async function initializeAds() {
  try {
    await LevelPlayAds.requestConsentInfo(consentOptions())
    await LevelPlayAds.initialize({ appKey, isTesting })

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
    await LevelPlayAds.addListener(AdEvent.AdRevenue, (event) => {
      console.info('[ads] Revenue impression', event)
    })

    await createBanner()
    await loadInterstitial()
    return true
  } catch (error) {
    console.warn('[ads] Inizializzazione LevelPlay fallita', error)
    return false
  }
}

async function createBanner() {
  if (!bannerAdUnitId) return

  await LevelPlayAds.createBanner({
    adUnitId: bannerAdUnitId,
    adSize: 'ADAPTIVE',
    position: 'BOTTOM',
    isAutoShow: true,
    isOverlap: false,
  })
}

async function loadInterstitial() {
  if (!interstitialAdUnitId) return

  await LevelPlayAds.loadInterstitial({
    adUnitId: interstitialAdUnitId,
    autoShow: false,
  })
}

function consentOptions() {
  return {
    appName: 'Shortcut Atlas',
    accentColor: '#e0b423',
    privacyPolicyUrl,
    legalNoticeUrl,
    networks: ['unityads'],
    // Overrides for the plugin's fallback alert (no `services` config is set,
    // so the rich TCF modal is skipped). The default copy says "personalized
    // advertising", which reads like an App Tracking Transparency prompt and
    // got the app rejected under Guideline 5.1.2(i) — this app never calls
    // ATT and never reads the IDFA, so the wording must not imply tracking.
    title: 'Support this free app',
    message:
      'Shortcut Atlas is free and supported by ads served through our partner, Unity Ads. ' +
      'No account or personal profile is required. See our Privacy Policy for details on how ad data is handled.',
    acceptButtonText: 'Continue',
    declineButtonText: 'Decline',
  }
}
