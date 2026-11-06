import * as THREE from 'three';
import './style.css';
import { cast, arenas } from './data.js';
import { canvas, renderer, scene, camera, buildArena, makeFighter } from './world.js';

const byId = (id) => document.getElementById(id);
const keys = Object.create(null);
const screens = ['menu', 'select', 'fight-ui', 'result', 'pause'];
const soundButton = byId('sound-toggle');
let mode = 'quick';
let arenaIndex = 0;
let selected = [];
let highlighted = 0;
let players = [];
let showModels = [];
let running = false;
let paused = false;
let elapsed = 0;
let lastTime = performance.now();
let viewAngle = 0;
let touchMove = { x: 0, z: 0 };
let storyWins = 0;
let tournamentWins = 0;
let audioOn = true;
let audioContext;
let toastTimer;
const fightUI = byId('fight-ui');

function showScreen(id) {
  screens.forEach((screen) => {
    const el = byId(screen);
    if (el) el.classList.toggle('hidden', screen !== id);
  });
  byId('menu').classList.toggle('hidden', id !== 'menu');
  byId('app').classList.toggle('session-active', ['fight-ui', 'pause', 'result'].includes(id));
}
function toast(message) {
  const el = byId('toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 1800);
}
function tone(freq = 220, duration = .08, type = 'triangle', volume = .045) {
  if (!audioOn) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + duration);
  } catch { /* Audio is optional; gameplay remains available without it. */ }
}

function makeSelection() {
  const grid = byId('character-grid');
  grid.replaceChildren();
  cast.forEach((fighter, index) => {
    const button = document.createElement('button');
    button.className = 'character-tile';
    button.type = 'button';
    button.innerHTML = `<span class="tile-number">0${index + 1}</span><span class="tile-avatar" style="--avatar:${fighter.color};--skin:${fighter.skin};--hair:${fighter.hair}"></span><span class="tile-name">${fighter.name}<small>${fighter.title}</small></span>`;
    button.setAttribute('aria-label', `${fighter.name}, ${fighter.title}`);
    button.addEventListener('click', () => {
      highlighted = index;
      updateCard();
      tone(420, .055);
    });
    grid.append(button);
  });
}
function updateCard() {
  const fighter = cast[highlighted];
  byId('fighter-name').textContent = fighter.name;
  byId('fighter-role').textContent = fighter.title.toUpperCase();
  byId('fighter-bio').textContent = fighter.bio;
  byId('art-initial').textContent = fighter.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  byId('fighter-art').style.setProperty('--fighter-color', fighter.color);
  byId('stat-power').style.width = `${fighter.stats[0]}%`;
  byId('stat-agility').style.width = `${fighter.stats[1]}%`;
  byId('stat-guard').style.width = `${fighter.stats[2]}%`;
  document.querySelectorAll('.character-tile').forEach((el, i) => {
    el.classList.toggle('active', i === highlighted);
    el.classList.toggle('picked', selected.includes(i));
  });
  byId('selected-count').textContent = mode === 'local'
    ? `${selected.length} / 2 SELECTED`
    : `${selected.length} / 1 SELECTED`;
  byId('pick-label').textContent = mode === 'local' && selected.length === 1 ? 'PLAYER 2 · SELECT' : 'PLAYER 1 · SELECT';
  byId('confirm-pick').disabled = mode === 'local' ? selected.length >= 2 : selected.length >= 1;
  byId('confirm-pick').firstChild.textContent = mode === 'local' && selected.length === 1 ? 'SELECT PLAYER 2 ' : 'SELECT CONTENDER ';
}
function beginSelection(nextMode) {
  mode = nextMode;
  selected = [];
  highlighted = 0;
  byId('round-label').textContent = mode === 'training' ? 'PRACTICE' : 'ROUND 01';
  makeSelection();
  updateCard();
  showScreen('select');
}

function updateHealth() {
  players.forEach((player, index) => {
    const u = player.userData;
    byId(`p${index + 1}-health`).style.width = `${Math.max(0, u.health)}%`;
    byId(`p${index + 1}-meter`).style.width = `${Math.min(100, u.meter)}%`;
  });
}
function fightOpponent() {
  if (mode === 'story') return cast[[1, 2, 3][storyWins % 3]];
  if (mode === 'tournament') return cast[(selected[0] + 1 + tournamentWins) % cast.length];
  const options = cast.map((_, i) => i).filter((i) => i !== selected[0]);
  return cast[options[Math.floor(Math.random() * options.length)]];
}
function startFight() {
  players.forEach((p) => scene.remove(p));
  const p1 = cast[selected[0] ?? 0];
  const p2 = mode === 'local' ? cast[selected[1] ?? 1] : fightOpponent();
  players = [makeFighter(p1, -1), makeFighter(p2, 1)];
  players[0].position.set(-2.15, 0, 0);
  players[1].position.set(2.15, 0, 0);
  if (showModels.length) showModels.forEach((p) => { p.visible = false; });
  elapsed = 0; paused = false; running = true; viewAngle = 0;
  byId('p1-name').textContent = p1.name.toUpperCase();
  byId('p2-name').textContent = p2.name.toUpperCase();
  byId('timer').textContent = mode === 'training' ? '∞' : '60';
  byId('round-label').textContent = mode === 'story' ? `STORY ${String(storyWins + 1).padStart(2, '0')}` : mode === 'tournament' ? `BRACKET ${String(tournamentWins + 1).padStart(2, '0')}` : mode === 'training' ? 'PRACTICE' : 'ROUND 01';
  byId('fight-message').textContent = mode === 'training' ? 'Practice your timing — your opponent will not be defeated.' : 'THE HOUSE IS IN SESSION';
  byId('control-hint').textContent = mode === 'local'
    ? 'P1 WASD · J PUNCH · K KICK · L GUARD · SPACE DODGE · I SPECIAL  /  P2 ARROWS · NUMPAD 1–5'
    : 'WASD MOVE  ·  J PUNCH  ·  K KICK  ·  L GUARD  ·  SPACE DODGE  ·  I SPECIAL';
  updateHealth();
  showScreen('fight-ui');
  tone(330, .18, 'sawtooth', .025);
}
function confirmSelection() {
  if (mode === 'local' && selected.length === 1) {
    if (highlighted === selected[0]) { toast('Choose a different contender for Player 2.'); return; }
    selected.push(highlighted);
    startFight();
    return;
  }
  if (!selected.length) selected.push(highlighted);
  if (mode === 'local' && selected.length < 2) { updateCard(); return; }
  startFight();
}

function actionFor(index, action) {
  const p = players[index];
  if (!running || paused || !p) return;
  if (action === 'block') { setBlock(p, true); return; }
  attack(p, action);
}
function setBlock(p, value) {
  const u = p?.userData;
  if (!u || u.attack > 0) return;
  u.block = value;
  u.parts.body.rotation.x = value ? -.18 : 0;
  u.parts.arms[0].rotation.x = value ? -.9 : 0;
  u.parts.arms[1].rotation.x = value ? -.9 : 0;
}
function attack(p, kind) {
  const u = p?.userData;
  if (!running || paused || !u || u.cool > 0 || u.attack > 0) return;
  if (kind === 'special' && u.meter < 40) { toast('Build debate momentum to use a special.'); tone(130, .07); return; }
  if (kind === 'special') u.meter -= 40;
  if (kind === 'dodge' && u.stamina < 18) { toast('Catch your breath — stamina is low.'); return; }
  if (kind === 'dodge') u.stamina -= 18;
  u.block = false;
  u.attackType = kind;
  u.attack = kind === 'dodge' ? .32 : kind === 'special' ? .58 : kind === 'kick' ? .38 : .27;
  u.attackDuration = u.attack;
  u.cool = kind === 'dodge' ? .48 : kind === 'special' ? .9 : kind === 'kick' ? .48 : .3;
  u.hitLanded = false;
  if (kind === 'dodge') u.dodge = .28;
  tone(kind === 'special' ? 600 : kind === 'kick' ? 170 : 260, .07, kind === 'special' ? 'sine' : 'triangle');
}
function movePlayer(p, x, z, dt) {
  const u = p.userData;
  if (u.block || (u.attack > 0 && u.attackType !== 'dodge')) return;
  const length = Math.hypot(x, z) || 1;
  const speed = u.data.stats[1] / 65 * (u.dodge > 0 ? 1.8 : 1);
  p.position.x = THREE.MathUtils.clamp(p.position.x + (x / length) * speed * dt, -5.8, 5.8);
  p.position.z = THREE.MathUtils.clamp(p.position.z + (z / length) * speed * dt, -3.4, 3.4);
}
function doHit(attacker, defender) {
  const u = attacker.userData, v = defender.userData;
  if (!u.attackType || u.hitLanded || u.attack <= 0 || u.attackType === 'dodge') return;
  const active = u.attackDuration - u.attack;
  if (active < .08 || active > (u.attackType === 'special' ? .4 : .22)) return;
  const dx = defender.position.x - attacker.position.x;
  const dz = defender.position.z - attacker.position.z;
  const inRange = Math.hypot(dx, dz) < (u.attackType === 'kick' ? 2 : 1.65);
  const facing = (u.side === -1 && dx > 0) || (u.side === 1 && dx < 0);
  if (!inRange || !facing) return;
  u.hitLanded = true;
  const peaceful = u.data.peaceful;
  const base = u.attackType === 'special' ? 20 : u.attackType === 'kick' ? 12 : 8;
  const damage = base * (u.data.stats[0] / 75) * (v.block ? .2 : 1) * (v.dodge > 0 ? 0 : 1);
  v.health = Math.max(0, v.health - damage);
  v.hit = .2;
  u.meter = Math.min(100, u.meter + (u.attackType === 'special' ? 0 : 17));
  v.meter = Math.min(100, v.meter + (v.block ? 9 : 6));
  updateHealth();
  if (v.dodge <= 0) tone(v.block ? 105 : peaceful ? 500 : 90, .13, peaceful ? 'sine' : 'square', .035);
  if (peaceful) byId('fight-message').textContent = u.attackType === 'special' ? 'A PEACEFUL APPEAL — THE CROWD IS LISTENING' : 'A GENTLE PERSUASION — NOT A PUNCH';
  else byId('fight-message').textContent = v.block ? 'GUARD HELD — MOMENTUM BUILT' : u.attackType === 'special' ? 'SPECIAL MOVE CONNECTS!' : 'NICE HIT!';
  if (mode !== 'training' && v.health <= 0) endFight(attacker);
}
function cpuThink(p, opponent, dt) {
  const u = p.userData, v = opponent.userData;
  u.ai -= dt;
  const dx = opponent.position.x - p.position.x;
  const dz = opponent.position.z - p.position.z;
  const distance = Math.hypot(dx, dz);
  if (u.ai <= 0) {
    u.ai = .24 + Math.random() * .28;
    if (distance < 1.65 && Math.random() < .32) {
      if (v.attack > 0 && Math.random() < .5) setBlock(p, true);
      else attack(p, Math.random() < .16 && u.meter >= 40 ? 'special' : Math.random() < .48 ? 'kick' : 'punch');
    } else if (distance < 1.2 && Math.random() < .12) attack(p, 'dodge');
    else setBlock(p, false);
  }
  if (distance > 1.15 && !u.block) movePlayer(p, Math.sign(dx), dz / Math.max(1, Math.abs(dz)), dt);
  else if (distance < 1.1 && Math.random() < .01) movePlayer(p, Math.sign(dx), Math.sign(dz), dt);
}
function animateFighter(p, dt, t) {
  const u = p.userData, parts = u.parts;
  u.cool = Math.max(0, u.cool - dt);
  u.attack = Math.max(0, u.attack - dt);
  u.dodge = Math.max(0, u.dodge - dt);
  u.hit = Math.max(0, u.hit - dt);
  u.stamina = Math.min(100, u.stamina + dt * 11);
  if (mode === 'training') u.health = Math.min(100, u.health + dt * 4);
  const walking = Math.abs(u.moveX || 0) + Math.abs(u.moveZ || 0);
  parts.body.position.y = Math.sin(t * 8 + u.side) * .035 * walking;
  if (u.attack > 0 && u.attackType === 'punch') parts.arms[1].rotation.x = -.9;
  else if (u.attack > 0 && u.attackType === 'kick') parts.legs[1].rotation.x = -.95;
  else if (!u.block) {
    parts.arms.forEach((arm) => { arm.rotation.x = THREE.MathUtils.damp(arm.rotation.x, Math.sin(t * 2 + u.side) * .045, 7, dt); });
    parts.legs.forEach((leg) => { leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, walking ? Math.sin(t * 8 + u.side) * .3 : 0, 8, dt); });
  }
  parts.body.rotation.z = THREE.MathUtils.damp(parts.body.rotation.z, u.hit > 0 ? .16 * u.side : 0, 7, dt);
  if (u.dodge > 0) parts.body.rotation.z = u.side * .45;
  if (!u.block) parts.body.rotation.x = THREE.MathUtils.damp(parts.body.rotation.x, 0, 7, dt);
  p.rotation.y = u.side === -1 ? 0 : Math.PI;
}
function endFight(winner) {
  if (!running || mode === 'training') return;
  running = false;
  const p1Won = winner === players[0];
  if (p1Won && mode === 'story') storyWins++;
  if (p1Won && mode === 'tournament') tournamentWins++;
  const title = byId('result-title');
  const subtitle = byId('result-subtitle');
  title.innerHTML = p1Won ? 'FLOOR <em>HELD.</em>' : 'THE HOUSE <em>DECIDED.</em>';
  subtitle.textContent = `${winner.userData.data.name} takes the floor${mode === 'local' ? '.' : p1Won ? '!' : '.'}`;
  const rematch = byId('rematch');
  const seriesComplete = p1Won && ((mode === 'story' && storyWins >= 3) || (mode === 'tournament' && tournamentWins >= 3));
  const canAdvance = p1Won && !seriesComplete && (mode === 'story' || mode === 'tournament');
  if (seriesComplete) {
    title.innerHTML = mode === 'story' ? 'HOUSE <em>CHAMPION.</em>' : 'BRACKET <em>CONQUERED.</em>';
    subtitle.textContent = `${winner.userData.data.name} wins the ${mode} series!`;
  }
  rematch.innerHTML = canAdvance ? 'NEXT MATCH <span>→</span>' : seriesComplete ? 'PLAY AGAIN <span>↻</span>' : 'REMATCH <span>↻</span>';
  rematch.onclick = () => {
    if (seriesComplete) {
      storyWins = 0;
      tournamentWins = 0;
    }
    startFight();
  };
  showScreen('result');
  tone(p1Won ? 520 : 160, .32, 'sine', .06);
}

for (const button of document.querySelectorAll('[data-mode]')) {
  button.addEventListener('click', () => {
    storyWins = 0; tournamentWins = 0;
    beginSelection(button.dataset.mode);
  });
}
byId('confirm-pick').addEventListener('click', confirmSelection);
byId('back-menu').addEventListener('click', () => showScreen('menu'));
byId('arena-cycle').addEventListener('click', () => {
  arenaIndex = (arenaIndex + 1) % arenas.length;
  buildArena(arenaIndex);
  byId('arena-cycle').innerHTML = `ARENA <span>↻</span> <b>${arenas[arenaIndex].name.toUpperCase()}</b>`;
  toast(`${arenas[arenaIndex].name} selected.`);
});
byId('pause-button').addEventListener('click', () => { if (running) { paused = true; showScreen('pause'); } });
byId('resume').addEventListener('click', () => { paused = false; showScreen('fight-ui'); });
byId('result-menu').addEventListener('click', () => {
  running = false; players.forEach((p) => scene.remove(p));
  showModels.forEach((p) => { p.visible = true; });
  showScreen('menu');
});
byId('pause-menu').addEventListener('click', () => {
  running = false; players.forEach((p) => scene.remove(p));
  showModels.forEach((p) => { p.visible = true; });
  showScreen('menu');
});
soundButton.addEventListener('click', () => {
  audioOn = !audioOn;
  soundButton.innerHTML = `♫ <span>SOUND ${audioOn ? 'ON' : 'OFF'}</span>`;
  if (audioOn) tone(420, .08);
});

const keyMap = { KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'Escape') { if (running && !paused) { paused = true; showScreen('pause'); } else if (paused) { paused = false; showScreen('fight-ui'); } }
  if (event.code === 'KeyJ') actionFor(0, 'punch');
  if (event.code === 'KeyK') actionFor(0, 'kick');
  if (event.code === 'KeyL') actionFor(0, 'block');
  if (event.code === 'Space') actionFor(0, 'dodge');
  if (event.code === 'KeyI') actionFor(0, 'special');
  if (event.code === 'Numpad1') actionFor(1, 'punch');
  if (event.code === 'Numpad2') actionFor(1, 'kick');
  if (event.code === 'Numpad3') actionFor(1, 'block');
  if (event.code === 'Numpad0') actionFor(1, 'dodge');
  if (event.code === 'Numpad5') actionFor(1, 'special');
});
window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
  if (event.code === 'KeyL' && players[0]) setBlock(players[0], false);
  if (event.code === 'Numpad3' && players[1]) setBlock(players[1], false);
});

let stickPointer = null;
const stick = byId('touch-stick');
stick.addEventListener('pointerdown', (event) => { stickPointer = event.pointerId; stick.setPointerCapture(event.pointerId); updateStick(event); });
stick.addEventListener('pointermove', (event) => { if (event.pointerId === stickPointer) updateStick(event); });
function releaseStick() { stickPointer = null; touchMove = { x: 0, z: 0 }; stick.children[0].style.transform = 'translate(0,0)'; }
stick.addEventListener('pointerup', releaseStick);
stick.addEventListener('pointercancel', releaseStick);
function updateStick(event) {
  const rect = stick.getBoundingClientRect();
  const x = (event.clientX - rect.left - rect.width / 2) / (rect.width * .34);
  const y = (event.clientY - rect.top - rect.height / 2) / (rect.height * .34);
  touchMove = { x: THREE.MathUtils.clamp(x, -1, 1), z: THREE.MathUtils.clamp(y, -1, 1) };
  stick.children[0].style.transform = `translate(${touchMove.x * 25}px,${touchMove.z * 25}px)`;
}
document.querySelectorAll('.touch-actions button').forEach((button) => {
  const action = button.dataset.action;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); actionFor(0, action); });
  if (action === 'block') {
    button.addEventListener('pointerup', () => players[0] && setBlock(players[0], false));
    button.addEventListener('pointercancel', () => players[0] && setBlock(players[0], false));
  }
});
let dragX = null;
canvas.addEventListener('pointerdown', (event) => { if (!fightUI.classList.contains('hidden')) dragX = event.clientX; });
canvas.addEventListener('pointermove', (event) => { if (dragX !== null) { viewAngle = THREE.MathUtils.clamp(viewAngle + (event.clientX - dragX) * .004, -.55, .55); dragX = event.clientX; } });
window.addEventListener('pointerup', () => { dragX = null; });
document.addEventListener('touchmove', (event) => { if (!fightUI.classList.contains('hidden')) event.preventDefault(); }, { passive: false });

buildArena(arenaIndex);
showModels = [makeFighter(cast[0], -1), makeFighter(cast[6], -1), makeFighter(cast[8], -1)];
showModels.forEach((p, index) => { p.position.set(3.2 + index * 1.35, 0, -1.2 + index * .55); p.scale.setScalar(index === 1 ? .92 : 1.04); p.rotation.y = -.35; });
makeSelection();

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.04, (now - lastTime) / 1000 || 0);
  lastTime = now;
  const t = now / 1000;
  if (running && !paused) {
    elapsed += dt;
    if (mode !== 'training') {
      const seconds = Math.max(0, 60 - Math.floor(elapsed));
      byId('timer').textContent = String(seconds).padStart(2, '0');
      if (seconds === 0) endFight(players[0].userData.health >= players[1].userData.health ? players[0] : players[1]);
    }
    for (let i = 0; i < players.length; i++) {
      const player = players[i], u = player.userData, foe = players[1 - i];
      u.moveX = 0; u.moveZ = 0;
      if (i === 0) {
        const x = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + touchMove.x;
        const z = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0) + touchMove.z;
        if (x || z) { u.moveX = x; u.moveZ = z; movePlayer(player, x, z, dt); }
      } else if (mode === 'local') {
        const x = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
        const z = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
        if (x || z) { u.moveX = x; u.moveZ = z; movePlayer(player, x, z, dt); }
      } else cpuThink(player, foe, dt);
      if (u.dodge > 0) {
        movePlayer(player, player.position.x - foe.position.x, player.position.z - foe.position.z, dt);
      }
      animateFighter(player, dt, t);
      doHit(player, foe);
    }
    if (mode === 'training') updateHealth();
    const midpoint = (players[0].position.x + players[1].position.x) / 2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, midpoint * .22 + viewAngle * 5, 2, dt);
    camera.lookAt(midpoint * .18, 1.15, 0);
  } else {
    for (const fighter of showModels) animateFighter(fighter, dt, t);
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
});
