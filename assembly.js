import { recordAchievement } from './achievements.js';
// A playful visual assembly activity, not electrical assembly instructions.
export function mountAssembly(container) {
  if (!container) return;
  const pieces = [
    {id:'cpu', name:'Processeur', title:'Le cerveau', hint:'Le processeur suit les consignes. Choisis « Processeur » dans la liste, puis place-le.', fact:'Bien joué ! Le processeur est comme le chef : il suit les consignes du programme.'},
    {id:'memory', name:'Mémoire', title:'La mémoire', hint:'La mémoire garde les informations. Choisis « Mémoire », puis place-la.', fact:'La mémoire est comme une armoire : elle garde les consignes et les nombres pendant que la machine travaille.'},
    {id:'video', name:'Circuits vidéo', title:'Les circuits vidéo', hint:'Ces puces aident à montrer les lettres. Choisis « Circuits vidéo », puis place-les.', fact:'Les circuits vidéo préparent les lettres pour que l’écran puisse les montrer.'},
    {id:'power', name:'Alimentation', title:'L’alimentation', hint:'La machine a besoin d’électricité. Choisis « Alimentation », puis place-la.', fact:'L’alimentation fournit aux pièces l’électricité dont elles ont besoin.'},
    {id:'screen', name:'Écran', title:'L’écran', hint:'Pour voir les lettres, il faut un écran. Choisis « Écran », puis place-le.', fact:'L’écran montre les lettres et les résultats de la machine.'}
  ];
  const escape = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  container.classList.add('assembly-section');
  container.innerHTML=`<div class="assembly-wrap"><div class="assembly-heading"><div><div class="assembly-eyebrow">L’ATELIER</div><h2>Construis ton Apple‑1.</h2><p>À toi de jouer : découvre à quoi servent les pièces et assemble-les, une par une.</p></div><div class="assembly-progress"><span class="assembly-count">ÉTAPE 1 / 5</span><div class="assembly-progress-track"><span></span></div></div></div><div class="assembly-how" aria-label="Comment assembler"><p><b>1.</b> Choisis la pièce demandée.</p><p><b>2.</b> Clique sur la cible bleue de la carte ou sur « Placer la pièce ».</p><p><b>3.</b> Lis son rôle, puis passe à la suivante.</p></div><div class="assembly-card"><div class="assembly-stage"><div class="assembly-stage-title"><span>CARTE INTERACTIVE</span><span class="assembly-stage-note">Fais glisser la carte avec ton doigt ou ta souris pour la faire tourner.</span></div><div class="assembly-canvas" role="img" aria-label="Carte Apple-1 à assembler en trois dimensions"><div class="assembly-loading">Préparation de l’atelier…</div></div><div class="assembly-scene-caption">Une maquette pour comprendre · placement simplifié</div></div><div class="assembly-side"><div class="assembly-side-top"><div class="assembly-step-number">01 <span>/ 05</span></div><h3></h3><p class="assembly-hint"></p></div><div class="assembly-inventory-label">CHOISIS UNE PIÈCE</div><div class="assembly-inventory" role="group" aria-label="Pièces à assembler"></div><p class="assembly-feedback" role="status" aria-live="polite"></p><div class="assembly-actions"><button type="button" class="assembly-place" disabled>Placer la pièce <span>→</span></button><button type="button" class="assembly-reset">Recommencer</button><a class="assembly-next" href="laboratoire.html" hidden>Voir comment elle fonctionne →</a></div></div></div></div>`;
  const query=s=>container.querySelector(s), canvasHost=query('.assembly-canvas');
  const inventory=query('.assembly-inventory'), feedback=query('.assembly-feedback'), placeButton=query('.assembly-place');
  let step=0, selected=null, sceneAPI=null, disposed=false;
  function render() {
    const done=step>=pieces.length, current=pieces[Math.min(step,pieces.length-1)];
    query('.assembly-count').textContent=done?'ASSEMBLAGE TERMINÉ':`ÉTAPE ${step+1} / ${pieces.length}`;
    query('.assembly-progress-track span').style.width=`${step/pieces.length*100}%`;
    query('.assembly-step-number').innerHTML=done?'✓ <span>TERMINÉ</span>':`${String(step+1).padStart(2,'0')} <span>/ 05</span>`;
    query('.assembly-side h3').textContent=done?'Bravo, ta maquette est prête !':current.title;
    query('.assembly-hint').textContent=done?'Les pièces travaillent ensemble ! Va au laboratoire pour voir comment elles suivent un programme.':current.hint;
    query('.assembly-next').hidden=!done;
    inventory.innerHTML=pieces.map((p,i)=>`<button type="button" class="assembly-piece ${selected===p.id?'is-selected':''} ${i<step?'is-placed':''}" data-piece="${p.id}" ${done||i<step?'disabled':''} aria-pressed="${selected===p.id}"><span class="assembly-piece-icon part-${p.id}" aria-hidden="true"><i></i></span><span>${escape(p.name)}</span>${i<step?'<span class="assembly-check" aria-label="placé">✓</span>':''}</button>`).join('');
    query('.assembly-inventory-label').textContent=done?'LES PIÈCES SONT EN PLACE':'CHOISIS UNE PIÈCE';
    placeButton.disabled=done||!selected;
    placeButton.innerHTML=done?'Terminé <span>✓</span>':'Placer la pièce <span>→</span>';
    sceneAPI?.setStep(step);
  }
  function selectPiece(id) {
    if(step>=pieces.length)return;
    selected=id; feedback.textContent=''; render();
    feedback.textContent=id===pieces[step].id ? 'Bien choisi ! Clique sur le cercle bleu sur la carte ou sur « Placer la pièce ».' : `Pour cette étape, cherche « ${pieces[step].name} » dans la liste.`;
  }
  function place() {
    if(step>=pieces.length)return;
    if(!selected){feedback.textContent='Choisis une pièce avant de la placer.'; return;}
    if(selected!==pieces[step].id){feedback.textContent=`Pour cette étape, choisis « ${pieces[step].name} » dans la liste.`;return;}
    const fact=pieces[step].fact; step++; selected=null; if(step===pieces.length) recordAchievement('montage'); render(); feedback.textContent=fact;
  }
  inventory.addEventListener('click',e=>{const button=e.target.closest('[data-piece]'); if(button&&!button.disabled)selectPiece(button.dataset.piece)});
  placeButton.addEventListener('click',place);
  query('.assembly-reset').addEventListener('click',()=>{step=0;selected=null;feedback.textContent='';render()});
  render();

  Promise.all([
    import('https://esm.sh/three@0.170.0'),
    import('https://esm.sh/three@0.170.0/examples/jsm/controls/OrbitControls.js')
  ]).then(([THREE,{OrbitControls}])=>{
    if(disposed)return;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
    catch { canvasHost.innerHTML='<div class="assembly-fallback">La vue 3D est indisponible ici. Tu peux quand même assembler les pièces avec les boutons.</div>';return; }
    canvasHost.innerHTML=''; renderer.setPixelRatio(Math.min(devicePixelRatio||1,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.setClearColor(0x000000,0); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; canvasHost.appendChild(renderer.domElement);
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(35,1,.1,100); camera.position.set(8,11,15);
    const controls=new OrbitControls(camera,renderer.domElement); controls.target.set(0,0,-.6); controls.enableDamping=true; controls.enablePan=false; controls.minDistance=8;controls.maxDistance=25;controls.maxPolarAngle=Math.PI/2.3;controls.minPolarAngle=Math.PI/7;controls.update();
    scene.add(new THREE.HemisphereLight(0xffffff,0xa8a9a8,2.4)); const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-5,14,9);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
    const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.7,...extra});
    const pcb=mat(0x22734f), chipmat=mat(0x222424), white=mat(0xeae8de), metal=mat(0xadb5b0,{metalness:.65,roughness:.35}), blue=mat(0x3b85aa), dark=mat(0x151a18);
    function box(parent,w,h,d,x,y,z,material){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
    const board=new THREE.Group();scene.add(board);box(board,10,.25,6.6,0,0,0,pcb);
    const gold=mat(0xbfb578,{metalness:.55});
    for(let i=0;i<30;i++)box(board,.035,.015,5.6,-4.25+i*.29,.14,0,mat(i%4?0x428d63:0x6a9e74));
    for(let i=0;i<18;i++)box(board,9,.016,.025,0,.145,-2.7+i*.3,mat(0x448c61));
    for(const x of [-4.65,4.65]) for(const z of [-2.95,2.95]) {const hole=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.02,16),gold);hole.position.set(x,.16,z);board.add(hole)}
    const groups={}; for(const p of pieces){groups[p.id]=new THREE.Group();board.add(groups[p.id]);}
    function chip(parent,x,z,w=1.5,d=.55,ceramic=false){box(parent,w,.22,d,x,.28,z,ceramic?white:chipmat);const n=w>1?12:5;for(let i=0;i<n;i++){let px=x-w/2+.1+(w-.2)*i/(n-1);for(const side of [-1,1])box(parent,.055,.035,.16,px,.2,z+side*(d/2+.06),metal)}}
    chip(groups.cpu,-2.5,1.8,1.6,.65,true);
    for(let i=0;i<8;i++)chip(groups.memory,.1+i*.48,1.8,.39,.6);
    for(let row=0;row<2;row++)for(let i=0;i<7;i++)chip(groups.video,-4+i*.9,-1.35+row*.95,.65,.46);
    for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,1.2,20),blue);c.rotation.z=Math.PI/2;c.position.set(3.6,.4,-2.2+i*.6);groups.power.add(c)}
    box(groups.screen,2.8,2.1,1.2,3.2,1.3,-4.5,mat(0xc7c3b7));box(groups.screen,2.35,1.6,.08,3.2,1.37,-3.86,dark);box(groups.screen,2.12,1.37,.03,3.2,1.38,-3.8,mat(0x244a34,{emissive:0x092015}));
    const targets={cpu:[-2.5,.2,1.8,1.15,.8],memory:[1.8,.2,1.8,2.25,.85],video:[-1.2,.2,-.9,3.6,1.3],power:[3.6,.2,-1.6,1.2,1.5],screen:[3.2,.2,-4.5,1.8,1.3]};
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,12,60),new THREE.MeshBasicMaterial({color:0x2875f5,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;scene.add(ring);
    const marker=new THREE.Mesh(new THREE.SphereGeometry(.08,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));scene.add(marker);
    const hitPlane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));hitPlane.rotation.x=-Math.PI/2;scene.add(hitPlane);
    function setStep(n){for(let i=0;i<pieces.length;i++)groups[pieces[i].id].visible=i<n;const t=targets[pieces[n]?.id]; ring.visible=marker.visible=hitPlane.visible=!!t;if(t){ring.position.set(t[0],.23,t[2]);marker.position.set(t[0],.27,t[2]);hitPlane.position.set(t[0],.35,t[2]);hitPlane.scale.set(t[3]*2,t[4]*2,1)}}
    sceneAPI={setStep}; setStep(step);
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(); let down=null;
    renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});
    renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);if(hitPlane.visible&&ray.intersectObject(hitPlane).length)place()});
    function resize(){const w=canvasHost.clientWidth||1,h=canvasHost.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
    const observer=new ResizeObserver(resize);observer.observe(canvasHost);resize();
    let frame=0;function animate(){if(disposed)return;frame=requestAnimationFrame(animate);const t=performance.now()*.003;ring.scale.setScalar(1+.12*Math.sin(t));ring.material.opacity=.62+.26*(1+Math.sin(t))/2;controls.update();renderer.render(scene,camera)}animate();
    sceneAPI.destroy=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose()};
  }).catch(()=>{canvasHost.innerHTML='<div class="assembly-fallback">La vue 3D est indisponible ici. Tu peux quand même assembler les pièces avec les boutons.</div>'});
  return {destroy(){disposed=true;sceneAPI?.destroy?.()}};
}
