#

Downgraded React Native from 0.81.5 → 0.79.2 (brings back RCT-Folly)
Pinned react-native-iap to exactly 12.16.2 (v12.16.4 has a buggy appTransactionID property)
Downgraded Expo from 54 → 53 and related packages to compatible versions

Downgraded expo-linear-gradient from ~14.0.2 to ~13.0.2 to fix the ExpoLinearGradient native module warnings
The current working configuration:
React Native 0.79.2
Expo SDK 53
react-native-iap 12.16.2 (exact version pinned)
expo-linear-gradient 13.0.2
npm overrides for react-native-css-interop: "0.1.22"

# iOS Build Fix: NitroModules Deployment Target Error

## Problem

When building the iOS app, you may encounter this error:

```
error: compiling for iOS 15.1, but module 'CxxStdlib' has a minimum deployment target of iOS 16.0
```

**Root Cause:** The `NitroModules` pod (used by `react-native-iap`) requires iOS 16.0+ for C++ interop, but the build configuration is targeting iOS 15.1. This typically happens when the build cache has stale deployment target settings.

## Solution

The main app target was still using iOS 15.1 while pods require iOS 16.0. The Podfile has been updated to fix this. Now:

1. **Clean and reinstall pods:**

```bash
cd /Users/ern/code/group-sing-along-mobile
rm -rf ios/Pods ios/build ios/Podfile.lock
export LANG=en_US.UTF-8
npx pod-install
```

2. **Rebuild the app:**

```bash
npx expo run:ios
```

## Why This Works

- Your `app.json` already sets `deploymentTarget: "16.0"`
- Your `Podfile` sets `platform :ios, '16.0'`
- The `post_install` hook enforces iOS 16.0 for all pods
- Removing cached build files forces Xcode to use the correct deployment target

## Notes

- This issue can occur after updating dependencies or Xcode versions
- The deployment target mismatch is a configuration cache issue, not a code problem
- If the issue persists after reinstalling pods, try cleaning Xcode's derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Verify the fix worked by checking the build output shows `-target arm64-apple-ios16.0-simulator` instead of `15.1`

## Additional Troubleshooting

If you're still seeing build failures after fixing the deployment target:

1. **Clean Xcode derived data:**

   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

2. **Clean build folder and rebuild:**

   ```bash
   cd ios
   xcodebuild clean -workspace GroupSingAlong.xcworkspace -scheme GroupSingAlong
   cd ..
   npx expo run:ios
   ```

3. **Check for Swift compilation errors** in the build log - these may be separate from the deployment target issue.
