// Per-app monetization settings. Everything else in src/monetization/ is
// identical across the KONECHOCO guide apps — only this file differs.
export const monetizationConfig = {
  appName: 'Shortcut Atlas',
  accentColor: '#e0b423',
  accentTextColor: '#111111',
  // Non-consumable "Remove ads" product. Must exist with this exact ID in
  // App Store Connect (In-App Purchases) and Google Play Console (One-time products).
  removeAdsProductId: 'com.konechoco.shortcutatlas.removeads',
  // This app never calls App Tracking Transparency (see PRIVACY.md) — keep false
  // unless the App Privacy answers in App Store Connect are changed too.
  requestTracking: false,
}
