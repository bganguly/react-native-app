#!/usr/bin/env bash
set -u

PASS=0
WARN=0
FAIL=0

log_ok() {
  echo "[OK]   $1"
  PASS=$((PASS + 1))
}

log_warn() {
  echo "[WARN] $1"
  WARN=$((WARN + 1))
}

log_fail() {
  echo "[FAIL] $1"
  FAIL=$((FAIL + 1))
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

echo "React Native Expo requirements check"
echo "Assumption: macOS Monterey on 2015 MacBook Pro"
echo

if has_cmd sw_vers; then
  MACOS_VERSION="$(sw_vers -productVersion 2>/dev/null || echo unknown)"
  if [[ "$MACOS_VERSION" == 12.* ]]; then
    log_ok "macOS version is $MACOS_VERSION (Monterey)"
  else
    log_warn "macOS version is $MACOS_VERSION (expected Monterey 12.x)"
  fi
else
  log_warn "Could not determine macOS version"
fi

if has_cmd uname; then
  ARCH="$(uname -m)"
  log_ok "CPU architecture: $ARCH"
fi

if has_cmd node; then
  NODE_VERSION="$(node -v | sed 's/^v//')"
  NODE_MAJOR="${NODE_VERSION%%.*}"
  if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && (( NODE_MAJOR >= 18 )); then
    log_ok "Node.js $NODE_VERSION"
  else
    log_fail "Node.js $NODE_VERSION (need 18+)"
  fi
else
  log_fail "Node.js is not installed"
fi

if has_cmd npm; then
  NPM_VERSION="$(npm -v)"
  NPM_MAJOR="${NPM_VERSION%%.*}"
  if [[ "$NPM_MAJOR" =~ ^[0-9]+$ ]] && (( NPM_MAJOR >= 9 )); then
    log_ok "npm $NPM_VERSION"
  else
    log_warn "npm $NPM_VERSION (recommended 9+)"
  fi
else
  log_fail "npm is not installed"
fi

if has_cmd npx; then
  log_ok "npx is available"
else
  log_fail "npx is not available"
fi

if [[ -d "/Applications/Xcode.app" ]]; then
  log_ok "Xcode.app found"
else
  log_fail "Xcode.app not found in /Applications"
fi

if has_cmd xcode-select; then
  DEV_DIR="$(xcode-select -p 2>/dev/null || true)"
  if [[ -n "$DEV_DIR" ]]; then
    log_ok "xcode-select path: $DEV_DIR"
  else
    log_fail "xcode-select is not configured"
  fi
else
  log_fail "xcode-select command not found"
fi

if has_cmd xcodebuild; then
  XCODEBUILD_VERSION="$(xcodebuild -version 2>/dev/null | head -n 1)"
  if [[ -n "$XCODEBUILD_VERSION" ]]; then
    log_ok "$XCODEBUILD_VERSION"
  else
    log_warn "xcodebuild exists but version check failed"
  fi
else
  log_fail "xcodebuild is not available"
fi

if has_cmd xcrun; then
  if xcrun --find simctl >/dev/null 2>&1; then
    log_ok "simctl is available"
    RUNTIME_COUNT="$(xcrun simctl list runtimes 2>/dev/null | grep -c "iOS" || true)"
    if [[ "$RUNTIME_COUNT" =~ ^[0-9]+$ ]] && (( RUNTIME_COUNT > 0 )); then
      log_ok "iOS runtimes detected: $RUNTIME_COUNT"
    else
      log_warn "No iOS runtimes detected"
    fi
  else
    log_fail "simctl not found via xcrun"
  fi
else
  log_fail "xcrun is not available"
fi

if [[ -d "$HOME/Library/Android/sdk" ]]; then
  log_ok "Android SDK directory found at ~/Library/Android/sdk"
else
  log_warn "Android SDK directory not found at ~/Library/Android/sdk"
fi

if has_cmd adb; then
  ADB_VERSION="$(adb version 2>/dev/null | head -n 1)"
  log_ok "${ADB_VERSION:-adb available}"
else
  log_warn "adb not found in PATH"
fi

if has_cmd emulator; then
  AVD_COUNT="$(emulator -list-avds 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$AVD_COUNT" =~ ^[0-9]+$ ]] && (( AVD_COUNT > 0 )); then
    log_ok "Android AVDs detected: $AVD_COUNT"
  else
    log_warn "No Android AVDs found"
  fi
else
  log_warn "Android emulator command not found in PATH"
fi

if has_cmd java; then
  JAVA_LINE="$(java -version 2>&1 | head -n 1)"
  log_ok "${JAVA_LINE}"
else
  log_warn "Java is not available in PATH"
fi

if has_cmd watchman; then
  log_ok "watchman is installed"
else
  log_warn "watchman not found (optional but recommended)"
fi

echo
TOTAL=$((PASS + WARN + FAIL))
echo "Checks run: $TOTAL"
echo "Passed: $PASS"
echo "Warnings: $WARN"
echo "Failed: $FAIL"

if (( FAIL > 0 )); then
  echo
  echo "Result: FAIL"
  exit 1
fi

echo
if (( WARN > 0 )); then
  echo "Result: PASS with warnings"
else
  echo "Result: PASS"
fi
