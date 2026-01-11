# Common Commands Reference

This should work - version 14.6.2 is compatible with RN 0.81.5 and we removed the worklets that caused the NitroModules error.

npx expo run:ios

## Development Commands

### Start Development Server

```bash
npx expo start
```

### Run on iOS Simulator

```bash
npx expo run:ios
```

### Run on Android

```bash
npx expo run:android
```

### Clear Cache and Restart

```bash
npx expo start --clear
```

## Building & Installing

### Rebuild iOS App (Simulator)

```bash
npx expo run:ios
```

### Rebuild iOS App (Physical Device)

```bash
npx expo run:ios -d <device-id>
```

### Install CocoaPods Dependencies

```bash
export LANG=en_US.UTF-8
npx pod-install
```

### Regenerate iOS/Android Projects

```bash
npx expo prebuild --platform ios --clean
```

### Clean iOS Build

```bash
cd ios && xcodebuild clean -workspace GroupSingAlong.xcworkspace -scheme GroupSingAlong && cd ..
```

## Tailwind/NativeWind Setup

### Current Configuration (NativeWind v4)

**babel.config.js:**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo",
      ["nativewind/babel"], // NativeWind v4 preset
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
        },
      ],
    ],
  };
};
```

**metro.config.js:**

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

**Key Dependencies:**

- `nativewind@^4.2.1`
- `react-native-worklets-core@^1.6.2`
- `tailwindcss@^3.3.2`

## Troubleshooting

### Worklets Version Mismatch Error

If you see: `Mismatch between JavaScript part and native part of Worklets (0.6.1 vs 0.5.1)`

**Solution:**

1. Make sure `react-native-worklets-core` is installed:

   ```bash
   npm install react-native-worklets-core
   ```

2. Reinstall pods:

   ```bash
   export LANG=en_US.UTF-8
   npx pod-install
   ```

3. Rebuild the app:
   ```bash
   npx expo run:ios
   ```

### Tailwind Styles Not Applying

**Checklist:**

- [ ] `nativewind/babel` preset in `babel.config.js`
- [ ] `withNativeWind` wrapper in `metro.config.js`
- [ ] `global.css` imports Tailwind directives
- [ ] `global.css` imported in `App.tsx`
- [ ] Metro bundler restarted with `--clear` flag

### Expo Go Limitations

**NativeWind v4 requires native modules and does NOT work with Expo Go.**

To use NativeWind v4:

- ✅ Must use development build (`npx expo run:ios`)
- ❌ Cannot use Expo Go app

## Important Notes

### When to Rebuild Native Code

Rebuild the app (`npx expo run:ios`) when:

- Installing new native dependencies
- Modifying `babel.config.js` or `metro.config.js`
- Updating NativeWind or worklets packages
- Seeing native module errors

### Development Workflow

**For code changes (JS/TS/styling):**

```bash
# Just reload in the app - no rebuild needed
# Press 'r' in terminal or shake device
```

**For native dependency changes:**

```bash
npx pod-install
npx expo run:ios
```

## Useful Shortcuts

While dev server is running:

- `r` - Reload app
- `m` - Toggle menu
- `j` - Open debugger
- `?` - Show all commands
- `Ctrl+C` - Stop server
