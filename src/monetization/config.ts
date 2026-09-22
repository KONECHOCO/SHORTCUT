// Per-app monetization settings. Everything else in src/monetization/ is
// identical across the KONECHOCO guide apps — only this file differs.
export const monetizationConfig = {
  appName: 'Shortcut Atlas',
  accentColor: '#e0b423',
  accentTextColor: '#111111',
  // Non-consumable "Remove ads" product. Must exist with this exact ID in
  // App Store Connect (In-App Purchases) and Google Play Console (One-time products).
  removeAdsProductId: 'com.konechoco.shortcutatlas.removeads',
  // Must match `levelplay.networks` in package.json (AdMob App ID in
  // `levelplay.admob.appId` — without it the AdMob adapter crashes at launch).
  adNetworks: ['unityads', 'admob'],
  // This app never calls App Tracking Transparency (see PRIVACY.md) — keep false
  // unless the App Privacy answers in App Store Connect are changed too.
  requestTracking: false,
  // Custom consent copy: the plugin's default wording implies tracking and got
  // the app rejected under Guideline 5.1.2(i).
  consentCopy: {
    title: 'Support this free app',
    message:
      'Shortcut Atlas is free and supported by ads served through our partner, Unity LevelPlay. ' +
      'No account or personal profile is required. See our Privacy Policy for details on how ad data is handled.',
    acceptButtonText: 'Continue',
    declineButtonText: 'Decline',
  } as Record<string, string> | undefined,
}
