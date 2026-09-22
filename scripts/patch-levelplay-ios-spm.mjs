// Runs after `npx cap sync ios` (see codemagic.yaml).
//
// Strips NSUserTrackingUsageDescription from Info.plist. The LevelPlay
// plugin's postSync hook (capacitor:sync:after, see package.json)
// unconditionally re-adds this key whenever it's missing, but this app doesn't
// call ATT and doesn't track — App Store Connect refuses to accept a "does not
// track" App Privacy answer while the binary declares this key.
//
// History: the iOS project used Swift Package Manager and this script also
// patched CapApp-SPM/Package.swift. With SPM the real LevelPlay SDK was never
// linked (ads were a silent no-op on iOS), and linking it via SPM crashed at
// launch. The project now uses CocoaPods, where the plugin's podspec pulls in
// IronSourceSDK directly — the same setup VBA Desk and FormulaFX ship with.
import { readFileSync, writeFileSync } from 'node:fs'
import plist from 'plist'

const plistPath = 'ios/App/App/Info.plist'
const plistRaw = readFileSync(plistPath, 'utf8')
const parsedPlist = plist.parse(plistRaw)
if (parsedPlist.NSUserTrackingUsageDescription) {
  delete parsedPlist.NSUserTrackingUsageDescription
  writeFileSync(plistPath, plist.build(parsedPlist))
  console.log('[patch-ios] Removed NSUserTrackingUsageDescription from Info.plist')
} else {
  console.log('[patch-ios] Info.plist already has no NSUserTrackingUsageDescription')
}
