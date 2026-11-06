import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';

// A deliberately interpretive, explorable model: not a PCB manufacturing layout.
export function createScene(container, { onSelect = () => {}, onError = () => {} } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { onError(e); return { setScreen() {}, setActive() {}, resize() {}, destroy() {} }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
  renderer.domElement.setAttribute('aria-label', 'Maquette 3D interactive de l’Apple-1');
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(11, 12.6, 18.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .1, -1.15);
  controls.enableDamping = true;
  controls.dampingFactor = .06;
  controls.enablePan = false;
  controls.minDistance = 10;
  controls.maxDistance = 28;
  controls.maxPolarAngle = Math.PI / 2.13;
  controls.minPolarAngle = Math.PI / 7;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xd9f1ff, 0x17251d, 2.4));
  const key = new THREE.DirectionalLight(0xffecc8, 3.2);
  key.position.set(-6, 15, 12); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left:-12, right:12, top:12, bottom:-12, near:1, far:45 });
  key.shadow.bias = -.0002; scene.add(key);
  const fill = new THREE.DirectionalLight(0x9bdbd1, 2.2); fill.position.set(9, 8, -7); scene.add(fill);
  const accent = new THREE.PointLight(0xffbd70, 26, 24); accent.position.set(-7, 3, 0); scene.add(accent);
  const root = new THREE.Group(); scene.add(root);
  const mat = (color, extra={}) => new THREE.MeshStandardMaterial({ color, roughness:.72, ...extra });
  const pcb = mat(0x234d3c, { roughness:.48, metalness:.12 });
  const pcbSide = mat(0x10342b, { roughness:.7 });
  const copper = mat(0xbaaa63, { metalness:.62, roughness:.4 });
  const chipMat = mat(0x252724, { roughness:.72 });
  const chipTop = mat(0x191d1c, { roughness:.85 });
  const pinMat = mat(0xa9a89a, { metalness:.8, roughness:.35 });
  const cream = mat(0xc9c0a5, { roughness:.6 });
  const ink = mat(0xd8d7b8, { roughness:.6 });
  const dark = mat(0x141919, { roughness:.5 });
  const shadowMat = new THREE.ShadowMaterial({ opacity:.27 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100,100), shadowMat);
  ground.rotation.x = -Math.PI/2; ground.position.y=-.37; ground.receiveShadow = true; root.add(ground);
  function box(parent, w,h,d,x,y,z, material, cast=true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
    mesh.position.set(x,y,z); mesh.castShadow=cast; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, r1,r2,h,x,y,z, material, seg=16) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);
    mesh.position.set(x,y,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function line(points, color=0xbaa65e, width=.018, y=.129, parent=root) {
    for(let i=1;i<points.length;i++) {
      let [x1,z1]=points[i-1], [x2,z2]=points[i];
      const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);
      if(len<.01) continue;
      const segment=box(parent,width,.009,len,(x1+x2)/2,y,(z1+z2)/2,mat(color,{metalness:.48,roughness:.55}),false);
      segment.rotation.y=Math.atan2(dx,dz);
    }
  }
  // Main board, rim, plated mounting holes.
  box(root,11.5,.24,7.35,0,0,0,pcb);
  box(root,11.48,.035,7.33,0,.125,0,pcbSide,false);
  const boardSurface=box(root,11.36,.018,7.2,0,.15,0,pcb,false);
  const drill = mat(0x0c2019, { metalness:.45 });
  for(const x of [-5.43,5.43]) for(const z of [-3.38,3.38]) {
    cylinder(root,.15,.15,.025,x,.172,z,copper,20); cylinder(root,.09,.09,.03,x,.189,z,drill,20);
  }
  // Copper tracks. Carefully seeded for a coherent circuit-like rhythm.
  const seeded = (n) => { let v=Math.sin(n*93.9898+17.23)*43758.5453; return v-Math.floor(v); };
  for(let i=0;i<70;i++) {
    const z=-3.05+i*.087, start=-5.25+seeded(i)*.7, bend=-2.7+seeded(i+50)*1.1, end=1.2+seeded(i+130)*3.9;
    line([[start,z],[bend,z],[bend+.34,z+.25],[end,z+.25]],i%5===0?0xdec978:0x8a8b51, i%8===0?.035:.018,.169);
  }
  for(let i=0;i<40;i++) {
    const x=-5.0+i*.25, z0=-3.15+seeded(i+300)*.9, z1=.2+seeded(i+420)*2.8;
    line([[x,z0],[x,z1],[x+.25,z1+.24]],0x879052,.018,.171);
  }
  function topText(text, x,y,z, w,h, opts={}) {
    const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=256;
    const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,1024,256);
    ctx.fillStyle=opts.color||'#d9d9bd'; ctx.textAlign=opts.align||'center'; ctx.textBaseline='middle';
    ctx.font=`${opts.bold?'bold ':''} ${opts.size||90}px ${opts.font||'monospace'}`;
    ctx.fillText(text,opts.align==='left'?10:512,128);
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide, opacity:opts.opacity??1});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material); plane.rotation.x=-Math.PI/2;
    plane.position.set(x,y,z); root.add(plane); return plane;
  }
  const targetMeshes = [];
  const groups = {};
  function register(mesh, id) { mesh.userData.component=id; targetMeshes.push(mesh); return mesh; }
  function chip(x,z,w,d,id,label,subtitle,pins=12) {
    const group=new THREE.Group(); group.position.set(x,0,z); root.add(group); (groups[id] ||= []).push(group);
    const base=register(box(group,w,.22,d,0,.29,0,chipMat),id);
    box(group,w-.08,.025,d-.06,0,.414,0,chipTop);
    const notch=cylinder(group,.065,.065,.01,-w/2+.15,.435,0,mat(0x777971),12);
    for(let i=0;i<pins;i++) {
      const px=-w/2+.14+(w-.28)*i/(pins-1);
      for(const side of [-1,1]) {
        box(group,.067,.035,.23,px,.23,side*(d/2+.08),pinMat,false);
        box(group,.067,.11,.055,px,.27,side*(d/2+.012),pinMat,false);
      }
    }
    topText(label,x,.432,z-.1,w*.84,.3,{size:84,color:'#c5c8ba'});
    if(subtitle) topText(subtitle,x,.432,z+.15,w*.78,.2,{size:63,color:'#969c90'});
    return group;
  }
  // Component layout is schematic in spirit, not a literal reproduction.
  chip(-.9,.03,2.5,1.08,'cpu','MOS 6502','MICROPROCESSOR',16);
  chip(-3.8,-1.8,1.68,.72,'video','2519','VIDEO',8);
  chip(-1.77,-1.8,1.68,.72,'video','2519','DISPLAY',8);
  chip(.34,-1.8,1.68,.72,'video','74166','SHIFT REGISTER',8);
  for(let i=0;i<4;i++) chip(-4.25+i*1.8,1.7,1.48,.55,'ram','2104','RAM',8);
  chip(2.45,1.72,1.35,.55,'rom','PROM','MONITOR',8);
  chip(4.05,1.72,1.35,.55,'rom','PROM','MONITOR',8);
  chip(2.1,.02,1.3,.58,'video','6820','I/O',8);
  chip(3.66,.02,1.28,.58,'video','7400','LOGIC',7);
  chip(-4.08,.02,1.28,.58,'video','7404','LOGIC',7);
  // Gold edge connector fingers.
  box(root,10.65,.08,.43,0,.12,3.49,mat(0x34442c),false);
  for(let i=0;i<44;i++) box(root,.15,.012,.35,-5.12+i*.238,.174,3.52,copper,false);
  // Silkscreen and markings.
  topText('APPLE COMPUTER  •  1976',-3.18,.185,2.65,3.6,.38,{bold:true,size:78,color:'#d8d5a2'});
  topText('A1    B1    C1    D1    E1    F1    H1',-.35,.185,-2.62,6.5,.20,{size:58,color:'#cfcca9'});
  topText('CPU',-.9,.185,.81,.8,.23,{size:70,color:'#e8e2b4'});
  topText('MEMORY',-2.45,.185,2.2,1.2,.2,{size:62,color:'#e8e2b4'});
  topText('ROM',3.3,.185,2.2,1,.2,{size:62,color:'#e8e2b4'});
  // Discrete parts and an expressive bank of tall electrolytics.
  const capMat=mat(0x182d2a,{metalness:.2,roughness:.42});
  for(let i=0;i<4;i++) {
    const x=3.55+i*.48,z=-1.7+(i%2)*.12;
    const cap=register(cylinder(root,.20,.20,.8,x,.57,z,capMat,20),'power');
    cylinder(root,.17,.17,.025,x,.985,z,pinMat,20);
    box(root,.025,.008,.24,x,1.002,z,mat(0x626a60),false);
  }
  for(let i=0;i<16;i++) {
    let x=-5.0+(i%8)*.46,z=-2.77+Math.floor(i/8)*.35;
    cylinder(root,.075,.075,.17,x,.25,z,cream,10).rotation.z=Math.PI/2;
    box(root,.015,.06,.08,x,.25,z,mat(i%3===0?0xb56544:0x7a573f),false);
  }
  // A row of connector blocks.
  for(let i=0;i<3;i++) {
    const x=4.78,z=-.7+i*.7; register(box(root,.68,.4,.48,x,.35,z,cream),'power');
    for(let j=0;j<3;j++) cylinder(root,.035,.035,.014,x-.18+j*.18,.56,z,mat(0x5e5a48),10);
  }
  // CRT with animated screen canvas. Fictional display housing beside the real board.
  const screenCanvas=document.createElement('canvas'); screenCanvas.width=1024; screenCanvas.height=768;
  const screenCtx=screenCanvas.getContext('2d');
  const screenTexture=new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace=THREE.SRGBColorSpace;
  screenTexture.minFilter=THREE.LinearFilter;
  const monitor=new THREE.Group(); monitor.position.set(3.4,.0,-5.38); root.add(monitor);
  const casing=mat(0xaaa28c,{roughness:.84});
  const fascia=mat(0x544f45,{roughness:.65});
  box(monitor,4.45,3.37,2.45,0,2.05,-.22,casing);
  box(monitor,4.2,3.08,.12,0,2.07,1.055,fascia);
  box(monitor,3.78,2.67,.08,0,2.17,1.135,dark);
  const screenMaterial=new THREE.MeshBasicMaterial({map:screenTexture});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(3.55,2.45),screenMaterial);
  screen.position.set(0,2.18,1.19); monitor.add(screen); register(screen,'video');
  box(monitor,4.5,.18,2.5,0,.28,-.22,mat(0x6a6559));
  cylinder(monitor,.06,.06,.1,1.75,.69,1.17,mat(0xa9a28b),16).rotation.x=Math.PI/2;
  const ledMat=new THREE.MeshBasicMaterial({color:0x9ac97f});
  cylinder(monitor,.035,.035,.03,1.48,.69,1.19,ledMat,12).rotation.x=Math.PI/2;
  // A text plane on the monitor lip.
  const brandCanvas=document.createElement('canvas'); brandCanvas.width=512; brandCanvas.height=64;
  const bc=brandCanvas.getContext('2d'); bc.fillStyle='#ccc5a9'; bc.font='22px monospace'; bc.fillText('APPLE COMPUTER',8,44);
  const bt=new THREE.CanvasTexture(brandCanvas); bt.colorSpace=THREE.SRGBColorSpace;
  const brand=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.17),new THREE.MeshBasicMaterial({map:bt,transparent:true}));
  brand.position.set(-1.34,.67,1.22); monitor.add(brand);
  let currentText='APPLE-1\n\\\n_';
  function setScreen(value) {
    currentText=Array.isArray(value)?value.join('\n'):String(value??'');
    const c=screenCtx; c.fillStyle='#07140e'; c.fillRect(0,0,1024,768);
    const grad=c.createRadialGradient(512,350,80,512,360,650); grad.addColorStop(0,'rgba(40,97,60,.30)'); grad.addColorStop(1,'rgba(1,8,5,.5)'); c.fillStyle=grad; c.fillRect(0,0,1024,768);
    c.font='bold 24px monospace'; c.textBaseline='top'; c.fillStyle='#b3f4b0'; c.shadowColor='#85ff9a'; c.shadowBlur=8;
    const rows=currentText.replace(/\r/g,'').split('\n').slice(-24);
    rows.forEach((row,i)=>c.fillText(row.slice(0,40),28,24+i*30)); c.shadowBlur=0;
    c.fillStyle='rgba(0,0,0,.14)'; for(let y=0;y<768;y+=4)c.fillRect(0,y,1024,1);
    screenTexture.needsUpdate=true;
  }
  setScreen(currentText);
  let selected=null;
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let down=null;
  function pointerDown(e){ down={x:e.clientX,y:e.clientY}; }
  function pointerUp(e){
    if(!down || Math.hypot(e.clientX-down.x,e.clientY-down.y)>5) return;
    const r=renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(targetMeshes,false)[0];
    if(hit){ setActive(hit.object.userData.component); onSelect(hit.object.userData.component); }
  }
  function setActive(id) {
    selected=id;
    for(const mesh of targetMeshes){
      if(mesh===screen) continue;
      // Clone only the selected material so the rest of the shared components stay untouched.
      if(!mesh.userData.baseMat) mesh.userData.baseMat=mesh.material;
      if(mesh.userData.highlightMat){ mesh.userData.highlightMat.dispose(); mesh.userData.highlightMat=null; }
      mesh.material=mesh.userData.baseMat;
      if(mesh.userData.component===id){
        mesh.userData.highlightMat=mesh.userData.baseMat.clone();
        mesh.userData.highlightMat.emissive=new THREE.Color(0x274e36);
        mesh.userData.highlightMat.emissiveIntensity=.8;
        mesh.material=mesh.userData.highlightMat;
      }
    }
  }
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  const resize=()=>{const w=container.clientWidth||1,h=container.clientHeight||1; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();};
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
  observer?.observe(container); window.addEventListener('resize',resize); resize();
  let frame=0, disposed=false;
  function animate(){ if(disposed)return; frame=requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); }
  animate();
  return { setScreen, setActive, resize, destroy(){ disposed=true; cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize',resize); renderer.domElement.removeEventListener('pointerdown',pointerDown); renderer.domElement.removeEventListener('pointerup',pointerUp); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); } };
}
