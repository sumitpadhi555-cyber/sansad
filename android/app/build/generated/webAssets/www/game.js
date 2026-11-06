import * as THREE from 'three';

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
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={screen:'main-menu', mode:'quick', selected:0, arena:0, running:false, paused:false, ended:false, time:90, rounds:0, keys:new Set(), fighters:[], sound:true, matchNo:0, storyPos:0, training:false};
let scene,camera,renderer,clock,worldGroup,stageGroup, fightersGroup, particlesGroup, resizeObserver, audioCtx, lastTimestamp=0, toastTimer;
const mat=(color,rough=.75,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

function init3d(){
  scene=new THREE.Scene(); scene.background=new THREE.Color('#332b25'); scene.fog=new THREE.FogExp2('#493d31',.008);
  camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,120); camera.position.set(0,7.3,17.8); camera.lookAt(0,1.15,0);
  renderer=new THREE.WebGLRenderer({canvas:$('#scene'),antialias:true,alpha:false,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.8)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
  scene.add(new THREE.HemisphereLight('#fff0d4','#322d2b',2.35));
  let key=new THREE.DirectionalLight('#ffe1a1',3.8); key.position.set(-5,10,7); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12; scene.add(key);
  let fill=new THREE.DirectionalLight('#94a8d0',1.65);fill.position.set(6,7,-4);scene.add(fill);
  worldGroup=new THREE.Group();scene.add(worldGroup);stageGroup=new THREE.Group();worldGroup.add(stageGroup);fightersGroup=new THREE.Group();worldGroup.add(fightersGroup);particlesGroup=new THREE.Group();worldGroup.add(particlesGroup);
  clock=new THREE.Clock(); window.addEventListener('resize',onResize); renderLoop();
}
function onResize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}
function mesh(geo,material,parent,pos=[0,0,0]){let m=new THREE.Mesh(geo,material);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,pos,scale,material){let m=mesh(new THREE.BoxGeometry(...scale),material,parent,pos);return m;}
function cylinder(parent,pos,r1,r2,h,material,sides=16){return mesh(new THREE.CylinderGeometry(r1,r2,h,sides),material,parent,pos);}
function sphere(parent,pos,scale,material){let m=mesh(new THREE.SphereGeometry(1,20,16),material,parent,pos);m.scale.set(...scale);return m;}
function clearGroup(g){while(g.children.length){const c=g.children.pop();g.remove(c);c.traverse?.(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});}}

function makeStage(arenaIndex=0){
  clearGroup(stageGroup);const kind=ARENAS[arenaIndex].type;
  const gold=mat('#c6a15b',.3,.52),wood=mat('#49352b',.56),dark=mat('#292b2e',.72),cream=mat('#d5c6a7',.74),stone=mat('#b9966b',.88);
  const floor=mesh(new THREE.CylinderGeometry(8.7,8.7,.34,96),mat(kind==='monsoon'?'#384d4b':kind==='constituency'?'#443b35':'#51473c',.48,.12),stageGroup,[0,-.18,0]);floor.receiveShadow=true;
  const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=256;const ctx=textureCanvas.getContext('2d');ctx.fillStyle='#81715f';ctx.fillRect(0,0,256,256);
  for(let i=0;i<1800;i++){const n=Math.random()*80;ctx.fillStyle=`rgba(${n|0},${n|0},${n|0},.17)`;ctx.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,1+Math.random()*2);}
  const floorTexture=new THREE.CanvasTexture(textureCanvas);floorTexture.colorSpace=THREE.SRGBColorSpace;floorTexture.wrapS=floorTexture.wrapT=THREE.RepeatWrapping;floorTexture.repeat.set(5,5);floor.material.map=floorTexture;floor.material.needsUpdate=true;
  for(let r=1;r<6;r++){const line=mesh(new THREE.TorusGeometry(r*1.05,.018,6,72),r===5?gold:mat('#9a815c',.65,.18),stageGroup,[0,.025,0]);line.rotation.x=Math.PI/2;}
  const outer=mesh(new THREE.TorusGeometry(7.9,.09,10,112),gold,stageGroup,[0,.02,0]);outer.rotation.x=Math.PI/2;
  // Open-air grandstands put a lively audience on both sides of the playable floor.
  for(const side of [-1,1]){
    for(let row=0;row<4;row++){
      const x=side*(6.4+row*.62),y=.32+row*.42;
      box(stageGroup,[x,y-.16,0],[.5,.28,13.8],row%2?wood:dark);box(stageGroup,[x-side*.19,y+.02,0],[.075,.12,13.8],gold);
      for(let j=0;j<31;j++){
        const z=-6.1+j*.405,color=['#a85743','#536d7a','#82905f','#c79a57','#695b70','#e0d0b2'][(j*7+row*3+(side>0?2:0))%6];
        const person=new THREE.Group();person.position.set(x,y,z);person.rotation.y=side<0?Math.PI/2:-Math.PI/2;stageGroup.add(person);
        sphere(person,[0,.23,0],[.13,.22,.11],mat(color,.9));sphere(person,[0,.51,0],[.12,.13,.12],mat(['#b78361','#d2a27d','#754c3a','#d7ad8a'][(j+row)%4],.92));
        if(j%5===0){const arm=sphere(person,[.14,.36,0],[.055,.23,.06],mat(color,.9));arm.rotation.z=-.42;}
      }
    }
    box(stageGroup,[side*6.05,1.45,0],[.08,.08,14.4],gold);
    for(let z=-6.8;z<=6.8;z+=1.7)cylinder(stageGroup,[side*6.05,.82,z],.045,.045,1.25,gold,8);
  }
  // Sansad Bhavan: circular sandstone colonnade, central dome, and front entrance behind the players.
  const building=new THREE.Group();building.position.set(0,0,-10.2);stageGroup.add(building);
  cylinder(building,[0,.42,0],5.35,5.35,.84,stone,64);cylinder(building,[0,1.75,0],4.95,4.75,2.15,cream,64);
  cylinder(building,[0,2.92,0],5.12,5.12,.28,gold,64);cylinder(building,[0,3.18,0],4.85,4.85,.26,stone,64);
  for(let i=0;i<48;i++){
    const a=i/48*Math.PI*2,x=Math.sin(a)*4.84,z=Math.cos(a)*4.84;if(z<-.2)continue;
    const col=new THREE.Group();col.position.set(x,.55,z);col.rotation.y=a;building.add(col);
    cylinder(col,[0,.96,0],.105,.13,1.92,cream,12);cylinder(col,[0,1.95,0],.19,.19,.12,gold,12);cylinder(col,[0,.07,0],.18,.16,.13,gold,12);
    box(building,[Math.sin(a)*4.79,1.73,Math.cos(a)*4.79],[.34,.66,.07],mat('#4b5150',.35,.1));
  }
  mesh(new THREE.SphereGeometry(2.15,40,24,0,Math.PI*2,0,Math.PI/2),mat('#c4a16f',.68),building,[0,3.3,0]);
  cylinder(building,[0,3.28,0],2.17,2.17,.16,gold,48);cylinder(building,[0,5.47,0],.18,.24,.25,gold,16);sphere(building,[0,5.72,0],[.13,.18,.13],gold);
  for(let i=0;i<5;i++)box(building,[0,.12+i*.1,5.12-i*.18],[2.3-i*.22,.12,.46],i%2?cream:stone);
  box(building,[0,1.18,4.92],[1.25,1.35,.12],dark);box(building,[0,1.17,4.84],[.86,1.04,.04],mat('#8c6841',.58));
  sphere(building,[0,2.45,4.86],[.31,.31,.09],gold);for(let i=0;i<12;i++){const a=i/12*Math.PI*2,ray=box(building,[Math.cos(a)*.23,2.45+Math.sin(a)*.23,4.75],[.025,.13,.025],gold);ray.rotation.z=a;}
  for(const side of [-1,1]){const light=new THREE.SpotLight('#ffd99a',90,24,Math.PI/5,.55,1.3);light.position.set(side*7,5,-4);light.target.position.set(side*2,2,-9);stageGroup.add(light,light.target);}
  for(let i=0;i<7;i++){const light=new THREE.PointLight('#efbd70',1.25,10);light.position.set((i-3)*2.1,4.6,-7.6);stageGroup.add(light);}
  for(const x of [-8.7,8.7]){cylinder(stageGroup,[x,2.1,-7],.045,.045,4.2,gold,10);box(stageGroup,[x,3.45,-7],[.78,.52,.05],cream);box(stageGroup,[x,3.56,-6.96],[.78,.17,.03],mat('#da7b41'));box(stageGroup,[x,3.39,-7.04],[.78,.17,.03],mat('#46634b'));sphere(stageGroup,[x,3.39,-6.92],[.07,.07,.03],mat('#537c9e'));}
  if(kind!=='parliament')for(const side of [-1,1])for(let i=0;i<4;i++){const banner=box(stageGroup,[side*(8.4+i*.18),2.3,-1.7+i*1.15],[.06,.68,.44],i%2?mat('#8d3430'):mat('#46634b'));banner.rotation.z=side*.08;}
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

function createFighter(index,player){
 const data=CHARACTERS[index],root=new THREE.Group();root.userData={index,player};fightersGroup.add(root);
 const cloth=mat(data.colors[0],.86),trim=mat(data.colors[1],.82),skin=mat(data.skin,.78),hair=mat(data.hair,.9),dark=mat('#29231f',.76),shoe=mat('#282526',.72),gold=mat('#c7a355',.34,.3);
 const body=new THREE.Group();root.add(body);root.userData.body=body;
 // Sculpted tunic and jacket with a distinct waist, collar, lapels, and buttons.
 cylinder(body,[0,.78,0],.37,.42,.77,cloth,20);cylinder(body,[0,.49,0],.405,.34,.2,trim,20);
 sphere(body,[0,1.3,0],[.45,.37,.29],cloth);sphere(body,[0,1.49,.015],[.37,.14,.29],trim);
 box(body,[0,1.19,.292],[.075,.52,.035],gold);
 for(const s of [-1,1]){const lapel=box(body,[s*.105,1.39,.29],[.12,.28,.035],trim);lapel.rotation.z=s*.28;for(let y of [.91,1.08,1.25])sphere(body,[s*.16,y,.292],[.022,.022,.018],gold);}
 if(index===5){for(const s of [-1,1])box(body,[s*.31,1.25,.17],[.035,.52,.22],dark);}
 if(index===6){const border=mat('#7392a1',.84);cylinder(body,[0,.54,0],.409,.35,.075,border,20);box(body,[.23,1.16,.31],[.055,.61,.025],border);}
 if(index===7){cylinder(body,[0,.76,0],.39,.43,.72,mat('#d7c7a7',.96),20);box(body,[0,1.2,.32],[.27,.64,.035],mat('#e5d9c2',.95));}
 if(index===8)box(body,[0,1.2,.326],[.13,.53,.04],mat('#ad302d',.56));
 const head=new THREE.Group();head.position.set(0,1.92,0);body.add(head);root.userData.head=head;
 sphere(head,[0,0,0],[.32,.39,.3],skin);
 // Sculpted ears, cheeks, chin, nose and inset eyes give each face more dimensionality.
 for(let s of [-1,1]){sphere(head,[s*.319,-.015,0],[.07,.105,.075],skin);sphere(head,[s*.17,-.09,.205],[.13,.12,.105],skin);}
 sphere(head,[0,-.22,.17],[.19,.105,.17],skin);sphere(head,[0,-.015,.302],[.052,.075,.052],skin);
 for(let s of [-1,1]){sphere(head,[s*.12,.065,.269],[.053,.042,.026],mat('#efe4d4'));sphere(head,[s*.12,.065,.292],[.021,.027,.014],dark);}
 box(head,[0,-.135,.286],[.105,.018,.012],mat('#72483d'));
 // Individual silhouettes: monk's close crop, Mamata's bun, Gandhi's bald head, Trump's side sweep.
 if(index===7)sphere(head,[0,.17,0],[.319,.2,.29],skin);
 else if(index===1)sphere(head,[0,.265,0],[.32,.105,.29],skin);
 else if(index===8){sphere(head,[0,.25,-.015],[.34,.13,.3],mat('#d6a33f'));sphere(head,[.13,.33,-.02],[.24,.09,.28],hair);sphere(head,[-.15,.29,-.01],[.22,.09,.27],mat('#e0b758'));}
 else if(index===6){sphere(head,[0,.23,-.06],[.33,.18,.27],hair);sphere(head,[0,.17,-.27],[.13,.14,.1],hair);}
 else {sphere(head,[0,.27,-.015],[.34,.15,.3],hair);if(index===0)sphere(head,[.1,.31,.05],[.16,.11,.25],hair);}
 const beardTone=index===0||index===1?mat('#e1ded5',.96):hair;
 if(index===0||index===1||index===5)sphere(head,[0,-.205,.235],[.22,.16,.16],beardTone);
 if(index===2||index===3||index===4||index===8){for(let s of [-1,1]){const mustache=sphere(head,[s*.075,-.12,.294],[.105,.045,.04],hair);mustache.rotation.z=s*.16;}}
 if(index===4||index===5)sphere(head,[0,-.23,.23],[.21,.1,.13],hair);
 if(index===2||index===7){const frame=index===7?gold:mat('#403b32',.42,.25);for(let s of [-1,1])mesh(new THREE.TorusGeometry(index===7?.096:.09,.014,8,24),frame,head,[s*.12,.06,.292]);box(head,[0,.06,.307],[.07,.016,.018],frame);}
 if(index===7){for(let s of [-1,1])sphere(head,[s*.33,.06,0],[.04,.075,.07],skin);box(body,[0,.83,.3],[.03,.51,.025],mat('#ad9b7a'));}
 // shoulder and articulated limbs
 const arms=[],legs=[];
 for(let s of [-1,1]){
  let arm=new THREE.Group();arm.position.set(s*.46,1.42,0);body.add(arm);sphere(arm,[s*.1,-.12,0],[.2,.21,.205],trim);cylinder(arm,[0,-.39,0],.13,.16,.47,cloth,16).rotation.z=s*.14;sphere(arm,[0,-.65,.035],[.135,.12,.13],gold);sphere(arm,[0,-.75,.075],[.14,.12,.15],skin);arms.push(arm);
  let leg=new THREE.Group();leg.position.set(s*.21,.48,0);body.add(leg);cylinder(leg,[0,-.2,0],.16,.19,.42,cloth,16);sphere(leg,[0,-.42,.015],[.17,.09,.17],gold);cylinder(leg,[0,-.53,.04],.14,.16,.22,trim,16);sphere(leg,[0,-.64,.13],[.19,.115,.29],shoe);legs.push(leg);
 }
 root.userData.arms=arms;root.userData.legs=legs;
 if(index===7){let stick=cylinder(body,[.56,.84,.05],.025,.028,1.15,mat('#8c6841'),8);stick.rotation.z=-.12;root.userData.stick=stick;}
 // soft circular floor shadow
 let sh=new THREE.Mesh(new THREE.CircleGeometry(.65,32),new THREE.MeshBasicMaterial({color:'#050505',transparent:true,opacity:.32,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.008;root.add(sh);
 root.position.set(player===1?-2.25:2.25,0,player===1?.4:-.4);root.userData.health=100;root.userData.stamina=100;root.userData.meter=0;root.userData.cooldown=0;root.userData.action='idle';root.userData.actionT=0;root.userData.guard=0;root.userData.dodge=0;root.userData.hitFlash=0;root.userData.combo=0;root.userData.lastHit=0;root.userData.aiWait=.7;root.userData.lane=player===1?0:0;
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
 if(input.move.lengthSq()>.01){let m=input.move.normalize();f.position.addScaledVector(m,dt*(d.dodge>0?7:3.4));f.position.x=THREE.MathUtils.clamp(f.position.x,-5.7,5.7);f.position.z=THREE.MathUtils.clamp(f.position.z,-3.9,3.8);if(d.action==='idle'||d.action==='walk')d.action='walk';}else if(d.action==='walk')d.action='idle';
 if(input.block)action(f,'block');else if(input.special)action(f,'special');else if(input.punch)action(f,'punch');else if(input.kick)action(f,'kick');else if(input.dodge)action(f,'dodge');
}
function runAI(cpu,player,dt){let d=cpu.userData,dist=cpu.position.distanceTo(player.position);d.aiWait-=dt;
 if(player.userData.action==='punch'||player.userData.action==='kick'||player.userData.action==='special'){
  if(d.aiWait<=0&&dist<2.8&&Math.random()<.54){if(Math.random()<.56)action(cpu,'block');else action(cpu,'dodge');d.aiWait=.28+Math.random()*.38;return;}}
 if(d.aiWait<=0){if(d.meter>=100&&dist<3.1&&Math.random()<.48)action(cpu,'special');else if(dist<1.85){let r=Math.random();if(r<.39)action(cpu,'punch');else if(r<.72)action(cpu,'kick');else action(cpu,'block');}else if(Math.random()<.18)action(cpu,'dodge');d.aiWait=.38+Math.random()*.6;}
 if(dist>1.55&&d.action!=='special'&&d.action!=='kick'){let toward=player.position.clone().sub(cpu.position);toward.y=0;toward.normalize();cpu.position.addScaledVector(toward,dt*1.65);cpu.position.x=THREE.MathUtils.clamp(cpu.position.x,-5.5,5.5);cpu.position.z=THREE.MathUtils.clamp(cpu.position.z,-3.6,3.6);if(d.action==='idle')d.action='walk';}else if(d.action==='walk')d.action='idle';
}
function animateFighter(f,dt,time){let d=f.userData,body=d.body,arms=d.arms,legs=d.legs;d.cooldown=Math.max(0,d.cooldown-dt);d.guard=Math.max(0,d.guard-dt);d.dodge=Math.max(0,d.dodge-dt);d.actionT=Math.max(0,d.actionT-dt);d.hitFlash=Math.max(0,d.hitFlash-dt);d.stamina=Math.min(100,d.stamina+dt*(d.action==='idle'?8:4));
 let opponent=state.fighters.find(x=>x!==f);if(opponent){let target=opponent.position.x-f.position.x;f.rotation.y=THREE.MathUtils.lerp(f.rotation.y,target>=0?Math.PI/2:-Math.PI/2,Math.min(1,dt*8));}
 let walk=d.action==='walk',swing=0;if(d.action==='punch')swing=1-d.actionT/.28;if(d.action==='kick')swing=1-d.actionT/.42;if(d.action==='special')swing=1-d.actionT/.7;
 body.position.y=walk?Math.abs(Math.sin(time*10+(f===state.fighters[1]?1:0)))*.07:Math.sin(time*2.2+(d.player*2))*.018;
 body.rotation.z=d.action==='hit'?Math.sin(time*40)*.14:d.action==='dodge'?Math.sin(time*25)*.21:0;
 legs[0].rotation.x=walk?Math.sin(time*9)*.45:0;legs[1].rotation.x=walk?Math.sin(time*9+Math.PI)*.45:0;
 arms[0].rotation.x=0;arms[1].rotation.x=0;arms[0].rotation.z=0;arms[1].rotation.z=0;
 if(d.action==='block'||d.guard>0){arms[0].rotation.x=-1.05;arms[1].rotation.x=-1.05;arms[0].rotation.z=.42;arms[1].rotation.z=-.42;}
 if(d.action==='punch'){arms[0].rotation.x=-swing*1.6;arms[0].rotation.z=-swing*.1;}
 if(d.action==='kick'){legs[0].rotation.x=-swing*1.4;arms[1].rotation.x=-.7;}
 if(d.action==='special'){arms[0].rotation.x=-swing*2;arms[1].rotation.x=-swing*2;body.rotation.y=Math.sin(swing*Math.PI)*.3;}
 if(d.action==='dodge'){body.rotation.x=.2;body.position.x=Math.sin(time*24)*.15;}
 if(d.action==='hit'){body.rotation.z=.24;}
 if(d.actionT<=0&&['punch','kick','special','hit','dodge','block'].includes(d.action)){d.action='idle';body.rotation.x=0;body.position.x=0;body.rotation.y=0;}
}
function updateGame(dt,time){if(!state.running||state.paused||state.ended)return;state.time=Math.max(0,state.time-dt);if(state.time===0){let a=state.fighters[0].userData.health,b=state.fighters[1].userData.health;endMatch(a>=b?0:1);}
 state.fighters.forEach((f,i)=>{if(i===0||state.mode==='local')runInput(f,dt);else runAI(f,state.fighters[0],dt);animateFighter(f,dt,time);});
 for(let i=particlesGroup.children.length-1;i>=0;i--){let p=particlesGroup.children[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.vel,dt);p.userData.vel.y-=5*dt;p.scale.multiplyScalar(.985);if(p.userData.life<=0){particlesGroup.remove(p);p.geometry.dispose();p.material.dispose();}}
 updateHud();}
function renderLoop(){requestAnimationFrame(renderLoop);let dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;updateGame(dt,t);
 if(state.fighters.length===2&&state.running){let mid=state.fighters[0].position.clone().add(state.fighters[1].position).multiplyScalar(.5);let desired=V(mid.x*.13,7.3,17.8+Math.abs(state.fighters[0].position.x-state.fighters[1].position.x)*.12);camera.position.lerp(desired,dt*1.2);camera.lookAt(mid.x*.15,1.05,0);}
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
function boot(){init3d();makeStage(0);buildCharacterGrid();buildArenaCards();bindUI();state.fighters=[createFighter(0,1),createFighter(8,2)];state.fighters[0].position.set(1.8,0,0);state.fighters[1].position.set(4.5,0,-.8);setTimeout(()=>$('#loading').classList.add('done'),550);setTimeout(()=>$('#loading').remove(),1200);}
boot();
function spawnImpact(pos,color,guard){for(let i=0;i<(guard?7:13);i++){let m=mesh(new THREE.SphereGeometry(.045+Math.random()*.06,7,6),mat(color,.45),particlesGroup,[pos.x,pos.y+1+Math.random()*.8,pos.z]);let a=Math.random()*Math.PI*2,s=.7+Math.random()*2.2;m.userData.vel=V(Math.cos(a)*s,Math.random()*2,s*Math.sin(a));m.userData.life=.35+Math.random()*.3;}}
function emitBurst(pos,color){for(let i=0;i<38;i++){let m=mesh(new THREE.SphereGeometry(.04+Math.random()*.08,6,5),mat(color,.45),particlesGroup,[pos.x,pos.y+.4+Math.random()*1.8,pos.z]);let a=Math.random()*6.28,s=.8+Math.random()*4;m.userData.vel=V(Math.cos(a)*s,Math.random()*3,s*Math.sin(a));m.userData.life=.45+Math.random()*.6;}}
