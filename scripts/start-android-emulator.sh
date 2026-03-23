#!/usr/bin/env bash
set -euo pipefail

if ! command -v emulator >/dev/null 2>&1; then
  echo "Error: emulator command not found. Ensure Android SDK emulator tools are in PATH."
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "Error: adb command not found. Ensure Android SDK platform-tools are in PATH."
  exit 1
fi

if adb devices | awk 'NR>1 && /device$/ && $1 ~ /^emulator-/{found=1} END{exit !found}'; then
  echo "An Android emulator is already running."
  adb devices
  exit 0
fi

requested_avd="${1:-}"

if [[ -n "$requested_avd" ]]; then
  avd_name="$requested_avd"
else
  avd_name="$(emulator -list-avds | head -n 1)"
fi

if [[ -z "${avd_name:-}" ]]; then
  echo "Error: no Android Virtual Devices found. Create one in Android Studio Device Manager first."
  exit 1
fi

echo "Starting Android emulator: $avd_name"
dns_servers="${ANDROID_EMULATOR_DNS:-8.8.8.8,1.1.1.1}"
nohup emulator -avd "$avd_name" -netdelay none -netspeed full -dns-server "$dns_servers" >/tmp/android-emulator.log 2>&1 &

for _ in {1..60}; do
  if adb devices | awk 'NR>1 && /device$/ && $1 ~ /^emulator-/{found=1} END{exit !found}'; then
    echo "Android emulator is ready."
    adb devices
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for emulator to connect."
echo "Check logs: /tmp/android-emulator.log"
exit 1
