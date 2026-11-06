import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CHARACTERS = [
  {name:'Narendra Modi', title:'THE ORATOR', colors:['#e59b35','#f5e9d0'], skin:'#bf8768', hair:'#34312b', style:'Precision pressure · podium command', special:'Janadesh Rush', bio:'Measured footwork and commanding speeches turn into a disciplined, forward-driving game.'},
  {name:'Yogi Adityanath', title:'THE DISCIPLINARIAN', colors:['#d78932','#fff0d4'], skin:'#bd8060', hair:'#34281e', style:'Close-range pressure · iron guard', special:'House Order', bio:'A patient guard, sharp counters, and a sudden burst of saffron momentum.'},
  {name:'Nitin Gadkari', title:'THE BUILDER', colors:['#5c8b59','#eee4ce'], skin:'#bf8969', hair:'#292a26', style:'Heavy hits · unstoppable momentum', special:'Highway Charge', bio:'Builds momentum slowly, then turns the whole floor into a fast lane.'},
  {name:'Ravi Kishan', title:'THE SHOWMAN', colors:['#a24638','#f1e2c9'], skin:'#bd8062', hair:'#211d1a', style:'Flashy combos · agile counterplay', special:'Lok Sabha Spotlight', bio:'A dramatic, nimble performer who strings quick hits into crowd-pleasing combos.'},
  {name:'Lalu Prasad Yadav', title:'THE CROWD-PLEASER', colors:['#708e4e','#f4e3c9'], skin:'#b77e61', hair:'#4b4037', style:'Unpredictable feints · tricky throws', special:'Chara-Charge', bio:'Unorthodox rhythm and clever feints keep the opposition guessing.'},
  {name:'Rahul Gandhi', title:'THE LONG MARCHER', colors:['#e9e4d8','#e9e4d8'], skin:'#bc8265', hair:'#352c26', style:'Balanced · stamina and reach', special:'Bharat Step', bio:'An even-handed all-rounder with steady stamina and a long-reaching counter.'},
  {name:'Mamata Banerjee', title:'THE STREET FIGHTER', colors:['#f4f0e2','#f4f0e2'], skin:'#c68c6d', hair:'#39332b', style:'Quick evasions · rapid strikes', special:'Dharna Dash', bio:'Low-profile movement and fierce, rapid counters make her hard to pin down.'},
  {name:'Mahatma Gandhi', title:'THE PEACEFUL DEBATER', colors:['#d9cbb1','#d9cbb1'], skin:'#a87556', hair:'#aaa09a', style:'Non-violent counters · wisdom', special:'Satyagraha Stance', bio:'A playful historical-inspired non-violent style: sidesteps, gentle redirection, and a spinning walking-stick flourish.'},
  {name:'Donald Trump', title:'THE DEALMAKER', colors:['#344e74','#ece2cd'], skin:'#e0a577', hair:'#d7a643', style:'Big swings · high-risk pressure', special:'Art of the Deal', bio:'Broad, theatrical swings and a high-risk signature move built for big entrances.'}
];
const ARENAS=[
 {name:'The People’s House',tag:'CAPITAL DISTRICT',desc:'A grand parliamentary chamber with a floor built for spirited debate.',type:'parliament'},
 {name:'Monsoon Session',tag:'RIVERFRONT PAVILION',desc:'An open-air debating ground under a dramatic monsoon sky.',type:'monsoon'},
 {name:'The Constituency',tag:'OLD CITY GROUNDS',desc:'A lively neighborhood arena where the crowd is never neutral.',type:'constituency'}
];
const CHARACTER_ASSETS = {
  'Narendra Modi':'Narendra_Modi.glb',
  'Rahul Gandhi':'Rahul_Gandhi.glb',
  'Donald Trump':'Donald_Trump.glb',
  'Yogi Adityanath':'Yogi_Adityanath.glb',
  'Nitin Gadkari':'Nitin_Gadkari.glb',
  'Ravi Kishan':'Ravi_Kishan.glb',
  'Lalu Prasad Yadav':'Lalu_Prasad_Yadav.glb',
  'Mahatma Gandhi':'Mahatma_Gandhi.glb'
};
const CHARACTER_MODELS = new Map();
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={screen:'main-menu', mode:'quick', selected:0, arena:0, running:false, paused:false, ended:false, time:90, rounds:0, keys:new Set(), fighters:[], sound:true, matchNo:0, storyPos:0, training:false};
let scene,camera,renderer,clock,worldGroup,stageGroup, fightersGroup, particlesGroup, resizeObserver, audioCtx, lastTimestamp=0, toastTimer;
const mat=(color,rough=.75,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function init3d(){
  scene=new THREE.Scene(); scene.background=new THREE.Color('#171718'); scene.fog=new THREE.FogExp2('#171718',.023);
  camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,100); camera.position.set(0,7.3,17.8); camera.lookAt(0,1.15,0);
  renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:false,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
  scene.add(new THREE.HemisphereLight('#fff0d4','#322d2b',2.1));
  let key=new THREE.DirectionalLight('#ffe1a1',3.3); key.position.set(-5,10,7); key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12; scene.add(key);
  let fill=new THREE.DirectionalLight('#94a8d0',1.45);fill.position.set(6,7,-4);scene.add(fill);
  worldGroup=new THREE.Group();scene.add(worldGroup);stageGroup=new THREE.Group();worldGroup.add(stageGroup);fightersGroup=new THREE.Group();worldGroup.add(fightersGroup);particlesGroup=new THREE.Group();worldGroup.add(particlesGroup);
  clock=new THREE.Clock(); window.addEventListener('resize',onResize); renderLoop();
}
function onResize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}
function mesh(geo,material,parent,pos=[0,0,0]){let m=new THREE.Mesh(geo,material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,pos,scale,material){let m=mesh(new THREE.BoxGeometry(...scale),material,parent,pos);return m;}
function cylinder(parent,pos,r1,r2,h,material,sides=16){return mesh(new THREE.CylinderGeometry(r1,r2,h,sides),material,parent,pos);}
function sphere(parent,pos,scale,material){let m=mesh(new THREE.SphereGeometry(1,20,16),material,parent,pos);m.scale.set(...scale);return m;}
function clearGroup(g){while(g.children.length){const c=g.children.pop();g.remove(c);c.traverse?.(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});}}

function makeParliamentExterior(group){
  const sandstone=mat('#c7ad7d',.82),lightStone=mat('#e0c99a',.72),shadowStone=mat('#947a51',.88),roof=mat('#87714d',.8),glass=mat('#314452',.3,.25),gold=mat('#c9a259',.34,.4),green=mat('#55734e',.78);
  // The circular Sansad Bhavan sits on the central rear sightline, behind the fighters.
  const building=new THREE.Group();building.position.set(0,0,-9.25);group.add(building);
  cylinder(building,[0,.78,0],4.15,4.35,1.55,shadowStone,48);
  cylinder(building,[0,1.64,0],4.05,4.05,.22,lightStone,48);
  cylinder(building,[0,2.52,0],3.92,4.02,1.62,sandstone,48);
  cylinder(building,[0,3.38,0],4.02,3.92,.2,lightStone,48);
  // Repeated front-facing colonnade, capitals, and recessed dark windows.
  for(let i=0;i<19;i++){
    const x=-3.52+i*.392;
    const z=Math.sqrt(Math.max(0,3.86*3.86-x*x));
    cylinder(building,[x,2.48,z],.085,.105,1.38,lightStone,10);
    cylinder(building,[x,3.18,z],.15,.15,.1,gold,10);
    box(building,[x,2.45,z+.035],[.15,.9,.035],glass);
    box(building,[x,2.45,z+.06],[.025,.82,.018],gold);
  }
  // A low circular drum and broad dome make the silhouette unmistakably parliamentary.
  cylinder(building,[0,3.65,0],2.42,2.55,.48,lightStone,32);
  cylinder(building,[0,3.93,0],2.34,2.34,.12,gold,32);
  const dome=mesh(new THREE.SphereGeometry(2.28,40,24,0,Math.PI*2,0,Math.PI/2),mat('#a98c5c',.7),building,[0,3.96,0]);
  cylinder(building,[0,5.27,0],.17,.23,.22,gold,16);
  sphere(building,[0,5.48,0],[.14,.2,.14],gold);
  // Front steps, entrance, and Indian tricolour details.
  box(building,[0,.39,4.16],[2.5,.72,.42],lightStone);
  box(building,[0,.79,4.23],[1.45,.62,.18],roof);
  box(building,[0,1.18,4.25],[.92,.24,.08],gold);
  for(let x of [-3.35,3.35]){
    box(building,[x,3.55,3.55],[.76,.42,.045],mat('#f1eadb'));
    box(building,[x,3.65,3.58],[.76,.13,.025],mat('#e48342'));
    box(building,[x,3.45,3.58],[.76,.13,.025],green);
    sphere(building,[x,3.55,3.61],[.06,.06,.025],mat('#526f8d'));
  }
  for(let x of [-.52,.52]){
    cylinder(building,[x,2.12,4.34],.035,.035,.92,gold,8).rotation.z=x*.12;
    sphere(building,[x*1.12,2.6,4.34],[.075,.055,.06],gold);
  }
  // Crowd-filled grandstands flank the fighting lane on both sides.
  const shirts=['#a64235','#536d8b','#d1ad61','#617b55','#8b6577','#e0d4bd','#bd7045'];
  const skins=['#b77d5c','#d4a17c','#82553e','#e0b28d'];
  for(const side of [-1,1]){
    for(let row=0;row<4;row++){
      const x=side*(6.55+row*.58),z=1.3-row*1.05,y=.35+row*.34;
      box(group,[x,y-.13,z],[.78,.22,6.35],row%2?roof:shadowStone);
      for(let j=0;j<15;j++){
        const zz=-2.7+j*.43+(row%2)*.2;
        const person=new THREE.Group();person.position.set(x+side*(Math.random()*.14),y,z+zz);person.rotation.y=side===-1?.28:-.28;group.add(person);
        const shirt=mat(shirts[(j*3+row*2+(side===1?2:0))%shirts.length],.92);
        const skin=mat(skins[(j+row*2)%skins.length],.95);
        sphere(person,[0,.2,0],[.16,.22,.12],shirt);
        sphere(person,[0,.5,.015],[.135,.145,.13],skin);
        sphere(person,[0,.61,-.015],[.14,.075,.13],mat(j%4===0?'#342b26':'#4a3830',.95));
        if(j%5===0){box(person,[side*.19,.28,.02],[.025,.37,.025],gold);sphere(person,[side*.2,.49,.02],[.045,.045,.045],mat('#f5e5ad',.3));}
      }
    }
    // Gold rail and saffron/white/green standards at the aisle ends.
    box(group,[side*6.2,.72,-3.3],[.08,.08,6.8],gold);
    const pole=cylinder(group,[side*7.75,2.25,-3.45],.035,.035,3.8,gold,8);
    box(group,[side*7.75,3.3,-3.45],[.72,.44,.035],mat('#f2e9d8'));
    box(group,[side*7.75,3.44,-3.45],[.72,.14,.025],mat('#e48342'));
    box(group,[side*7.75,3.16,-3.45],[.72,.14,.025],green);
    sphere(group,[side*7.75,3.3,-3.42],[.055,.055,.025],mat('#526f8d'));
  }
}

function makeStage(arenaIndex=0){clearGroup(stageGroup);let kind=ARENAS[arenaIndex].type;
 const floorMat=mat(kind==='monsoon'?'#46534b':kind==='constituency'?'#47443e':'#504233',.42,.16),gold=mat('#b88a45',.32,.56),wood=mat('#553b28',.5),dark=mat('#252626',.72),cream=mat('#c5b99c',.68),red=mat('#8d3430',.7),green=mat('#46634b',.72);
 let floor=mesh(new THREE.CylinderGeometry(8.7,8.7,.3,64),floorMat,stageGroup,[0,-.18,0]);floor.receiveShadow=true;
 let ring=mesh(new THREE.TorusGeometry(7.85,.075,8,90),gold,stageGroup,[0,.02,0]);ring.rotation.x=Math.PI/2;
 let inner=mesh(new THREE.CylinderGeometry(4.5,4.5,.04,64),mat('#65523a',.52),stageGroup,[0,-.005,0]);
 for(let r=1;r<5;r++){let line=mesh(new THREE.TorusGeometry(r*.88,.018,5,50),mat('#b78a47',.55,.25),stageGroup,[0,.025,0]);line.rotation.x=Math.PI/2;}
 if(kind==='parliament') makeParliamentExterior(stageGroup);
 else {
 // audience bowl, benches, and repeating stylized spectators
 for(let row=0;row<4;row++){
   let radius=8.1-row*.78, y=.28+row*.43;
   let bench=mesh(new THREE.TorusGeometry(radius,.22,6,96),row%2?wood:dark,stageGroup,[0,y,0]);bench.rotation.x=Math.PI/2;
   for(let j=0;j<52;j++){let a=j/52*Math.PI*2;let color=['#c59b72','#6e8292','#a65946','#8f9b72','#d0b779','#6c606d'][j%6];
     let x=Math.cos(a)*radius,z=Math.sin(a)*radius;let person=new THREE.Group();person.position.set(x,y+.13,z);person.rotation.y=-a+Math.PI/2;stageGroup.add(person);
     sphere(person,[0,.22,0],[.12,.21,.095],mat(color,.9));sphere(person,[0,.48,0],[.115,.12,.11],mat(['#b78361','#d2a27d','#754c3a'][j%3],.95));
   }
 }
 // elegant chamber wall, pillars, and gallery
 for(let i=0;i<16;i++){let a=i/16*Math.PI*2,x=Math.cos(a)*9.1,z=Math.sin(a)*9.1;let p=new THREE.Group();p.position.set(x,.5,z);p.rotation.y=-a+Math.PI/2;stageGroup.add(p);cylinder(p,[0,1.1,0],.28,.35,2.2,cream,12);cylinder(p,[0,2.25,0],.44,.44,.17,gold,12);cylinder(p,[0,.12,0],.44,.4,.18,gold,12);}
 for(let y=1.65;y<4.2;y+=.85){let arc=mesh(new THREE.TorusGeometry(9.2,.12,6,96),y>3?gold:cream,stageGroup,[0,y,0]);arc.rotation.x=Math.PI/2;}
 // podium at rear, mic cluster, lectern plaque
 let podium=new THREE.Group();podium.position.set(0,0,-5.7);stageGroup.add(podium);box(podium,[0,.55,0],[2.25,1.1,1.05],wood);box(podium,[0,1.12,.05],[2.45,.12,1.2],gold);box(podium,[0,.62,.55],[1.35,.3,.04],mat('#7f4b32'));
 for(let i=-1;i<=1;i++){cylinder(podium,[i*.28,1.65,-.08],.025,.025,.92,dark,8).rotation.z=i*.22; sphere(podium,[i*.4,2.12,-.08],[.09,.07,.07],dark);}
 // national-color inspired tricolor banners as fictional chamber decoration
 for(let x of [-7,7]){let pole=cylinder(stageGroup,[x,2.2,-4],.035,.035,4.4,gold,8);box(stageGroup,[x,3.55,-4],[.88,.5,.04],cream);box(stageGroup,[x,3.55,-3.96],[.88,.16,.03],mat('#da7b41'));box(stageGroup,[x,3.55,-4.04],[.88,.16,.03],green);sphere(stageGroup,[x,3.55,-3.92],[.09,.09,.04],mat('#537c9e'));}
 // ceiling rings and warm lamps
 for(let i=0;i<9;i++){let x=(i-4)*1.8;let lamp=mesh(new THREE.SphereGeometry(.14,12,10),mat('#ffd990',.2,.1),stageGroup,[x,5.1,-2]);let light=new THREE.PointLight('#ffd18c',.9,8);light.position.copy(lamp.position);stageGroup.add(light);}
 // floor edge decorative stairs / furniture along rear edge
 for(let i=-5;i<=5;i++){box(stageGroup,[i*1.1,.38,-7.3],[.85,.6,.7],i%2?wood:dark);box(stageGroup,[i*1.1,.72,-7.3],[.9,.09,.76],gold);}
 // open arena mood for alternatives
 if(kind!=='parliament'){
   const sky=mesh(new THREE.SphereGeometry(28,32,20),new THREE.MeshBasicMaterial({color:kind==='monsoon'?'#334b58':'#6d4532',side:THREE.BackSide}),stageGroup,[0,0,0]);
   for(let i=0;i<12;i++){let a=i/12*Math.PI*2;let pole=cylinder(stageGroup,[Math.cos(a)*8.5,2.1,Math.sin(a)*8.5],.035,.035,4.2,gold,8);let banner=box(stageGroup,[Math.cos(a)*8.5,3.15,Math.sin(a)*8.5],[.55,.8,.04],i%2?red:green);banner.rotation.y=-a;}
   for(let i=0;i<7;i++){let light=new THREE.PointLight('#e6b56c',.8,12);let a=i/7*6.28;light.position.set(Math.cos(a)*7,4,Math.sin(a)*7);stageGroup.add(light);}
 }
 }
}

function svgPortrait(c,i){
 const skin=c.skin,hair=c.hair,cloth=c.colors[0],robe=c.colors[1];
 let hairShape=i===7?`<path d="M35 41 Q30 12 56 10 Q81 12 79 42 L71 36 Q68 22 55 21 Q42 23 41 39Z" fill="${hair}"/>`:i===8?`<path d="M34 38 Q34 8 67 11 Q88 13 80 37 Q68 28 58 26 Q46 27 34 38" fill="${hair}"/>`:`<path d="M35 39 Q33 14 56 12 Q79 13 78 39 L72 32 Q56 28 41 34Z" fill="${hair}"/>`;
 let beard=[0,1,2,4,5,7].includes(i)?`<path d="M42 54 Q55 78 69 54 L66 66 Q56 75 46 65Z" fill="${hair}" opacity=".8"/>`:'';
 let glasses=(i===7||i===2)?'<g fill="none" stroke="#342f2b" stroke-width="2"><circle cx="48" cy="42" r="7"/><circle cx="64" cy="42" r="7"/><path d="M55 42h2"/></g>':'';
 return `<svg viewBox="0 0 110 150" aria-hidden="true"><ellipse cx="55" cy="141" rx="33" ry="6" fill="#000" opacity=".35"/><path d="M24 142 Q24 92 42 79 L68 79 Q88 93 86 142Z" fill="${cloth}"/><path d="M43 79 L55 105 68 79" fill="${robe}"/><path d="M53 84h4v30h-4z" fill="#d5b86d" opacity=".85"/><rect x="46" y="67" width="19" height="19" rx="8" fill="${skin}"/><ellipse cx="55" cy="44" rx="22" ry="27" fill="${skin}"/>${hairShape}<path d="M45 45h2m17 0h2" stroke="#241d1a" stroke-width="3" stroke-linecap="round"/><path d="M50 57q5 3 10 0" fill="none" stroke="#72463a" stroke-width="1.7" stroke-linecap="round"/>${beard}${glasses}<path d="M43 104h24" stroke="${robe}" stroke-width="2" opacity=".7"/></svg>`;
}
function buildCharacterGrid(){
 const grid=$('#character-grid');grid.innerHTML='';
 CHARACTERS.forEach((c,i)=>{const card=document.createElement('button');card.className='character-card';card.dataset.id=i;card.innerHTML=`<span class="card-number">0${i+1}</span><span class="card-glyph">${['✦','◆','◈','✧','❖','✦','◉','☼','★'][i]}</span><div class="card-figure">${svgPortrait(c,i)}</div><strong>${c.name}</strong><small>${c.title}</small>`;card.addEventListener('click',()=>selectCharacter(i));grid.append(card);});
}
function selectCharacter(i){state.selected=i;$$('.character-card').forEach(el=>el.classList.toggle('selected',+el.dataset.id===i));$('#continue-btn').disabled=false;$('#selection-hint').textContent=`${CHARACTERS[i].title} · ${CHARACTERS[i].special.toUpperCase()}`;let d=$('#char-detail');d.classList.add('show');d.innerHTML=`<span class="detail-kicker">FIGHTING STYLE</span><strong>${CHARACTERS[i].style}</strong><span>${CHARACTERS[i].bio}</span>`;sound('select');}
function buildArenaCards(){let grid=$('#arena-grid');grid.innerHTML='';ARENAS.forEach((a,i)=>{let b=document.createElement('button');b.className='arena-card'+(i===state.arena?' selected':'');b.innerHTML=`<div class="arena-art"></div><span class="arena-tag">${a.tag}</span><div class="arena-info"><small>ARENA 0${i+1}</small><strong>${a.name}</strong><p>${a.desc}</p></div>`;b.onclick=()=>{state.arena=i;$$('.arena-card').forEach((el,j)=>el.classList.toggle('selected',j===i));makeStage(i);sound('select')};grid.append(b)});}

const fabricMaps=new Map();
const gltfLoader=new GLTFLoader();
async function loadCharacterAssets(){
  await Promise.all(Object.entries(CHARACTER_ASSETS).map(async([name,file])=>{
    try{CHARACTER_MODELS.set(name,await gltfLoader.loadAsync(`assets/characters/${file}`));}
    catch(error){console.warn(`Could not load ${name}'s model; using the built-in figure.`,error);}
  }));
}
function initializeFighterState(root,index,player){
  Object.assign(root.userData,{index,player,health:100,stamina:100,meter:0,cooldown:0,action:'idle',actionT:0,guard:0,dodge:0,hitFlash:0,combo:0,lastHit:0,aiWait:.7,lane:0});
}
function addSuppliedModel(root,name){
  const source=CHARACTER_MODELS.get(name);if(!source)return false;
  const model=source.scene.clone(true);model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=2.28/Math.max(size.y,.001);model.scale.setScalar(scale);
  model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  root.add(model);
  const clips=new Map();
  for(const sourceClip of source.animations){
    const clip=sourceClip.clone();
    if(['MoveForward','MoveBackward'].includes(clip.name))clip.tracks=clip.tracks.filter(track=>!track.name.endsWith('.position'));
    clips.set(clip.name,clip);
  }
  root.userData.modelRoot=model;root.userData.mixer=new THREE.AnimationMixer(model);root.userData.clips=clips;root.userData.clipActions=new Map();
  setFighterAnimation(root,'Idle');
  return true;
}
function setFighterAnimation(f,clipName){
  const d=f.userData;if(!d.mixer||d.activeClip===clipName||!d.clips.has(clipName))return;
  const previous=d.clipActions.get(d.activeClip),clip=d.clips.get(clipName);
  let next=d.clipActions.get(clipName);
  if(!next){next=d.mixer.clipAction(clip);d.clipActions.set(clipName,next);}
  next.reset();next.enabled=true;next.setEffectiveWeight(1);
  if(['Idle','MoveForward','MoveBackward'].includes(clipName))next.setLoop(THREE.LoopRepeat,Infinity);
  else{next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;}
  next.fadeIn(.12).play();if(previous&&previous!==next)previous.fadeOut(.12);
  d.activeClip=clipName;
}
function fabricMaterial(color){
  if(!fabricMaps.has(color)){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,128,128);
    for(let i=0;i<128;i+=4){ctx.fillStyle=i%8?'rgba(255,255,255,.035)':'rgba(0,0,0,.045)';ctx.fillRect(i,0,2,128);ctx.fillRect(0,i,128,1);}
    for(let i=0;i<180;i++){ctx.fillStyle=i%2?'rgba(255,255,255,.025)':'rgba(0,0,0,.03)';ctx.fillRect((i*37)%128,(i*71)%128,2,2);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);fabricMaps.set(color,texture);
  }
  return new THREE.MeshStandardMaterial({map:fabricMaps.get(color),color:'#ffffff',roughness:.88});
}
function createFighter(index,player){
  const data=CHARACTERS[index],root=new THREE.Group();initializeFighterState(root,index,player);fightersGroup.add(root);
  const cloth=fabricMaterial(data.colors[0]),trim=fabricMaterial(data.colors[1]),skin=mat(data.skin,.76),hair=mat(data.hair,.86),dark=mat('#29231f',.78),shoe=mat('#282526',.68),gold=mat('#c7a355',.34,.3),white=mat('#f3e8d7',.5);
  const body=new THREE.Group();root.add(body);root.userData.body=body;
  // Tailored torso, undershirt, collar, lapels, buttons and stitched seams.
  cylinder(body,[0,.78,0],.37,.4,.72,cloth,24);cylinder(body,[0,.49,0],.39,.33,.24,trim,24);
  sphere(body,[0,1.3,0],[.45,.37,.29],cloth);sphere(body,[0,1.49,0],[.39,.13,.29],trim);
  box(body,[-.115,1.23,.281],[.16,.52,.025],trim).rotation.z=-.16;box(body,[.115,1.23,.281],[.16,.52,.025],trim).rotation.z=.16;
  box(body,[0,1.17,.302],[.055,.52,.035],gold);
  for(let y of [.98,1.16,1.34])sphere(body,[0,y,.326],[.027,.027,.018],gold);
  box(body,[-.245,1.16,.276],[.12,.16,.025],trim);box(body,[.245,1.16,.276],[.12,.16,.025],trim);
  cylinder(body,[0,1.65,0],.15,.16,.2,skin,16);
  const head=new THREE.Group();head.position.set(0,1.91,0);body.add(head);root.userData.head=head;
  sphere(head,[0,0,0],[.315,.37,.29],skin);
  sphere(head,[0,.265,-.015],[.326,.155,.29],hair);
  // Ears, cheek structure and a bridge/tip to give the face more sculpted volume.
  for(const side of [-1,1]){
    sphere(head,[side*.307,-.015,.005],[.065,.105,.075],skin);
    sphere(head,[side*.13,-.055,.217],[.105,.075,.045],skin);
    sphere(head,[side*.122,.055,.258],[.064,.045,.033],white);
    sphere(head,[side*.122,.055,.285],[.025,.028,.015],dark);
    let brow=box(head,[side*.122,.128,.26],[.12,.025,.035],hair);brow.rotation.z=side*-.08;
  }
  sphere(head,[0,.015,.29],[.065,.105,.067],skin);sphere(head,[0,-.12,.278],[.092,.027,.025],mat('#79463d'));
  // Distinct public-persona silhouettes: beard, monk-shaved head, glasses, bun, or comb-over.
  if(index===7){
    sphere(head,[0,.17,-.015],[.314,.225,.29],skin);
    for(let side of [-1,1]){let lens=mesh(new THREE.TorusGeometry(.105,.014,8,24),gold,head,[side*.12,.055,.3]);sphere(head,[side*.12,.055,.3],[.09,.075,.012],new THREE.MeshStandardMaterial({color:'#d8e6e5',transparent:true,opacity:.2,roughness:.2}));}
    box(body,[0,.83,.3],[.028,.55,.025],mat('#ad9b7a'));
  }else if(index===8){
    sphere(head,[0,.29,-.01],[.35,.13,.31],mat('#d7aa4a'));
    let sweep=sphere(head,[.06,.34,-.03],[.29,.085,.29],hair);sweep.rotation.z=-.08;
  }else if(index===1){
    sphere(head,[0,.25,-.01],[.318,.16,.29],skin); // close-shaved scalp
    sphere(head,[0,-.2,.1],[.22,.13,.21],hair);
  }else if(index===6){
    sphere(head,[0,.31,-.07],[.13,.14,.12],hair);
  }else if(index===0||index===4||index===5){
    sphere(head,[0,-.18,.075],[.235,.17,.22],hair);
    if(index===0)sphere(head,[0,.28,-.04],[.32,.1,.29],mat('#e3dfd5'));
  }
  if(index===2||index===4){
    for(let side of [-1,1]){mesh(head,new THREE.TorusGeometry(.09,.014,7,20),gold,[side*.12,.055,.3]);box(head,[side*.12,.055,.3],[.15,.012,.012],dark);}
  }
  if(index===3||index===2)sphere(head,[0,-.105,.29],[.18,.055,.055],hair); // moustache
  if(index===6){sphere(head,[0,.34,-.04],[.17,.1,.15],hair);}
  // Articulated shoulder, elbow, wrist, hip and knee joints for clear action-figure motion.
  const arms=[],elbows=[],legs=[],knees=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.46,1.43,0);body.add(arm);
    sphere(arm,[0,0,0],[.205,.2,.205],trim);
    cylinder(arm,[0,-.22,0],.135,.17,.43,cloth,16);
    const elbow=new THREE.Group();elbow.position.set(0,-.43,0);arm.add(elbow);sphere(elbow,[0,0,0],[.125,.13,.13],skin);
    cylinder(elbow,[0,-.2,0],.105,.13,.39,cloth,16);
    sphere(elbow,[0,-.42,.015],[.125,.12,.13],skin);
    for(let finger=0;finger<3;finger++)sphere(elbow,[(finger-1)*.055,-.49,.07],[.035,.075,.04],skin);
    arms.push(arm);elbows.push(elbow);
    const leg=new THREE.Group();leg.position.set(side*.2,.51,0);body.add(leg);
    cylinder(leg,[0,-.21,0],.165,.2,.43,cloth,18);
    const knee=new THREE.Group();knee.position.set(0,-.43,0);leg.add(knee);sphere(knee,[0,0,.01],[.145,.14,.15],trim);
    cylinder(knee,[0,-.19,0],.12,.15,.37,trim,16);
    sphere(knee,[0,-.39,.1],[.19,.12,.29],shoe);legs.push(leg);knees.push(knee);
  }
  root.userData.arms=arms;root.userData.elbows=elbows;root.userData.legs=legs;root.userData.knees=knees;
  if(index===7){let stick=cylinder(body,[.56,.84,.05],.025,.028,1.15,mat('#8c6841'),8);stick.rotation.z=-.12;root.userData.stick=stick;}
  // Fine metallic trim and a soft contact shadow ground the collectible-figure look.
  let belt=mesh(new THREE.TorusGeometry(.34,.035,8,28),gold,body,[0,.6,0]);belt.rotation.x=Math.PI/2;
  let sh=new THREE.Mesh(new THREE.CircleGeometry(.65,32),new THREE.MeshBasicMaterial({color:'#050505',transparent:true,opacity:.32,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.008;root.add(sh);
  if(addSuppliedModel(root,data.name))body.visible=false;
  root.position.set(player===1?-2.25:2.25,0,player===1?.4:-.4);
  return root;
}
function startMatch(){
 if(state.mode==='online'){showToast('ONLINE MATCHMAKING IS NOT AVAILABLE IN THIS WEB EDITION');return;}
 clearGroup(fightersGroup);particlesGroup.clear();state.training=state.mode==='training';state.time=90;state.ended=false;state.paused=false;state.running=true;state.matchNo++;
 let second=opponentIndex();state.fighters=[createFighter(state.selected,1),createFighter(second,2)];
 state.fighters[0].userData.maxHealth=100;state.fighters[1].userData.maxHealth=100;
 $('#hud-name-1').textContent=CHARACTERS[state.selected].name.toUpperCase();$('#hud-name-2').textContent=CHARACTERS[second].name.toUpperCase();
 $('#hud-caption-1').textContent=`${state.mode==='local'?'PLAYER 1':'THE HOUSE'} · ${CHARACTERS[state.selected].title}`;$('#hud-caption-2').textContent=state.mode==='local'?'PLAYER 2 · LOCAL':'THE OPPOSITION · CPU';
 $('#main-menu').classList.remove('visible');$('#select-menu').classList.remove('visible');$('#arena-menu').classList.remove('visible');$('#fight-ui').classList.add('active');$('#pause-panel').classList.remove('active');$('#result-panel').classList.remove('active');
 makeStage(state.arena);state.fighters[0].position.x=-2.2;state.fighters[1].position.x=2.2;state.fighters[0].position.z=.3;state.fighters[1].position.z=-.3;
 announce(state.mode==='training'?'TRAINING MODE':'THE HOUSE IS IN SESSION');sound('bell');updateHud();
}
function opponentIndex(){
 if(state.mode==='story')return (state.selected+1+state.storyPos)%CHARACTERS.length;
 if(state.mode==='tournament')return (state.selected+1+state.matchNo)%CHARACTERS.length;
 return (state.selected+1+(Math.floor(Math.random()*8)))%CHARACTERS.length;
}
function announce(text){let el=$('#match-announce');el.querySelector('span').textContent=text;el.classList.add('on');setTimeout(()=>el.classList.remove('on'),1800);}
function showToast(text){let t=$('#fight-toast');t.textContent=text;t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),1600);}
function togglePause(){if(!state.running||state.ended)return;state.paused=!state.paused;$('#pause-panel').classList.toggle('active',state.paused);}
function endMatch(winner){if(state.ended)return;state.ended=true;state.running=false;let won=winner===0;$('#result-title').innerHTML=won?'POINT <em>MADE.</em>':'THE OTHER SIDE <em>WINS.</em>';$('#result-copy').textContent=state.training?'A useful practice round. Try a new move.':won?'A spirited debate, settled with style. The chamber will remember this.':'The opposition held the floor this time. The debate is far from over.';$('#winner-name').textContent=won?CHARACTERS[state.selected].name.toUpperCase():CHARACTERS[state.fighters[1].userData.index].name.toUpperCase();$('#result-record').textContent=state.mode==='story'?`STORY CHAPTER ${state.storyPos+1} · ${state.time<=0?'TIME':'KNOCKOUT'}`:state.mode==='tournament'?`TOURNAMENT MATCH ${state.matchNo} · ${state.time<=0?'DECISION':'KNOCKOUT'}`:`${state.time<=0?'DECISION':'KNOCKOUT'} · MATCH COMPLETE`;
 $('#result-panel').classList.add('active');sound(won?'win':'lose');}
function rematch(){if(state.mode==='story'&&state.ended&&state.fighters.length&&state.fighters[0].userData.health<state.fighters[1].userData.health){state.storyPos++;}$('#result-panel').classList.remove('active');startMatch();}
function updateHud(){for(let i=0;i<2;i++){let f=state.fighters[i];if(!f)continue;$('#health-'+(i+1)).style.width=Math.max(0,f.userData.health)+'%';$('#stamina-'+(i+1)).style.width=Math.max(0,f.userData.stamina)+'%';}$('#timer').textContent=Math.ceil(state.time).toString().padStart(2,'0');}
function sound(type){if(!state.sound)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let now=audioCtx.currentTime;let osc=audioCtx.createOscillator(),gain=audioCtx.createGain();let freqs={select:620,punch:170,kick:105,block:270,dodge:390,special:72,hit:120,bell:660,win:520,lose:130,menu:380};osc.type=type==='special'?'sawtooth':type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(freqs[type]||220,now);osc.frequency.exponentialRampToValueAtTime(Math.max(35,(freqs[type]||220)*.58),now+.16);gain.gain.setValueAtTime(type==='select'?.04:.085,now);gain.gain.exponentialRampToValueAtTime(.001,now+.22);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+.23);}catch(e){}}
function action(f,type){if(!state.running||state.paused||state.ended)return;let d=f.userData;if(d.cooldown>0)return;
 if(type==='block'){d.guard=.22;d.action='block';d.actionT=.22;return;}
 if(type==='dodge'){if(d.stamina<14)return;d.stamina-=14;d.dodge=.32;d.action='dodge';d.actionT=.32;d.cooldown=.25;sound('dodge');return;}
 if(type==='special'){if(d.meter<100||d.stamina<25){if(f===state.fighters[0])showToast(d.meter<100?'BUILD SPECIAL METER BY LANDING HITS':'NEED MORE STAMINA');return;}d.meter=0;d.stamina-=25;d.action='special';d.actionT=.7;d.cooldown=.75;sound('special');showToast(CHARACTERS[d.index].special.toUpperCase());emitBurst(f.position,CHARACTERS[d.index].colors[0]);resolveAttack(f,1.8,true);return;}
 if(type!=='punch'&&type!=='kick')return;
 let heavy=type==='kick';if(d.stamina<(heavy?13:7))return;d.stamina-=heavy?13:7;d.action=type;d.actionT=heavy?.42:.28;d.cooldown=heavy?.43:.27;d.combo=d.lastHit>Date.now()-900?d.combo+1:1;d.lastHit=Date.now();sound(type);resolveAttack(f,heavy?1.12:.9,false);
}
function resolveAttack(f,multiplier,special){let target=state.fighters[1-f.userData.player+1]||state.fighters[f.userData.player===1?1:0];if(!target)return;let d=f.userData,t=target.userData;let distance=f.position.distanceTo(target.position);if(distance>(special?3.2:2.05))return;let toward=target.position.clone().sub(f.position).normalize();let facing=new THREE.Vector3(Math.sin(f.rotation.y),0,Math.cos(f.rotation.y));if(facing.dot(toward)<-.15)return;
 if(t.dodge>0)return;let heavy=d.action==='kick'||d.action==='special';let damage=(special?28:heavy?15:9)*multiplier*(1+Math.min(d.combo,3)*.035);if(t.guard>0){damage*=.24;t.stamina=Math.max(0,t.stamina-12);spawnImpact(target.position,'#d7c58c',true);sound('block');}else{t.health=Math.max(0,t.health-damage);t.action='hit';t.actionT=.34;t.hitFlash=.18;t.stamina=Math.max(0,t.stamina-4);target.userData.meter=Math.min(100,target.userData.meter+9);d.meter=Math.min(100,d.meter+(special?0:heavy?17:11));target.position.addScaledVector(toward,heavy?.47:.23);spawnImpact(target.position,heavy?'#ed9a4f':'#e9d8b7',false);sound('hit');if(f===state.fighters[0])showToast(d.combo>1?`${d.combo} HIT COMBO!`:'NICE HIT!');}
 updateHud();if(t.health<=0&&!state.training)endMatch(f.userData.player===1?0:1);if(state.training&&t.health<25){t.health=100;t.meter=Math.min(100,t.meter+15);showToast('PRACTICE TARGET RESET');} }
function getActionInput(player){let k=state.keys;if(player===1){return{move:new THREE.Vector3((k.has('d')?1:0)-(k.has('a')?1:0),0,(k.has('s')?1:0)-(k.has('w')?1:0)),block:k.has('l')||k.has('shift'),punch:k.has('j'),kick:k.has('k'),dodge:k.has(' '),special:k.has('e')};}
 return{move:new THREE.Vector3((k.has('arrowright')?1:0)-(k.has('arrowleft')?1:0),0,(k.has('arrowdown')?1:0)-(k.has('arrowup')?1:0)),block:k.has('3')||k.has('rightshift'),punch:k.has('1'),kick:k.has('2'),dodge:k.has('enter'),special:k.has('0')};}
function runInput(f,dt){let p=f.userData.player,d=f.userData,input=getActionInput(p);if(p===2&&state.mode!=='local'){runAI(f,state.fighters[0],dt);return;}
 if(input.move.lengthSq()>.01){let m=input.move.normalize();let opponent=state.fighters.find(x=>x!==f);d.moveForward=!opponent||m.x*(opponent.position.x>=f.position.x?1:-1)>=0;f.position.addScaledVector(m,dt*(d.dodge>0?7:3.4));f.position.x=THREE.MathUtils.clamp(f.position.x,-5.7,5.7);f.position.z=THREE.MathUtils.clamp(f.position.z,-3.9,3.8);if(d.action==='idle'||d.action==='walk')d.action='walk';}else if(d.action==='walk')d.action='idle';
 if(input.block)action(f,'block');else if(input.special)action(f,'special');else if(input.punch)action(f,'punch');else if(input.kick)action(f,'kick');else if(input.dodge)action(f,'dodge');
}
function runAI(cpu,player,dt){let d=cpu.userData,dist=cpu.position.distanceTo(player.position);d.aiWait-=dt;
 if(player.userData.action==='punch'||player.userData.action==='kick'||player.userData.action==='special'){
  if(d.aiWait<=0&&dist<2.8&&Math.random()<.54){if(Math.random()<.56)action(cpu,'block');else action(cpu,'dodge');d.aiWait=.28+Math.random()*.38;return;}}
 if(d.aiWait<=0){if(d.meter>=100&&dist<3.1&&Math.random()<.48)action(cpu,'special');else if(dist<1.85){let r=Math.random();if(r<.39)action(cpu,'punch');else if(r<.72)action(cpu,'kick');else action(cpu,'block');}else if(Math.random()<.18)action(cpu,'dodge');d.aiWait=.38+Math.random()*.6;}
 if(dist>1.55&&d.action!=='special'&&d.action!=='kick'){let toward=player.position.clone().sub(cpu.position);toward.y=0;toward.normalize();d.moveForward=true;cpu.position.addScaledVector(toward,dt*1.65);cpu.position.x=THREE.MathUtils.clamp(cpu.position.x,-5.5,5.5);cpu.position.z=THREE.MathUtils.clamp(cpu.position.z,-3.6,3.6);if(d.action==='idle')d.action='walk';}else if(d.action==='walk')d.action='idle';
}
function animateFighter(f,dt,time){let d=f.userData,body=d.body,arms=d.arms,elbows=d.elbows,legs=d.legs,knees=d.knees;d.cooldown=Math.max(0,d.cooldown-dt);d.guard=Math.max(0,d.guard-dt);d.dodge=Math.max(0,d.dodge-dt);d.actionT=Math.max(0,d.actionT-dt);d.hitFlash=Math.max(0,d.hitFlash-dt);d.stamina=Math.min(100,d.stamina+dt*(d.action==='idle'?8:4));
 let opponent=state.fighters.find(x=>x!==f);if(opponent){let target=opponent.position.x-f.position.x;f.rotation.y=THREE.MathUtils.lerp(f.rotation.y,target>=0?Math.PI/2:-Math.PI/2,Math.min(1,dt*8));}
 if(d.mixer){
  const clips={idle:'Idle',walk:d.moveForward===false?'MoveBackward':'MoveForward',punch:'Punch',kick:'Kick',special:'Combo',block:'Block',dodge:'Dodge',hit:'Knockout'};
  setFighterAnimation(f,clips[d.action]||'Idle');d.mixer.update(dt);
  if(d.actionT<=0&&['punch','kick','special','hit','dodge','block'].includes(d.action))d.action='idle';
  return;
 }
 let walk=d.action==='walk',swing=0;if(d.action==='punch')swing=1-d.actionT/.28;if(d.action==='kick')swing=1-d.actionT/.42;if(d.action==='special')swing=1-d.actionT/.7;
 const gait=time*9+(f===state.fighters[1]?1:0),stepA=walk?Math.sin(gait):0,stepB=walk?Math.sin(gait+Math.PI):0;
 body.position.y=walk?Math.abs(Math.sin(time*10+(f===state.fighters[1]?1:0)))*.07:Math.sin(time*2.2+(d.player*2))*.018;
 body.rotation.x=0;body.rotation.y=0;body.rotation.z=d.action==='hit'?Math.sin(time*40)*.14:d.action==='dodge'?Math.sin(time*25)*.21:0;
 legs[0].rotation.x=stepA*.45;legs[1].rotation.x=stepB*.45;
 knees[0].rotation.x=Math.max(0,-stepA)*.5;knees[1].rotation.x=Math.max(0,-stepB)*.5;
 arms[0].rotation.x=stepB*.12;arms[1].rotation.x=stepA*.12;arms[0].rotation.z=0;arms[1].rotation.z=0;elbows[0].rotation.x=0;elbows[1].rotation.x=0;
 if(d.action==='block'||d.guard>0){arms[0].rotation.x=-1.05;arms[1].rotation.x=-1.05;arms[0].rotation.z=.42;arms[1].rotation.z=-.42;elbows[0].rotation.x=-.42;elbows[1].rotation.x=-.42;}
 if(d.action==='punch'){let extension=Math.sin(Math.min(1,swing)*Math.PI*.5);arms[0].rotation.x=-extension*1.6;arms[0].rotation.z=-extension*.1;elbows[0].rotation.x=-extension*.25;arms[1].rotation.x=.18;}
 if(d.action==='kick'){let extension=Math.sin(Math.min(1,swing)*Math.PI*.5);legs[0].rotation.x=-extension*1.4;knees[0].rotation.x=extension*.32;arms[1].rotation.x=-.7;elbows[1].rotation.x=-.25;}
 if(d.action==='special'){let flourish=Math.sin(Math.min(1,swing)*Math.PI);arms[0].rotation.x=-swing*1.8;arms[1].rotation.x=-swing*1.8;elbows[0].rotation.x=-flourish*.35;elbows[1].rotation.x=-flourish*.35;body.rotation.y=Math.sin(swing*Math.PI)*.3;}
 if(d.action==='dodge'){body.rotation.x=.2;body.position.x=Math.sin(time*24)*.15;}
 if(d.action==='hit'){body.rotation.z=.24;}
 if(d.actionT<=0&&['punch','kick','special','hit','dodge','block'].includes(d.action)){d.action='idle';body.rotation.x=0;body.position.x=0;body.rotation.y=0;}
}
function updateGame(dt,time){if(!state.running||state.paused||state.ended)return;state.time=Math.max(0,state.time-dt);if(state.time===0){let a=state.fighters[0].userData.health,b=state.fighters[1].userData.health;endMatch(a>=b?0:1);}
 state.fighters.forEach((f,i)=>{if(i===0||state.mode==='local')runInput(f,dt);else runAI(f,state.fighters[0],dt);animateFighter(f,dt,time);});
 for(let i=particlesGroup.children.length-1;i>=0;i--){let p=particlesGroup.children[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.vel,dt);p.userData.vel.y-=5*dt;p.scale.multiplyScalar(.985);if(p.userData.life<=0){particlesGroup.remove(p);p.geometry.dispose();p.material.dispose();}}
 updateHud();}
function renderLoop(){requestAnimationFrame(renderLoop);let dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;updateGame(dt,t);
 if(!state.running&&!state.paused)state.fighters.forEach(f=>{if(f.userData.mixer){setFighterAnimation(f,'Idle');f.userData.mixer.update(dt);}});
 if(state.fighters.length===2&&state.running){let mid=state.fighters[0].position.clone().add(state.fighters[1].position).multiplyScalar(.5),separation=Math.abs(state.fighters[0].position.x-state.fighters[1].position.x);let desired=V(mid.x*.13,5.6,14.5+separation*.45);camera.position.lerp(desired,dt*1.2);camera.lookAt(mid.x*.15,.95,0);}
 renderer.render(scene,camera);}

function showScreen(name){$$('.screen').forEach(el=>el.classList.toggle('visible',el.id===name));state.screen=name;}
function showSelect(){showScreen('select-menu');state.mode=$('#mode-select').value;selectCharacter(state.selected);}
function bindUI(){
 $('#play-btn').onclick=()=>{showSelect();sound('menu')};$('#how-btn').onclick=()=>$('#how-panel').classList.add('active');$('#how-close').onclick=()=>$('#how-panel').classList.remove('active');
 $$('[data-back]').forEach(b=>b.onclick=()=>showScreen(b.dataset.back));$('#continue-btn').onclick=()=>{state.mode=$('#mode-select').value;if(state.mode==='online'){showToast('ONLINE MATCHMAKING NEEDS A SERVER. PLAY LOCAL 1V1 OR CPU IN THIS WEB EDITION.');return;}showScreen('arena-menu');buildArenaCards();makeStage(state.arena);sound('menu');};
 $('#mode-select').onchange=e=>{state.mode=e.target.value;if(state.mode==='online'){showToast('ONLINE MULTIPLAYER IS NOT CONNECTED IN THIS BUILD');}else if(state.mode==='local')$('#selection-hint').textContent='LOCAL 1V1 · PLAYER 2 JOINS ON KEYBOARD';else if(state.mode==='training')$('#selection-hint').textContent='TRAINING · PRACTICE MOVES AGAINST A RESETTING TARGET';else if(state.mode==='story')$('#selection-hint').textContent='STORY MODE · FACE THE ROSTER ONE DEBATE AT A TIME';else if(state.mode==='tournament')$('#selection-hint').textContent='TOURNAMENT · RANDOM DRAW, CPU OPPONENTS';};
 $('#fight-btn').onclick=startMatch;$('#pause-btn').onclick=togglePause;$('#resume-btn').onclick=togglePause;$('#restart-btn').onclick=startMatch;
 $('#quit-btn').onclick=()=>{state.running=false;state.fighters=[];clearGroup(fightersGroup);$('#fight-ui').classList.remove('active');$('#pause-panel').classList.remove('active');showScreen('main-menu');makeStage(0);state.fighters=[createFighter(0,1),createFighter(8,2)];state.fighters[0].position.set(1.6,0,0);state.fighters[1].position.set(4.2,0,-.8);};
 $('#rematch-btn').onclick=rematch;$('#result-menu-btn').onclick=()=>{$('#result-panel').classList.remove('active');$('#fight-ui').classList.remove('active');state.running=false;state.fighters=[];clearGroup(fightersGroup);showScreen('main-menu');makeStage(0);state.fighters=[createFighter(0,1),createFighter(8,2)];state.fighters[0].position.set(1.6,0,0);state.fighters[1].position.set(4.2,0,-.8);};
 $('#sound-toggle').onclick=toggleSound;$('#select-sound').onclick=toggleSound;$('#arena-sound').onclick=toggleSound;
 window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='escape'){if($('#how-panel').classList.contains('active'))$('#how-panel').classList.remove('active');else togglePause();return;}state.keys.add(k);});window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>state.keys.clear());
 $$('.action-pad [data-action]').forEach(b=>{let actionName=b.dataset.action,down=()=>{let map={punch:'j',kick:'k',block:'l',dodge:' ',special:'e'};let key=map[actionName];state.keys.add(key);if(actionName==='punch'||actionName==='kick'||actionName==='special'||actionName==='dodge')action(state.fighters[0],actionName);},up=()=>{let map={punch:'j',kick:'k',block:'l',dodge:' ',special:'e'};state.keys.delete(map[actionName]);};b.addEventListener('pointerdown',e=>{e.preventDefault();down()});b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);});
 $$('.move-pad [data-action]').forEach(b=>{let map={up:'w',down:'s',left:'a',right:'d'},key=map[b.dataset.action];b.addEventListener('pointerdown',e=>{e.preventDefault();state.keys.add(key)});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>state.keys.delete(key)));});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.running&&!state.paused)togglePause();});
}
function toggleSound(){state.sound=!state.sound;$('#sound-toggle').innerHTML=state.sound?'♫ <span>SOUND ON</span>':'♫ <span>SOUND OFF</span>';sound(state.sound?'select':'');}
async function boot(){init3d();makeStage(0);buildCharacterGrid();buildArenaCards();bindUI();await loadCharacterAssets();state.fighters=[createFighter(0,1),createFighter(8,2)];state.fighters[0].position.set(1.8,0,0);state.fighters[1].position.set(4.5,0,-.8);setTimeout(()=>$('#loading').classList.add('done'),550);setTimeout(()=>$('#loading').remove(),1200);}
boot().catch(error=>{console.error('Sansad Showdown could not start.',error);$('#loading').classList.add('done');});
function spawnImpact(pos,color,guard){for(let i=0;i<(guard?7:13);i++){let m=mesh(new THREE.SphereGeometry(.045+Math.random()*.06,7,6),mat(color,.45),particlesGroup,[pos.x,pos.y+1+Math.random()*.8,pos.z]);let a=Math.random()*Math.PI*2,s=.7+Math.random()*2.2;m.userData.vel=V(Math.cos(a)*s,Math.random()*2,s*Math.sin(a));m.userData.life=.35+Math.random()*.3;}}
function emitBurst(pos,color){for(let i=0;i<38;i++){let m=mesh(new THREE.SphereGeometry(.04+Math.random()*.08,6,5),mat(color,.45),particlesGroup,[pos.x,pos.y+.4+Math.random()*1.8,pos.z]);let a=Math.random()*6.28,s=.8+Math.random()*4;m.userData.vel=V(Math.cos(a)*s,Math.random()*3,s*Math.sin(a));m.userData.life=.45+Math.random()*.6;}}
