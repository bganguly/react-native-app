# React Native App

Starter Expo React Native app with live Community Hub API data.

## Videos

- [Community Library Demo 1](docs/videos/Screen%20Recording%202026-03-22%20at%2010.21.25%20PM.mov)
- [Community Library Demo 2](docs/videos/Screen%20Recording%202026-03-22%20at%2010.23.09%20PM.mov)
- [Community Library Demo 3](docs/videos/Screen%20Recording%202026-03-22%20at%2010.39.55%20PM.mov)

## Screenshots

### QR Code

![QR Code](docs/screenshots/Screen%20Shot%202026-03-21%20at%2012.17.38%20PM.png)

### Web

![Web](docs/screenshots/Screen%20Shot%202026-03-21%20at%2012.15.25%20PM.png)

### iOS

![iOS](docs/screenshots/Screen%20Shot%202026-03-21%20at%2012.16.26%20PM.png)

### Android

![Android](docs/screenshots/Screen%20Shot%202026-03-21%20at%2012.30.50%20PM.png)

## Prerequisites (system)

- Node.js 18+
- npm 9+
- Xcode (for iOS simulator on macOS)
- Android Studio (for Android emulator)

Note: A global Expo CLI binary is not required. This project uses npx.

## Verify requirements

Run this script to validate local machine requirements for this Expo project:

npm run check:requirements

This check is tuned for macOS Monterey on a 2015 MacBook Pro and validates:

- Node.js and npm versions
- Xcode, xcodebuild, simctl, and iOS runtimes
- Android SDK directory, adb, emulator, and AVD presence
- Java and optional watchman

## Install

npm install

## One-command workflow

Use these commands if you want setup and run steps in one place:

- Setup only (install/check/fix versions):
	- npm run quickstart
- Setup + run iOS:
	- npm run quickstart:ios
- Setup + run Android:
	- npm run quickstart:android
- Setup + run web:
	- npm run quickstart:web

The quickstart flow runs this sequence:

1. npm install (if node_modules is missing)
2. npm run check:requirements
3. npx expo install --fix
4. starts target platform if provided

## Run (if dependecncies have already been ckecked previously)

- npm run ios
- npm run android
- npm run web
- npm run emulator:android (launch emulator only)

## Web support packages

Web support is handled by project dependencies in package.json:

- react-dom
- react-native-web

If missing, install with:

npx expo install react-dom react-native-web

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

## Android simulator troubleshooting

If Android launch fails (no devices found, emulator not detected, app not opening), use this sequence:

1. Verify Android tools are available:
	- adb devices
	- emulator -list-avds
2. Start an emulator from Android Studio Device Manager, or from terminal:
	- emulator -avd <YOUR_AVD_NAME>
	- or npm run emulator:android
3. Confirm emulator is connected:
	- adb devices
4. Start Expo on Android:
	- npx expo start --android

If detection is flaky:

- Restart adb:
	- adb kill-server
	- adb start-server
- Cold boot or wipe emulator data from Device Manager
- Ensure Android Studio SDK and system images are installed for your AVD
- If content API requests hang/spin on Android while iOS works, relaunch emulator with explicit DNS:
	- ANDROID_EMULATOR_DNS=8.8.8.8,1.1.1.1 npm run emulator:android
