# Sansad Showdown — The Great Kursi Fight

A small, 3D political-satire arena brawler for browsers and landscape Android phones. Choose a debater and arena, then fight a CPU opponent, practice, or play a local two-player match. Three.js is bundled with the app; the game also includes eight stylised character models and procedural scenery.

## Run locally

From this directory, start any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000> in a modern browser. Web fonts are loaded from Google Fonts when online; the game itself runs without them. The supplied `start.sh` is an OMGithub runtime entrypoint and expects its `RUNTIME_DIR` environment variable; it is not the general-purpose local run command above.

## Build the Android APK

Every push to `main`/`master`, and every manual run of **Actions → Android APK**, builds a landscape-oriented debug APK. Download `sansad-showdown-debug-apk` from the completed workflow run's **Artifacts** section. Pushing a version tag such as `v1.0.0` also attaches the APK to a GitHub Release. This is a debug-signed build for testing and sideloading, not a production-signed Play Store release.

To build locally (Node.js 20+, Java 21, and Android SDK/API 35 required):

```sh
npm ci
npm run build
npx cap add android
npx cap sync android
python3 scripts/set-android-landscape.py
(cd android && ./gradlew assembleDebug)
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The generated `android/` directory is intentionally ignored; GitHub Actions creates it from the checked-in Capacitor config and packages the same web build.

## Controls

- **Player 1:** WASD to move, J to punch, K to kick, L or Shift to block, Space to dodge, E for a special, Esc to pause.
- **Player 2 (Local 1v1):** Arrow keys to move, numpad 1/2 to punch/kick, numpad 3 or Right Shift to block, Enter to dodge, numpad 0 for a special.
- **Touch:** On-screen movement and action buttons are available on touch devices.

## What's implemented

- Nine character selections, three arenas, and a 3D fight scene with health, stamina, timer, synthesized sound effects, CPU opponent, pause/results panels, and responsive touch controls.
- Quick Fight, Story, Tournament, Local 1v1, and Training selections. Story and Tournament provide lightweight sequential CPU fights rather than a full narrative or competitive bracket.
- Online Multiplayer appears in the mode menu but is not connected to matchmaking; selecting it displays an unavailable notice.

## Limitations

This remains a prototype, not a finished mobile release. Android packaging is provided as a landscape debug APK workflow, but there is no production signing setup, online backend, or verified controller support. Characters, crowd, arenas, and sound are stylised/procedural prototype assets rather than production-quality authored assets. Browser support and performance vary by device, and a release build has not been verified.

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
