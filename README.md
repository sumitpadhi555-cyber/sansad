# Sansad Showdown — The Great Kursi Fight

A small browser-based 3D parliamentary satire fighting game built with Three.js and Vite. Choose a contender, take the floor, and settle the debate in a procedural arena.

## Run locally

```sh
npm install
npm run dev
```

Open the URL printed by Vite. To create a production web build, run `npm run build`; the static output is written to `dist/`.

## Included

- Nine playable public-figure-inspired contenders, with distinct profiles and stats. Mahatma Gandhi is represented as a playful historical-inspired, nonviolent character whose attacks are framed as gentle persuasion.
- Three selectable procedural arenas.
- Quick Fight, Story, Tournament, Training, and Local 1v1 modes. Story, Tournament, Quick Fight, and Training use CPU opponents; Local 1v1 is two-player on one keyboard.
- Punch, kick, guard, dodge, meter-powered special moves, health/momentum meters, a 60-second timer, pause/results screens, basic CPU behavior, and synthesized sound effects.
- Keyboard, touch controls, and mouse/touch camera drag support.

### Controls

- Player 1: **WASD** move, **J** punch, **K** kick, hold **L** guard, **Space** dodge, **I** special.
- Local 1v1 Player 2: **Arrow keys** move, **Numpad 1** punch, **Numpad 2** kick, hold **Numpad 3** guard, **Numpad 0** dodge, **Numpad 5** special.
- On touch screens, use the on-screen joystick and action buttons.

## Current limitations

This is a playable prototype, not an AAA-quality or store-ready release. The characters, arenas, and effects are procedural low-poly graphics; there are no authored production-quality character models, motion-captured animations, or recorded voice/music assets. Online multiplayer is not implemented. There is no Android/Capacitor packaging, Android 15/64-bit ARM configuration, signed APK, or device-tested mobile release in this repository. Do not treat the web build as an Android APK.
