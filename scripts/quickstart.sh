#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-none}"
FORCE_INSTALL="${2:-}"

print_step() {
  echo
  echo "==> $1"
}

if [[ ! -d "node_modules" || "$FORCE_INSTALL" == "--force-install" ]]; then
  print_step "Installing dependencies"
  npm install
else
  print_step "Dependencies already installed (use --force-install to reinstall)"
fi

print_step "Checking local machine requirements"
npm run check:requirements

print_step "Aligning dependency versions for current Expo SDK"
npx expo install --fix

case "$TARGET" in
  ios)
    print_step "Starting iOS"
    npm run ios
    ;;
  android)
    print_step "Starting Android"
    npm run android
    ;;
  web)
    print_step "Starting Web"
    npm run web
    ;;
  start)
    print_step "Starting Expo"
    npm run start
    ;;
  none)
    print_step "Setup complete"
    echo "Run one of these next:"
    echo "  npm run ios"
    echo "  npm run android"
    echo "  npm run web"
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Usage: bash ./scripts/quickstart.sh [ios|android|web|start] [--force-install]"
    exit 2
    ;;
esac
