# Action Figure Roster — 8 Characters

This package contains eight separate glTF 2.0 binary models (.glb). Each model has a node-based articulated body hierarchy, separate editable body-part meshes, and twelve named animation clips.

## Included characters
- Narendra Modi
- Rahul Gandhi
- Donald Trump
- Yogi Adityanath
- Nitin Gadkari
- Ravi Kishan
- Lalu Prasad Yadav
- Mahatma Gandhi

## Animation clips in every GLB
`Idle`, `Punch`, `Kick`, `Jump`, `JumpKick`, `MoveForward`, `MoveBackward`, `Block`, `Dodge`, `Combo`, `Knockout`, `GetUp`.

There is no left/right locomotion. Forward/backward movement is represented by root translation on +Z / -Z.

## Import / customise
- **Godot:** import the `.glb` directly; inspect the scene tree and AnimationPlayer.
- **Three.js:** load with `GLTFLoader`; use `gltf.animations` with `AnimationMixer`.
- **Unity:** use a glTF importer such as glTFast; the separate joint nodes and animation clips can be driven through the imported hierarchy. These are node-animated articulated figures, not Unity Humanoid retargeting rigs.
- **Blender:** import each `.glb`, edit meshes/materials, and refine the heads/outfits.

## Important quality note
These are procedural stylised base figures intended as editable prototypes. They have face/outfit cues for each named character, but are not photorealistic sculpted likenesses or production-quality motion-captured animation. The clips are simple starter motions that may need tuning for your game camera, proportions, and physics.

## Files
- `*.glb` — individual importable character model plus animations
- `manifest.json` — roster and clip names
- `build_roster.py` — source generator for customising the palette and figure parameters
