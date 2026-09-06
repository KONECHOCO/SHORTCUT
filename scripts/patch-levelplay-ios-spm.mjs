// `npx cap sync ios` regenerates ios/App/CapApp-SPM/Package.swift from
// scratch, so this runs after sync (see codemagic.yaml) to:
//
// 1. Fix the plugin's SPM dependency name — Capacitor derives it from the
//    npm package name "capacitor-levelplay-ads" as "CapacitorLevelplayAds"
//    (lowercase "p" in "play"), but the plugin's own Package.swift declares
//    itself as "CapacitorLevelPlayAds" (capital "P"). Mismatched names make
//    SwiftPM fail to resolve the local path dependency.
// 2. Strip NSUserTrackingUsageDescription from Info.plist. The plugin's
//    postSync hook (capacitor:sync:after, see package.json) unconditionally
//    re-adds this key whenever it's missing, but this app doesn't call ATT
//    and doesn't track — App Store Connect refuses to accept a "does not
//    track" App Privacy answer while the binary declares this key.
//
// NOTE: we previously also added the real Unity/ironSource LevelPlay SDK
// here as direct SPM dependencies (LevelPlay-Swift-Package +
// LevelPlay-UnityAds-Adapter-Swift-Package) so the plugin's
// `#if canImport(IronSource)` ad code would actually link instead of
// silently no-op. That caused a crash on launch on a physical device
// (confirmed on two builds) that we couldn't diagnose further without
// Xcode/device-console access. Reverted — ads stay non-functional
// (no-op) until that's investigated properly with real debugging tools.
import { readFileSync, writeFileSync } from 'node:fs'
import plist from 'plist'

const path = 'ios/App/CapApp-SPM/Package.swift'
let contents = readFileSync(path, 'utf8')

contents = contents.replaceAll('CapacitorLevelplayAds', 'CapacitorLevelPlayAds')

writeFileSync(path, contents)
console.log('[patch-levelplay-ios-spm] Package.swift patched (plugin dependency name fix only)')

const plistPath = 'ios/App/App/Info.plist'
const plistRaw = readFileSync(plistPath, 'utf8')
const parsedPlist = plist.parse(plistRaw)
if (parsedPlist.NSUserTrackingUsageDescription) {
  delete parsedPlist.NSUserTrackingUsageDescription
  writeFileSync(plistPath, plist.build(parsedPlist))
  console.log('[patch-levelplay-ios-spm] Removed NSUserTrackingUsageDescription from Info.plist')
} else {
  console.log('[patch-levelplay-ios-spm] Info.plist already has no NSUserTrackingUsageDescription')
}
