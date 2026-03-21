# React Native App

Starter Expo React Native app with local mocked Community Hub data.

## Prerequisites (system)

- Node.js 18+
- npm 9+
- Xcode (for iOS simulator on macOS)
- Android Studio (for Android emulator)

Note: A global Expo CLI binary is not required. This project uses npx.

## Install

npm install

## Run

- npm run ios
- npm run android
- npm run web

## Web support packages

Web support is handled by project dependencies in package.json:

- react-dom
- react-native-web

If missing, install with:

npx expo install react-dom react-native-web

## Safe area setup

This app uses safe-area primitives from react-native-safe-area-context:

- SafeAreaProvider
- SafeAreaView

Install (or re-sync) with:

npx expo install react-native-safe-area-context

## Deprecated package warnings

You may see npm warnings for packages like inflight, rimraf@3, and glob@7 during install.

- These are transitive dependencies pulled in by Expo CLI and React Native internals.
- They are not direct app dependencies in this project.
- They are not separate system binaries and should not be listed as OS-level requirements.

Current recommendation:

- Keep Expo SDK dependencies aligned with: npx expo install --fix
- Update Expo/RN when newer SDK releases replace those transitive packages upstream
- Avoid forcing npm overrides for these packages unless you are ready to test and own breakage risk

## iOS simulator troubleshooting

If iOS launch fails with errors like:

- Unable to boot device because we cannot determine the runtime bundle
- runtime profile not found

it usually means Expo is trying to boot a stale/unavailable simulator UUID.

Use this sequence:

1. Ensure Xcode is selected:
	- xcode-select -p
	- Expected path: /Applications/Xcode.app/Contents/Developer
2. Remove stale simulator entries:
	- xcrun simctl delete unavailable
3. Boot a valid simulator:
	- open -a Simulator
	- xcrun simctl boot "iPhone 14"
4. Start Expo for iOS:
	- npx expo start --ios

If a simulator hangs on first launch, wait for migration to finish once or reset it in Simulator:

- Device > Erase All Content and Settings
