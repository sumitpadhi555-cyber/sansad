import * as THREE from 'three';
import './style.css';

const cast = [
  {name:'Narendra Modi',title:"THE PEOPLE'S ORATOR",special:'THE FLOOR SPEECH',color:'#d77a27',skin:'#bd8567',hair:'#ece8df',bio:'A commanding presence with a flair for grand entrances and a perfectly timed counterpoint.',stats:[8,7,6],gear:'vest',voice:'The floor is mine!'},
  {name:'Yogi Adityanath',title:'THE SAFFRON SENTINEL',special:'MONASTIC MOMENTUM',color:'#df792c',skin:'#a96d50',hair:'#34251c',bio:'A steady, disciplined defender who knows when a pause becomes a punchline.',stats:[7,8,6],gear:'robe',voice:'Stay focused!'},
  {name:'Nitin Gadkari',title:'THE INFRASTRUCTURE ACE',special:'HIGHWAY TO THE KURSI',color:'#397b56',skin:'#b78264',hair:'#ded5c5',bio:'Builds pressure methodically, then opens a fast lane straight through your guard.',stats:[9,6,6],gear:'jacket',voice:'On the fast track!'},
  {name:'Ravi Kishan',title:'THE CROWD-PLEASING SHOWMAN',special:'CINEMA SPECTACULAR',color:'#5476bd',skin:'#a97659',hair:'#241e1b',bio:'A performer at heart: all flourish, feints, and one very dramatic finishing pose.',stats:[6,7,9],gear:'scarf',voice:'Picture abhi baaki hai!'},
  {name:'Lalu Prasad Yadav',title:'THE FOLK HERO',special:'CHAUPAL CLINCH',color:'#9c4a4b',skin:'#a9755e',hair:'#d6d1c7',bio:'A warm, wily grappler who turns a close encounter into a folksy surprise.',stats:[8,8,5],gear:'shawl',voice:'Arre, baithiye zara!'},
  {name:'Rahul Gandhi',title:'THE LONG-DISTANCE DEBATER',special:'YATRA MOMENTUM',color:'#eeeeea',skin:'#c48f71',hair:'#3d332d',bio:'Keeps moving, keeps asking questions, and finds openings where others see a dead end.',stats:[7,7,7],gear:'jacket',voice:'One more question!'},
  {name:'Mamata Banerjee',title:'THE STREETWISE SPARK',special:'KOLKATA QUICKSTEP',color:'#428fc0',skin:'#d3a184',hair:'#292725',bio:'Quick-footed and impossible to pin down, with a spirited answer for every attack.',stats:[6,8,9],gear:'shawl',voice:'Cholo, let us go!'},
  {name:'Mahatma Gandhi',title:'THE PEACEFUL PROVOCATEUR',special:'THE GREAT SALT MARCH',color:'#d9c9a4',skin:'#a77b61',hair:'#d9d0be',bio:'A playful historical-inspired non-violent challenger: sidesteps, spins, and wins by outlasting the storm.',stats:[5,9,7],gear:'dhoti',voice:'Peace, and a nimble step!'},
  {name:'Donald Trump',title:'THE GRANDSTAND SHOWMAN',special:'THE BIG LEAGUE POSE',color:'#375f9b',skin:'#d5a77d',hair:'#edc45c',bio:'A larger-than-life showman who pairs big gestures with an unexpectedly sturdy guard.',stats:[8,5,7],gear:'suit',voice:'A tremendous move!'}
];
const arenas=[{name:'The People’s Chamber',caption:'MARBLE · TEAK · BIG DEBATES',color:'#a88350'},{name:'Monsoon Courtyard',caption:'RAIN-SWEPT · OPEN-AIR · ELECTRIC',color:'#4c8387'},{name:'The Midnight Gallery',caption:'NEON · GLASS · AFTER HOURS',color:'#665493'}];
const modes=[['story','STORY MODE'],['quick','QUICK FIGHT'],['tournament','TOURNAMENT'],['versus','1V1 LOCAL'],['multi','MULTIPLAYER'],['training','TRAINING'],['online','ONLINE · SOON']];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();scene.background=new THREE.Color('#252820');scene.fog=new THREE.FogExp2('#252820',.027);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,180);camera.position.set(0,7.3,14.4);camera.lookAt(0,1.25,0);
scene.add(new THREE.HemisphereLight('#d9e7d4','#503d2e',2.1));
const keyLight=new THREE.DirectionalLight('#fff1cc',3.3);keyLight.position.set(-5,12,7);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-13;keyLight.shadow.camera.right=13;keyLight.shadow.camera.top=13;keyLight.shadow.camera.bottom=-13;scene.add(keyLight);
const rimLight=new THREE.PointLight('#d8f56a',75,28);rimLight.position.set(5,5,-3);scene.add(rimLight);
const arenaRoot=new THREE.Group();scene.add(arenaRoot);const fighterRoot=new THREE.Group();scene.add(fighterRoot);
let fighters=[],gameState='menu',selected=0,arenaIndex=0,mode='quick',quality='high',last=performance.now(),timeLeft=90,elapsed=0,round=1,matchHits=0,combo=0,comboTimer=0,paused=false,activeFight=false,training=false,storyIndex=0,tournamentIndex=0,roundsWon=0;
const held=new Set(),mobileHeld=new Set();let audioCtx=null,soundOn=true,bgmOsc=[];
function mat(color,roughness=.72,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(parent,w,h,d,m,x=0,y=0,z=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function sphere(parent,r,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;}
function cyl(parent,rt,rb,h,m,x=0,y=0,z=0,n=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function clearGroup(g){while(g.children.length){const c=g.children.pop();c.traverse?.(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});}}
function makeArena(index){clearGroup(arenaRoot);const base=mat(index===2?'#292539':index===1?'#465951':'#554638');const floor= new THREE.Mesh(new THREE.CylinderGeometry(8.7,9.1,.38,64),base);floor.position.y=-.25;floor.receiveShadow=true;arenaRoot.add(floor);
 const trim=mat(index===2?'#9983d0':'#c3a86f',.36,.45);const ring=new THREE.Mesh(new THREE.TorusGeometry(7.5,.075,8,90),trim);ring.rotation.x=Math.PI/2;ring.position.y=-.045;arenaRoot.add(ring);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(5.5,.035,6,80),mat('#d7c899',.45,.25));inner.rotation.x=Math.PI/2;inner.position.y=-.04;arenaRoot.add(inner);
 const ground=new THREE.Mesh(new THREE.CircleGeometry(8.58,64),mat(index===1?'#65766a':index===2?'#38364b':'#78604a'));ground.rotation.x=-Math.PI/2;ground.position.y=-.045;ground.receiveShadow=true;arenaRoot.add(ground);
 // parliament-inspired curved galleries and repeated audience silhouettes
 const wallMat=mat(index===2?'#312e43':index===1?'#455148':'#554b3d');
 for(let row=0;row<3;row++){const rad=10.4+row*.9,y=.55+row*.78;const rail=new THREE.Mesh(new THREE.TorusGeometry(rad,.13,7,80,Math.PI*1.52),mat(row===1?'#a18b60':'#73634c',.48,.2));rail.rotation.x=Math.PI/2;rail.rotation.z=Math.PI*.24;rail.position.y=y;arenaRoot.add(rail);
   for(let i=0;i<12;i++){const a=Math.PI*.17+i/11*Math.PI*.66;const x=Math.cos(a)*rad,z=-Math.sin(a)*rad;const seat=box(arenaRoot,.43,.28,.4,mat(i%4===0?'#9c463d':index===1?'#78948b':'#867349'),x,y-.16,z);seat.rotation.y=-a;const head=sphere(arenaRoot,.14,mat(['#b27d5c','#d4a47f','#60483b','#e0b492'][i%4]),x,y+.24,z,.85,1,.85);head.castShadow=true;}}
 // colonnade, wood panelling, roof lights
 for(let i=0;i<10;i++){const x=(i-4.5)*2.65;box(arenaRoot,.26,6,.35,mat('#c4ad7e'),x,3.05,-10.9);const cap=box(arenaRoot,.65,.25,.58,mat('#d2ba84'),x,5.9,-10.9);cap.rotation.z=.03;}
 box(arenaRoot,28,.32,.5,mat('#c5aa78'),0,6.15,-10.9);
 for(let i=0;i<7;i++){const x=(i-3)*2.2;const glow=index===2?'#d8c9ff':index===1?'#d3f0e5':'#ffe6ad';const bulbMat=new THREE.MeshStandardMaterial({color:glow,emissive:glow,emissiveIntensity:1.2,roughness:.25});sphere(arenaRoot,.12,bulbMat,x,5.45,-5.7);}
 // Speaker's rostrum at the back, two national-colour-free banners
 const wood=mat(index===2?'#59466e':'#654329',.38);box(arenaRoot,2.7,.3,.85,wood,0,.22,-7.2);box(arenaRoot,1.85,1.4,.65,wood,0,1,-7.1);box(arenaRoot,2.2,.12,.8,trim,0,1.77,-7.1);box(arenaRoot,1.2,.6,.35,mat('#49311f'),0,2.06,-7.2);
 for(const x of [-4.3,4.3]){box(arenaRoot,.65,2.8,.14,mat(index===1?'#7b9991':index===2?'#594d72':'#8c7150'),x,1.4,-7.5);}
 // foreground benches and desk corners
 for(const x of [-6.6,6.6]){box(arenaRoot,2.2,.32,.75,wood,x,.13,-3.7);box(arenaRoot,1.9,.45,.18,mat('#846447'),x,.44,-3.8);}
 // Dais lamps as warm pools, ambient bounce
 const warm=new THREE.PointLight(index===2?'#a98cff':'#ffb961',35,14);warm.position.set(0,3,-4);arenaRoot.add(warm);
 scene.fog.color.set(index===1?'#2a4141':index===2?'#211d31':'#252820');scene.background.set(index===1?'#304743':index===2?'#242137':'#252820');
}
function makeFighter(index,player){const c=cast[index],root=new THREE.Group();fighterRoot.add(root);root.position.set(player? -1.65:1.65,0,player?1:-1);root.rotation.y=player?0:Math.PI;
 const rig=new THREE.Group();root.add(rig);const skin=mat(index===7?'#9f775e':c.skin),cloth=mat(c.color),dark=mat('#292820'),hair=mat(c.hair),gold=mat('#d6ba72',.38,.35);
 // silhouette and clothing distinguish each fictionalized satirical caricature
 const body=sphere(rig,.48,cloth,0,1.04,0,1,.98,.62);const torso=box(rig,.75,.73,.55,cloth,0,1.04,0);torso.geometry.translate(0,0,0);
 const neck=cyl(rig,.15,.17,.23,skin,0,1.48,0);const head=sphere(rig,.36,skin,0,1.83,0,.9,1.08,.88);
 sphere(rig,.365,hair,0,2.04,-.015,.91,.38,.9);
 // face features
 for(const side of [-1,1]){sphere(rig,.045,mat('#f3eee1'),side*.13,1.88,.304,.9,1,.5);sphere(rig,.021,dark,side*.13,1.88,.344);sphere(rig,.033,skin,side*.35,1.81,0,.75,1,1);}
 box(rig,.2,.025,.02,dark,0,1.73,.315);sphere(rig,.028,dark,0,1.81,.337);
 if(index===0||index===3||index===4||index===8){const beard=sphere(rig,.24,index===8?hair:mat('#d5d0c6'),0,1.63,.18,1,.58,.55);}
 if(index===1){const wrap=sphere(rig,.39,mat('#e6a14e'),0,2.1,0,1.06,.39,1);}
 if(index===7){sphere(rig,.19,hair,0,2.08,0,1,.55,.9);cyl(rig,.018,.018,.38,gold,0,1.4,0);}
 if(index===8){const hairShape=sphere(rig,.36,mat('#e8c256'),0,2.1,0,1.1,.32,1);}
 // arms and articulated limbs
 const armPivots=[],legPivots=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.48,1.34,0);rig.add(arm);cyl(arm,.15,.13,.55,cloth,0,-.25,0);sphere(arm,.145,skin,0,-.55,.02);armPivots.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.2,.68,0);rig.add(leg);cyl(leg,.18,.15,.55,cloth,0,-.15,0);cyl(leg,.16,.17,.24,dark,0,-.52,.07);legPivots.push(leg);}
 // signature costume accents: scarf, waistcoat, shawl, robe or suit details
 if(index===0){box(rig,.78,.26,.59,mat('#b77a38'),0,1.37,0);box(rig,.1,.38,.03,gold,0,1.1,.29);}
 if(index===2||index===5||index===8){box(rig,.08,.56,.035,index===8?gold:mat('#d8d6cb'),0,1.02,.29);}
 if(index===3){const scarf=box(rig,.18,.84,.16,mat('#f0d484'),-.32,1.22,.25);scarf.rotation.z=-.22;}
 if(index===4||index===6){const shawl=box(rig,.18,.82,.16,index===6?mat('#e7e2d5'):mat('#c4a78a'),-.36,1.25,.25);shawl.rotation.z=-.24;}
 if(index===7){box(rig,.72,.24,.62,mat('#e4d7b8'),0,.58,0);}
 if(index===8){box(rig,.88,.12,.61,mat('#e8e5d7'),0,.63,0);}
 const accessory=new THREE.Group();rig.add(accessory);
 return {root,rig,armPivots,legPivots,head,c,cloth,skin,player,index,health:100,stamina:100,blocking:false,dodge:0,attack:0,attackType:'',attackCooldown:0,hitFlash:0,stun:0,aiThink:0,walk:0,pose:'idle',lastHit:0,accessory};
}
function rebuildFighters(enemyIdx=2){clearGroup(fighterRoot);const p=makeFighter(selected,true),e=makeFighter(enemyIdx,false);fighters=[p,e];}
makeArena(0);

function initAudio(){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();if(!bgmOsc.length){const master=audioCtx.createGain();master.gain.value=.018;master.connect(audioCtx.destination);[55,82.4,110].forEach((freq,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=i?'triangle':'sine';o.frequency.value=freq;g.gain.value=i?.26:.48;o.connect(g);g.connect(master);o.start();bgmOsc.push(o);});}}catch{}}
function tone(freq=160,duration=.1,wave='sine',volume=.06){if(!soundOn)return;initAudio();if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(45,freq*.55),audioCtx.currentTime+duration);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}
function bark(text){if(!soundOn||!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.rate=1.12;u.pitch=1.05;u.volume=.22;speechSynthesis.speak(u);}
function callout(text){const el=$('#fightCallout');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1050);}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('visible');setTimeout(()=>t.classList.remove('visible'),1900);}
function setupMenus(){const roster=$('#roster');cast.forEach((c,i)=>{const b=document.createElement('button');b.className='roster-card';b.innerHTML=`<span class="roster-num">0${i+1}</span><span class="roster-art" style="--art:${c.color};--skin:${c.skin};--hair:${c.hair};--cloth:${c.color}"></span><span class="roster-name">${c.name}</span><span class="roster-check">✦</span>`;b.onclick=()=>selectFighter(i);roster.append(b);});
 const cards=$('#arenaCards');arenas.forEach((a,i)=>{const b=document.createElement('button');b.className='arena-card';b.style.setProperty('--arena-color',a.color);b.innerHTML=`<span class="arena-index">ARENA 0${i+1}</span><span class="arena-check">✦</span><span class="arena-name">${a.name}</span><span class="arena-caption">${a.caption}</span>`;b.onclick=()=>selectArena(i);cards.append(b);});
 const modesEl=$('#modeSelect');modes.forEach(([id,label])=>{const b=document.createElement('button');b.className='mode-pill'+(id==='online'?' disabled':'');b.textContent=label;b.onclick=()=>{if(id==='online'){toast('ONLINE PLAY IS NOT INCLUDED IN THIS BUILD');return;}mode=id;$$('.mode-pill').forEach(x=>x.classList.toggle('active',x===b));};modesEl.append(b);});
 document.querySelector('.mode-pill').classList.add('active');selectFighter(0);selectArena(0);}
function selectFighter(i){selected=(i+cast.length)%cast.length;$$('.roster-card').forEach((b,j)=>b.classList.toggle('active',j===selected));const c=cast[selected];$('#fighterNumber').textContent=`0${selected+1} / 09`;$('#fighterName').textContent=c.name;$('#fighterTitle').textContent=c.title;$('#fighterBio').textContent=c.bio;$('#fighterSpecial').innerHTML=`${c.special} <span>✦</span>`;$('#portraitInitial').textContent=c.name.split(' ').map(x=>x[0]).slice(0,2).join('');$('#fighterPortrait').style.setProperty('--portrait',c.color);$('#fighterStats').innerHTML=['POWER','GUARD','AGILITY'].map((n,j)=>`<div class="stat-row"><span>${n}</span><span class="stat-track"><i style="width:${c.stats[j]*10}%"></i></span><span class="stat-value">${c.stats[j]}</span></div>`).join('');if(fighters.length&&!activeFight)rebuildFighters();}
function selectArena(i){arenaIndex=i;$$('.arena-card').forEach((b,j)=>b.classList.toggle('active',j===i));makeArena(i);}
setupMenus();
function screen(id){['mainMenu','selectScreen','arenaScreen'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id));$('#fightUI').classList.toggle('hidden',id!=='fightUI');}
function enemyPick(){if(mode==='story')return (storyIndex+1)%cast.length;if(mode==='tournament')return (tournamentIndex+1)%cast.length;let n=Math.floor(Math.random()*cast.length);if(n===selected)n=(n+1)%cast.length;return n;}
function startMatch(){initAudio();training=mode==='training';if(mode==='story'){storyIndex=storyIndex%cast.length;}if(mode==='tournament')tournamentIndex=tournamentIndex%cast.length;makeArena(arenaIndex);rebuildFighters(enemyPick());fighters.forEach(f=>{f.health=100;f.stamina=100;});timeLeft=90;elapsed=0;combo=0;matchHits=0;round=mode==='tournament'?tournamentIndex+1:mode==='story'?storyIndex+1:1;paused=false;activeFight=true;$('#pauseOverlay').classList.add('hidden');$('#resultOverlay').classList.add('hidden');$('#hudPlayerName').textContent=cast[selected].name.toUpperCase();$('#hudCpuName').textContent=mode==='versus'||mode==='multi'?'PLAYER 2':cast[fighters[1].index].name.toUpperCase();$('#playerTag').textContent=cast[selected].title;$('#enemyTag').textContent=mode==='versus'||mode==='multi'?'LOCAL CHALLENGER':cast[fighters[1].index].title;$('#roundLabel').textContent=`ROUND ${round}`;$('#fightTimer').textContent='90';updateHud();screen('fightUI');callout(mode==='training'?'TRAINING ROUND':mode==='versus'||mode==='multi'?'MAKE YOUR CASE!':'FIGHT!');tone(350,.28,'triangle',.08);setTimeout(()=>tone(510,.24,'triangle',.07),180);}
$('#playNow').onclick=()=>{initAudio();screen('selectScreen');};$('#backToMenu').onclick=()=>screen('mainMenu');$('#continueBtn').onclick=()=>screen('arenaScreen');$('#backToRoster').onclick=()=>screen('selectScreen');$('#startFight').onclick=startMatch;$('#brandHome').onclick=()=>{if(activeFight){paused=true;$('#pauseOverlay').classList.remove('hidden');}else screen('mainMenu');};
$('#soundToggle').onclick=()=>{soundOn=!soundOn;$('#soundToggle').innerHTML=soundOn?'♪ <span>SOUND ON</span>':'♪ <span>SOUND OFF</span>';if(soundOn)initAudio();else if(audioCtx)audioCtx.suspend();};
$('#difficultySelect').onchange=e=>{quality=e.target.value==='hard'?'high':quality;};
$('#pauseBtn').onclick=()=>{paused=true;$('#pauseOverlay').classList.remove('hidden');};$('#resumeBtn').onclick=()=>{paused=false;$('#pauseOverlay').classList.add('hidden');};$('#quitBtn').onclick=()=>{activeFight=false;paused=false;$('#pauseOverlay').classList.add('hidden');screen('arenaScreen');};
$('#rematchBtn').onclick=startMatch;$('#resultMenuBtn').onclick=()=>{activeFight=false;$('#resultOverlay').classList.add('hidden');screen('mainMenu');};
$$('.roster-card');
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();held.add(k);if(k==='escape'&&activeFight){paused=!paused;$('#pauseOverlay').classList.toggle('hidden',!paused);}if(k==='enter'&&!activeFight&&$('#selectScreen').classList.contains('hidden')===false)screen('arenaScreen');});window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));
$$('[data-move]').forEach(b=>{const k=b.dataset.move;const down=e=>{e.preventDefault();mobileHeld.add(k);};const up=e=>{e.preventDefault();mobileHeld.delete(k);};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);});
$$('[data-action]').forEach(b=>{const a=b.dataset.action;const down=e=>{e.preventDefault();if(!activeFight)return;mobileHeld.add(a);if(a!=='block')doAction(fighters[0],a);};const up=e=>{e.preventDefault();mobileHeld.delete(a);};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);});

function pressed(k){return held.has(k)||mobileHeld.has(k);}
function beginAttack(f,type){if(f.stun>0||f.attackCooldown>0||f.stamina<(type==='special'?34:type==='kick'?18:10))return;const cost=type==='special'?34:type==='kick'?18:10;f.stamina-=cost;f.attack=.34;f.attackType=type;f.attackCooldown=type==='special'?1.05:type==='kick'?.58:.34;f.pose=type;f.lastHit=0;tone(type==='special'?270:type==='kick'?190:230,.11,'sawtooth',.045);}
function doAction(f,a){if(!f||!activeFight||paused)return;if(a==='punch'||a==='kick'||a==='special')beginAttack(f,a);else if(a==='dodge'&&f.stamina>=18&&f.dodge<=0){f.stamina-=18;f.dodge=.38;f.pose='dodge';tone(440,.07,'triangle',.03);}else if(a==='block')f.blocking=true;}
function attackKey(f,player){if(player){if(pressed('j'))beginAttack(f,'punch');if(pressed('k'))beginAttack(f,'kick');if(pressed('u'))beginAttack(f,'special');if(pressed(' ')&&f.stamina>=18&&f.dodge<=0){f.stamina-=18;f.dodge=.38;f.pose='dodge';}f.blocking=pressed('l')||mobileHeld.has('block');}else {if(pressed('1'))beginAttack(f,'punch');if(pressed('2'))beginAttack(f,'kick');if(pressed('0'))beginAttack(f,'special');f.blocking=pressed('3');if(pressed('shift')&&f.stamina>=18&&f.dodge<=0){f.stamina-=18;f.dodge=.38;}}}
function damage(attacker,target,type){if(attacker.lastHit||attacker.attack<=.08)return;const distance=attacker.root.position.distanceTo(target.root.position);if(distance>2.05)return;attacker.lastHit=1;const blocked=target.blocking&&target.stamina>2&&!target.dodge;const base=type==='special'?24:type==='kick'?14:9;const power=attacker.c.stats[0]/7;const amount=blocked?Math.max(2,base*.18):base*power;
 target.health=Math.max(0,target.health-amount);target.stamina=Math.max(0,target.stamina-(blocked?4:6));target.stun=blocked?.14:type==='special'?.55:.31;target.hitFlash=.18;target.pose=blocked?'block':'hit';target.root.position.x+=Math.sign(target.root.position.x-attacker.root.position.x)*(blocked?.13:.34);target.root.position.z+=Math.sign(target.root.position.z-attacker.root.position.z)*(blocked?.08:.18);matchHits++;
 if(attacker.player&&!blocked){combo++;comboTimer=1.6;}else if(!blocked)combo=0;updateHud();tone(blocked?120:type==='special'?95:145,.15,'triangle',blocked?.035:.065);if(type==='special'&&!blocked){callout(attacker.c.special);if(attacker.player)bark(attacker.c.voice);}else if(blocked)toast('BLOCKED!');
 if(target.health<=0||timeLeft<=0)endMatch();}
function updateHud(){$('#playerHealth').style.width=`${fighters[0]?.health||0}%`;$('#enemyHealth').style.width=`${fighters[1]?.health||0}%`;$('#playerStamina').style.width=`${fighters[0]?.stamina||0}%`;$('#enemyStamina').style.width=`${fighters[1]?.stamina||0}%`;$('#fightTimer').textContent=String(Math.ceil(timeLeft)).padStart(2,'0');$('#comboReadout').textContent=combo>1?`${combo} HIT COMBO`:'';}
function inputMove(f,player,dt){let dx=0,dz=0;if(player){dx+=(pressed('d')?1:0)-(pressed('a')?1:0)+(pressed('right')?1:0)-(pressed('left')?1:0);dz+=(pressed('s')?1:0)-(pressed('w')?1:0)+(pressed('down')?1:0)-(pressed('up')?1:0);}
 else if(mode==='versus'||mode==='multi'){dx+=(pressed('arrowright')?1:0)-(pressed('arrowleft')?1:0);dz+=(pressed('arrowdown')?1:0)-(pressed('arrowup')?1:0);}
 if(dx||dz){const len=Math.hypot(dx,dz);dx/=len;dz/=len;const speed=(f.dodge>0?8.3:3.45)*(f.stamina<8?.72:1);f.root.position.x+=dx*speed*dt;f.root.position.z+=dz*speed*dt;f.walk+=dt*9;f.pose=f.dodge>0?'dodge':'walk';}
 f.root.position.x=THREE.MathUtils.clamp(f.root.position.x,-6.8,6.8);f.root.position.z=THREE.MathUtils.clamp(f.root.position.z,-5.7,5.8);
 const other=f===fighters[0]?fighters[1]:fighters[0];if(other){const dir=Math.atan2(other.root.position.x-f.root.position.x,other.root.position.z-f.root.position.z);f.root.rotation.y=THREE.MathUtils.lerp(f.root.rotation.y,dir,Math.min(1,dt*9));}
}
function cpuThink(f,other,dt){if(mode==='versus'||mode==='multi')return;f.aiThink-=dt;if(f.aiThink<=0){f.aiThink=.15+Math.random()*.23;const dx=other.root.position.x-f.root.position.x,dz=other.root.position.z-f.root.position.z,dist=Math.hypot(dx,dz);if(training){f.blocking=false;if(dist<2.4&&Math.random()<.08)beginAttack(f,'punch');return;}const difficult=$('#difficultySelect').value,agg=difficult==='hard'?.78:difficult==='easy'?.42:.61;
 if(other.attack>0&&dist<2.5&&Math.random()<(difficult==='hard'?.74:.38)){if(Math.random()<.22&&f.stamina>22){f.dodge=.28;f.pose='dodge';f.stamina-=12;}else f.blocking=true;}
 else {f.blocking=false;if(dist>1.55){f.root.position.x+=dx/(dist||1)*(difficult==='hard'?2.9:2.25)*.16;f.root.position.z+=dz/(dist||1)*(difficult==='hard'?2.9:2.25)*.16;}else if(Math.random()<agg&&f.attackCooldown<=0){const r=Math.random();beginAttack(f,r<.11&&f.stamina>38?'special':r<.4?'kick':'punch');}}
 }}
function animateFighter(f,dt){f.attack=Math.max(0,f.attack-dt);f.attackCooldown=Math.max(0,f.attackCooldown-dt);f.dodge=Math.max(0,f.dodge-dt);f.stun=Math.max(0,f.stun-dt);f.hitFlash=Math.max(0,f.hitFlash-dt);f.stamina=Math.min(100,f.stamina+dt*(f.blocking?3.5:9));if(f.player&&comboTimer>0){comboTimer-=dt;if(comboTimer<=0)combo=0;}
 const walk=f.pose==='walk'?Math.sin(f.walk)*.46:0;f.legPivots[0].rotation.x=walk;f.legPivots[1].rotation.x=-walk;f.armPivots.forEach((a,i)=>{a.rotation.x=f.blocking?-.9:f.attack>0?(f.attackType==='kick'?-.45:-1.6):walk*.55+(i===0?-.12:.12);a.rotation.z=f.blocking?(i===0?.45:-.45):f.attack>0?(i===0?-.8:.2):0;});
 f.rig.position.y=f.dodge>0?-.22:f.pose==='hit'?.06:Math.sin(elapsed*2+(f.player?0:1))*.025;f.rig.rotation.z=f.hitFlash>0?(f.player?-.18:.18):f.blocking?.06:0;f.rig.scale.setScalar(f.dodge>0?.92:1);
 if(f.attack>0){const extend=Math.sin((1-f.attack/.34)*Math.PI);f.armPivots[0].rotation.x=-1.9*extend;f.armPivots[0].rotation.z=-.85*extend;}
 const highlight=f.hitFlash>0?1:0;f.cloth.emissive.set(highlight?'#9c3120':'#000000');f.cloth.emissiveIntensity=highlight*.35;
 if(f.pose==='hit'&&f.stun<=0)f.pose='idle';else if(!f.blocking&&f.attack<=0&&f.dodge<=0&&f.pose!=='hit'&&f.pose!=='walk')f.pose='idle';}
function separate(){if(fighters.length<2)return;const [a,b]=fighters,dx=b.root.position.x-a.root.position.x,dz=b.root.position.z-a.root.position.z,d=Math.hypot(dx,dz);if(d<.95&&d>.001){const push=(.95-d)*.5;a.root.position.x-=dx/d*push;b.root.position.x+=dx/d*push;a.root.position.z-=dz/d*push;b.root.position.z+=dz/d*push;}}
function finishRound(){if(roundsWon<1){roundsWon++;round++;fighters.forEach(f=>{f.health=100;f.stamina=100;});timeLeft=90;$('#roundLabel').textContent=`ROUND ${round}`;callout('NEXT ROUND!');updateHud();return true;}return false;}
function endMatch(){if(!activeFight)return;if(mode==='training'){timeLeft=90;fighters[0].health=100;fighters[1].health=100;updateHud();callout('RESET & REPEAT');return;}activeFight=false;paused=false;const p=fighters[0],e=fighters[1];const pWin=p.health>e.health;const result=$('#resultOverlay');$('#resultEyebrow').textContent=pWin?'THE FLOOR HAS SPOKEN':'THE DEBATE CONTINUES';$('#resultTitle').innerHTML=pWin?'KURSI <em>CLAIMED</em>':'A CLOSE <em>DEBATE</em>';$('#resultCopy').textContent=pWin?`${p.c.name} held the chamber with a ${matchHits}-hit performance.`:`${e.c.name} made the final point. Time to rethink your strategy.`;$('#resultStats').innerHTML=`<span>YOUR HEALTH<b>${Math.ceil(p.health)}%</b></span><span>OPPOSITION<b>${Math.ceil(e.health)}%</b></span><span>HITS LANDED<b>${matchHits}</b></span>`;result.classList.remove('hidden');if(pWin){tone(600,.45,'triangle',.08);if(mode==='story'&&storyIndex<cast.length-2){storyIndex++;toast('STORY CHAPTER CLEARED');}if(mode==='tournament'&&tournamentIndex<cast.length-2){tournamentIndex++;toast('TOURNAMENT ROUND CLEARED');}}}

function loop(now){requestAnimationFrame(loop);const dt=Math.min(.1,(now-last)/1000);last=now;elapsed+=dt;
 if(activeFight&&!paused&&fighters.length===2){timeLeft=Math.max(0,timeLeft-dt);const [p,e]=fighters;attackKey(p,true);attackKey(e,false);inputMove(p,true,dt);inputMove(e,false,dt);cpuThink(e,p,dt);separate();for(const f of fighters)animateFighter(f,dt);
  for(const [a,b] of [[p,e],[e,p]])if(a.attack>0&&a.lastHit===0)damage(a,b,a.attackType);if(timeLeft<=0)endMatch();updateHud();
 }else{for(const f of fighters){f.walk+=dt*1.1;f.rig.position.y=Math.sin(elapsed*1.5+(f.player?0:1))*.035;f.armPivots[0].rotation.z=Math.sin(elapsed*1.7)*.06;f.armPivots[1].rotation.z=-Math.sin(elapsed*1.7)*.06;}}
 const orbit=activeFight?.14:.24;camera.position.x=Math.sin(elapsed*orbit)*.45;camera.position.y=7.1+Math.sin(elapsed*.55)*.12;camera.lookAt(0,1.15,0);rimLight.intensity=72+Math.sin(elapsed*1.2)*8;renderer.render(scene,camera);}
requestAnimationFrame(loop);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.7));});
// Selecting fighters with keyboard keeps the roster usable without a mouse.
window.addEventListener('keydown',e=>{if($('#selectScreen').classList.contains('hidden'))return;if(e.key==='ArrowRight')selectFighter(selected+1);if(e.key==='ArrowLeft')selectFighter(selected-1);});
