# Sansad Showdown — The Great Kursi Fight

A small, browser-based 3D political-satire arena brawler. Choose a debater and arena, then fight a CPU opponent, practice, or play a local two-player match. It uses a locally bundled Three.js module and procedural 3D scenery and character models.

## Run locally

From this directory, start any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000> in a modern browser. No build step or package installation is needed. The supplied `start.sh` is an OMGithub runtime entrypoint and expects its `RUNTIME_DIR` environment variable; it is not the general-purpose local run command above.

## Build the Android APK

The Android app is a fullscreen WebView wrapper that packages the game and its Three.js module locally, so the game itself works without a network connection. With Java 17, Gradle 9.1 or later, and Android SDK 36 installed, build a debug APK with:

```sh
cd android
gradle assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on a connected device with `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

## Controls

- **Player 1:** WASD to move, J to punch, K to kick, L or Shift to block, Space to dodge, E for a special, Esc to pause.
- **Player 2 (Local 1v1):** Arrow keys to move, numpad 1/2 to punch/kick, numpad 3 or Right Shift to block, Enter to dodge, numpad 0 for a special.
- **Touch:** On-screen movement and action buttons are available on touch devices.

## What's implemented

- Nine character selections, three arenas, and a 3D fight scene with health, stamina, timer, synthesized sound effects, CPU opponent, pause/results panels, and responsive touch controls.
- Quick Fight, Story, Tournament, Local 1v1, and Training selections. Story and Tournament provide lightweight sequential CPU fights rather than a full narrative or competitive bracket.
- Online Multiplayer appears in the mode menu but is not connected to matchmaking; selecting it displays an unavailable notice.

## Limitations

This is a web prototype, not a finished mobile release. There is no native Android project, Android 15 configuration, signed APK, online backend, or verified controller support. Characters, crowd, arenas, and sound are procedural/simple prototype assets rather than production-quality authored assets. Browser support and performance vary by device; no mobile-device optimization or release build has been verified.

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Remixed using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/sumitpadhi555-cyber/sansad)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/sumitpadhi555-cyber/sansad)

- 🎮 [Open the project](https://go.ondev.store/sumitpadhi555-cyber/sansad).
- ✨ [Remix this project](https://go.ondev.store/sumitpadhi555-cyber/sansad?remix=1).
- 💻 [Explore the source](https://github.com/sumitpadhi555-cyber/sansad).
- 🛠️ [Check build runs](https://github.com/sumitpadhi555-cyber/sansad/actions).
- 🐛 [Report an issue](https://github.com/sumitpadhi555-cyber/sansad/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/sumitpadhi555-cyber).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
- 🧬 [Explore the remix source](https://github.com/sumitpadhi555-cyber/sansad).
<!-- omgithub:readme:end -->
