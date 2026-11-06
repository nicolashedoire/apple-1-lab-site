import * as THREE from 'https://esm.sh/three@0.170.0';
import { OrbitControls } from 'https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js';

// A deliberately interpretive, explorable model: not a PCB manufacturing layout.
export function createScene(container, { onSelect = () => {}, onError = () => {}, onAnchor = () => {} } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { onError(e); return { setScreen() {}, setActive() {}, focus() {}, overview() {}, getAnchor() { return null; }, resize() {}, destroy() {} }; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
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
  controls.minDistance = 3.5;
  controls.maxDistance = 28;
  controls.maxPolarAngle = Math.PI / 2.13;
  controls.minPolarAngle = Math.PI / 7;
  controls.update();
  const overviewPosition=camera.position.clone(), overviewTarget=controls.target.clone();
  let cameraDestination=null, targetDestination=null;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9fa6a5, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-6, 15, 12); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left:-12, right:12, top:12, bottom:-12, near:1, far:45 });
  key.shadow.bias = -.0002; scene.add(key);
  const fill = new THREE.DirectionalLight(0xe7efff, 1.35); fill.position.set(9, 8, -7); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, .9); rim.position.set(-8, 4, -10); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const mat = (color, extra={}) => new THREE.MeshStandardMaterial({ color, roughness:.72, ...extra });
  const pcb = mat(0x145c3d, { roughness:.54, metalness:.06 });
  const pcbSide = mat(0x10342b, { roughness:.7 });
  const copper = mat(0xbaaa63, { metalness:.62, roughness:.4 });
  const chipMat = mat(0x252724, { roughness:.72 });
  const chipTop = mat(0x191d1c, { roughness:.85 });
  const pinMat = mat(0xa9a89a, { metalness:.8, roughness:.35 });
  const cream = mat(0xc9c0a5, { roughness:.6 });
  const ink = mat(0xd8d7b8, { roughness:.6 });
  const dark = mat(0x141919, { roughness:.5 });
  const shadowMat = new THREE.ShadowMaterial({ opacity:.18 });
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
    line([[start,z],[bend,z],[bend+.34,z+.25],[end,z+.25]],i%5===0?0x77a16c:0x398c59, i%8===0?.035:.018,.169);
  }
  for(let i=0;i<40;i++) {
    const x=-5.0+i*.25, z0=-3.15+seeded(i+300)*.9, z1=.2+seeded(i+420)*2.8;
    line([[x,z0],[x,z1],[x+.25,z1+.24]],0x398c59,.018,.171);
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
  function chip(x,z,w,d,id,label,subtitle,pins=12, rotate=false, ceramic=false) {
    const group=new THREE.Group(); group.position.set(x,0,z); if(rotate) group.rotation.y=Math.PI/2; root.add(group); (groups[id] ||= []).push(group);
    const body=ceramic?mat(0xe9e6d7,{roughness:.68}):chipMat;
    const top=ceramic?mat(0xf3f0e2,{roughness:.7}):chipTop;
    const base=register(box(group,w,.22,d,0,.29,0,body),id);
    box(group,w-.08,.025,d-.06,0,.414,0,top);
    const notch=cylinder(group,.065,.065,.01,-w/2+.15,.435,0,mat(0x777971),12);
    for(let i=0;i<pins;i++) {
      const px=-w/2+.14+(w-.28)*i/(pins-1);
      for(const side of [-1,1]) {
        box(group,.067,.035,.23,px,.23,side*(d/2+.08),pinMat,false);
        box(group,.067,.11,.055,px,.27,side*(d/2+.012),pinMat,false);
      }
    }
    if(label && !rotate) topText(label,x,.432,z-.1,w*.84,.3,{size:84,color:ceramic?'#625e50':'#c5c8ba'});
    if(subtitle && !rotate) topText(subtitle,x,.432,z+.15,w*.78,.2,{size:63,color:ceramic?'#777365':'#969c90'});
    return group;
  }
  // Approximate physical layout based on the Smithsonian Apple-1 specimen.
  // It is a visual reconstruction, not a dimensionally accurate PCB or netlist.
  // Rows A-D run across the board: 6502 and 6820 towards row A on the left.
  chip(-3.62,2.63,1.66,.55,'video','6820','PIA',16,false,false);
  chip(-1.65,2.63,1.66,.55,'cpu','MOS 6502','MICROPROCESSOR',20,false,true);
  for (let i=0; i<2; i++) chip(-5.12+i*.38,2.63,.73,.24,'rom','','',8,true);
  for (let i=0; i<8; i++) chip(.02+i*.61,2.63,.75,.25,'ram','','',8,true);
  // Minimum 4K installation is eight 4096 (4K x 1) chips; a second bank can bring RAM to 8K.
  for (let i=0; i<8; i++) chip(.6+i*.59,.92,.76,.25,'ram','','',8,true);
  for (let i=0; i<7; i++) chip(-5.12+i*.62,.92,.76,.25,'video','','',8,true);
  chip(-.35,.92,1.05,.45,'video','74154','DECODER',12);
  for (let row=0; row<2; row++) for (let i=0; i<16; i++) {
    const x=-5.12+i*.59, z=-.68-row*1.56;
    chip(x,z,.75,.25,'video','','',8,true);
  }
  // Prototyping field, visible at the rear edge on original boards.
  const protoHole=mat(0xc9c2a2,{metalness:.5,roughness:.45});
  for(let row=0;row<3;row++) for(let i=0;i<62;i++) {
    const hole=cylinder(root,.026,.026,.008,-2.84+i*.095,.182,-3.35+row*.14,protoHole,6); hole.castShadow=false;
  }
  // The original edge socket is on the right short edge (44 contacts).
  box(root,.34,.27,3.85,5.48,.31,1.55,mat(0x242923),false);
  for(let i=0;i<22;i++) box(root,.06,.018,.085,5.48,.458,-.20+i*.16,copper,false);
  // Restrained silkscreen, matching the marked copyright and the component grid.
  topText('Apple Computer 1',-3.9,.185,.04,2.4,.31,{bold:true,size:80,color:'#e2e0c7'});
  topText('Palo Alto, Ca.  Copyright 1976',-3.9,.185,.27,2.6,.16,{size:54,color:'#dddcc3'});
  topText('6502',-1.65,.185,2.07,.6,.18,{size:62,color:'#e3e0c7'});
  // Three large blue axial capacitors and a power-regulator heatsink.
  const capMat=mat(0x347ca2,{metalness:.1,roughness:.48});
  const capPositions=[[3.60,-3.03],[4.50,-1.19],[4.50,-.40]];
  for(const [x,z] of capPositions){
    const cap=register(cylinder(root,.30,.30,1.50,x,.51,z,capMat,24),'power'); cap.rotation.z=Math.PI/2;
    const left=cylinder(root,.27,.27,.025,x-.76,.51,z,pinMat,20);left.rotation.z=Math.PI/2;
    const right=cylinder(root,.27,.27,.025,x+.76,.51,z,pinMat,20);right.rotation.z=Math.PI/2;
  }
  // Aluminium regulator and white connector blocks, approximate positions.
  const sink=register(box(root,1.0,.75,.9,4.65,.50,-2.90,mat(0x7d8383,{metalness:.7,roughness:.35})),'power');
  for(let i=0;i<6;i++)box(root,.075,.85,.95,4.18+i*.18,.55,-2.90,mat(0x555a59,{metalness:.65,roughness:.4}));
  for(let i=0;i<2;i++){const x=4.97,z=-2.02+i*.5;register(box(root,.77,.32,.34,x,.31,z,cream),'power');}
  // Small orange decoupling capacitors punctuate the chip rows.
  const orange=mat(0xc57b38,{roughness:.63});
  for(let i=0;i<20;i++) {const x=-4.7+(i%10)*.98,z=-2.7+Math.floor(i/10)*1.6;cylinder(root,.06,.06,.12,x,.24,z,orange,10);}
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
    currentText=(Array.isArray(value)?value.join('\n'):String(value??'')) || 'APPLE-1\n\\\n_';
    const c=screenCtx; c.fillStyle='#07140e'; c.fillRect(0,0,1024,768);
    const grad=c.createRadialGradient(512,350,80,512,360,650); grad.addColorStop(0,'rgba(40,97,60,.30)'); grad.addColorStop(1,'rgba(1,8,5,.5)'); c.fillStyle=grad; c.fillRect(0,0,1024,768);
    c.save(); c.translate(28,24); c.scale(1.35,1); const compact = currentText.length < 30; c.font=compact?'bold 56px monospace':'bold 27px monospace'; c.textBaseline='top'; c.fillStyle='#c4ffc1'; c.shadowColor='#9affaa'; c.shadowBlur=9;
    const rows=currentText.replace(/\r/g,'').split('\n').slice(-24);
    rows.forEach((row,i)=>c.fillText(row.slice(0,40),0,i*(compact ? 66 : 30))); c.restore();
    c.fillStyle='rgba(0,0,0,.14)'; for(let y=0;y<768;y+=4)c.fillRect(0,y,1024,1);
    screenTexture.needsUpdate=true;
  }
  setScreen(currentText);
  let selected=null;
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  let down=null;
  function pointerDown(e){ cameraDestination=null; targetDestination=null; down={x:e.clientX,y:e.clientY}; }
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
        mesh.userData.highlightMat.emissive=new THREE.Color(0x1353a2);
        mesh.userData.highlightMat.emissiveIntensity=.8;
        mesh.material=mesh.userData.highlightMat;
      }
    }
  }
  // Smoothly approach a component while keeping orbit controls available.
  const focusPoints={cpu:[-1.65,.43,2.63,5.4],ram:[2.55,.43,2.63,6.8],video:[-3.62,.43,2.63,5.5],rom:[-4.93,.43,2.63,4.4],power:[4.5,.6,-1.19,6.2]};
  // The active part's projected position, relative to the scene container, lets
  // the UI attach a pointer that follows the camera and orbital movement.
  function getAnchor(id=selected) {
    const data=focusPoints[id];
    if (!data) return null;
    camera.updateMatrixWorld();
    const position = new THREE.Vector3(data[0],data[1],data[2]).project(camera);
    const width=container.clientWidth || 1, height=container.clientHeight || 1;
    return {id, x:(position.x+1)*width/2, y:(1-position.y)*height/2,
      visible:position.z>=-1 && position.z<=1 && Math.abs(position.x)<=1 && Math.abs(position.y)<=1};
  }
  function focus(id) {
    if(!focusPoints[id]) return;
    setActive(id);
    const [x,y,z,d]=focusPoints[id]; targetDestination=new THREE.Vector3(x,y,z);
    const direction=new THREE.Vector3(.32,1.5,.82).normalize();
    cameraDestination=targetDestination.clone().addScaledVector(direction,d);
  }
  function overview() { cameraDestination=overviewPosition.clone(); targetDestination=overviewTarget.clone(); }
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  const resize=()=>{const w=container.clientWidth||1,h=container.clientHeight||1; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();};
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
  observer?.observe(container); window.addEventListener('resize',resize); resize();
  let frame=0, disposed=false;
  function animate(){ if(disposed)return; frame=requestAnimationFrame(animate); if(cameraDestination && targetDestination){camera.position.lerp(cameraDestination,.075);controls.target.lerp(targetDestination,.075);if(camera.position.distanceTo(cameraDestination)<.012 && controls.target.distanceTo(targetDestination)<.012){cameraDestination=null;targetDestination=null;}} const pulse=.45+.45*(1+Math.sin(performance.now()*.004))/2; for(const mesh of targetMeshes){if(mesh.userData.highlightMat)mesh.userData.highlightMat.emissiveIntensity=pulse;} controls.update(); renderer.render(scene,camera); onAnchor(getAnchor()); }
  animate();
  return { setScreen, setActive, focus, overview, getAnchor, resize, destroy(){ disposed=true; cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize',resize); renderer.domElement.removeEventListener('pointerdown',pointerDown); renderer.domElement.removeEventListener('pointerup',pointerUp); controls.dispose(); renderer.dispose(); renderer.domElement.remove(); } };
}
