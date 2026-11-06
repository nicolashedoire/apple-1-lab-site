import * as THREE from 'https://esm.sh/three@0.170.0';
import { GLTFLoader } from 'https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';

/**
 * Show the Meshy-generated model in an existing Pico figure.
 * A CSS Pico already in the container remains visible until the model loads,
 * and remains available if WebGL, the network, or the GLB cannot be loaded.
 * The pose animation moves the model as a whole; it is not a facial rig.
 */
export function mountPico3D(container, { variant = 'hero', onError = () => {}, onReady = () => {} } = {}) {
  if (!(container instanceof Element)) throw new TypeError('Pico needs a container element.');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    onError(error);
    return { destroy() {}, setAction() {} };
  }

  let disposed = false;
  let loaded = false;
  let frame = 0;
  let visible = true;
  let lastRender = 0;
  let animatedRoot = null;
  let procedural = null;
  let currentAction = 'idle';
  let actionStarted = 0;
  let blinkReadyAt = null;
  let blinkRestoreAction = 'idle';
  let resizeObserver = null;
  let visibilityObserver = null;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0 };
  const neutral = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const canvas = renderer.domElement;

  container.classList.add('pico3d-host', `pico3d-host--${variant === 'compact' ? 'compact' : 'hero'}`);
  canvas.className = 'pico3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  camera.position.set(0, 0.04, 5);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xf5fff8, 0x80a994, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.25);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc9ffe3, 1.15);
  fill.position.set(4, 1, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x96ffb8, 1.15);
  rim.position.set(0, 3, -4);
  scene.add(rim);

  function resize() {
    if (disposed) return;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // The normalized model fits both a wide and a narrow container.
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distanceForHeight = 1 / Math.tan(halfFov);
    const distanceForWidth = 1 / (Math.tan(halfFov) * camera.aspect);
    camera.position.set(0, 0.045, Math.max(distanceForHeight, distanceForWidth) * 1.22);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (loaded) renderer.render(scene, camera);
  }

  function render(time) {
    frame = 0;
    if (disposed || !loaded || !visible || document.hidden) return;
    // 30 fps is plenty for this small character and limits battery usage.
    if (time - lastRender >= 1000 / 30) {
      lastRender = time;
      const t = time * 0.001;
      if (animatedRoot) {
        const elapsed = (time - actionStarted) * 0.001;
        pointer.x = THREE.MathUtils.lerp(pointer.x, pointerTarget.x, 0.055);
        pointer.y = THREE.MathUtils.lerp(pointer.y, pointerTarget.y, 0.055);
        animatedRoot.position.y = currentAction === 'walk' ? Math.abs(Math.sin(t * 5.8)) * 0.012 : 0;
        animatedRoot.rotation.z = currentAction === 'blink' ? THREE.MathUtils.lerp(animatedRoot.rotation.z, 0, 0.16) : Math.sin(t * (currentAction === 'walk' ? 5.8 : 1.05)) * (currentAction === 'walk' ? 0.018 : 0.009);
        const facing = currentAction === 'blink' ? 0 : currentAction === 'look' ? -0.68 : currentAction === 'walk' ? (elapsed < 2.55 ? -0.60 : 0.60) : Math.sin(t * 0.8) * 0.06 + pointer.x * 0.08;
        animatedRoot.rotation.y = THREE.MathUtils.lerp(animatedRoot.rotation.y, facing, 0.10);
        const pitch = currentAction === 'blink' ? 0 : Math.sin(t * 1.2) * 0.025 - pointer.y * 0.05;
        animatedRoot.rotation.x = THREE.MathUtils.lerp(animatedRoot.rotation.x, pitch, 0.12);
        // The face is a single textured surface. Flat eyelid covers only look
        // aligned near the front, so wait until Pico faces us before blinking.
        const frontal = Math.abs(animatedRoot.rotation.y) < 0.10 && Math.abs(animatedRoot.rotation.x) < 0.08;
        if (currentAction === 'blink' && blinkReadyAt === null && frontal) blinkReadyAt = time;
        const blinkElapsed = blinkReadyAt === null ? 0 : (time - blinkReadyAt) * 0.001;
        const allowBlink = frontal && (currentAction === 'blink' ? blinkReadyAt !== null : currentAction !== 'look' && currentAction !== 'walk');
        if (procedural) procedural.update(currentAction, currentAction === 'blink' ? blinkElapsed : elapsed, t, false, allowBlink);
        if (currentAction === 'blink' && blinkReadyAt !== null && blinkElapsed > 0.55) {
          currentAction = blinkRestoreAction; actionStarted = time; blinkReadyAt = null;
        }
        const breathe = Math.sin(t * 2.0) * 0.006;
        animatedRoot.scale.set(1 + breathe * 0.45, 1 - breathe, 1 + breathe * 0.45);
      }
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(render);
  }

  function resume() {
    if (disposed || !loaded || !visible || document.hidden) return;
    if (motion.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (animatedRoot) {
        animatedRoot.position.set(0, 0, 0);
        animatedRoot.rotation.set(0, 0, 0);
        animatedRoot.scale.setScalar(1);
      }
      if (procedural) procedural.update(currentAction, 0, 0, true, false);
      renderer.render(scene, camera);
    } else if (!frame) {
      frame = requestAnimationFrame(render);
    }
  }
  function onPageVisibility() {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else resume();
  }
  function onPointerMove(event) {
    if (motion.matches) return;
    const rect = container.getBoundingClientRect();
    pointerTarget.set(
      THREE.MathUtils.clamp(((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2, -1, 1),
      THREE.MathUtils.clamp(((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2, -1, 1)
    );
  }
  function onPointerLeave() { pointerTarget.copy(neutral); }

  resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(container);
  if (!resizeObserver) window.addEventListener('resize', resize);
  if (typeof IntersectionObserver !== 'undefined') {
    visibilityObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
      else resume();
    }, { threshold: 0.01 });
    visibilityObserver.observe(container);
  }
  document.addEventListener('visibilitychange', onPageVisibility);
  motion.addEventListener?.('change', resume);
  container.addEventListener('pointermove', onPointerMove);
  container.addEventListener('pointerleave', onPointerLeave);
  resize();

  function cleanup() {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    if (!resizeObserver) window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onPageVisibility);
    motion.removeEventListener?.('change', resume);
    container.removeEventListener('pointermove', onPointerMove);
    container.removeEventListener('pointerleave', onPointerLeave);
    scene.traverse(object => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      for (const material of materials) {
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
        material.dispose?.();
      }
    });
    renderer.dispose();
    canvas.remove();
    container.classList.remove('pico3d-ready', 'pico3d-host', 'pico3d-host--hero', 'pico3d-host--compact');
  }

  const loader = new GLTFLoader();
  const modelUrl = new URL('./assets/pico-meshy.glb', import.meta.url).href;
  loader.load(modelUrl, gltf => {
    if (disposed) return;
    try {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(maxDimension) || maxDimension <= 0) throw new Error('Pico model has empty bounds.');
      const fit = new THREE.Group();
      fit.add(model);
      procedural = makeProceduralFeatures(model);
      model.position.sub(center);
      fit.scale.setScalar(2 / maxDimension);
      animatedRoot = new THREE.Group();
      animatedRoot.add(fit);
      scene.add(animatedRoot);
      loaded = true;
      resize();
      container.classList.add('pico3d-ready');
      resume();
      onReady();
    } catch (error) {
      cleanup();
      onError(error);
    }
  }, undefined, error => {
    cleanup();
    onError(error);
  });

  function setAction(action) {
    const supported = ['idle', 'walk', 'wave', 'blink', 'talk', 'tongue', 'look'];
    const nextAction = supported.includes(action) ? action : 'idle';
    if (nextAction === 'blink' && currentAction !== 'blink') {
      blinkRestoreAction = ['look', 'wave', 'talk', 'tongue'].includes(currentAction) ? currentAction : 'idle';
    }
    blinkReadyAt = null;
    currentAction = motion.matches && nextAction === 'blink' ? blinkRestoreAction : nextAction;
    actionStarted = performance.now();
    if (loaded && motion.matches) { procedural?.update(currentAction, 0, 0, true, false); renderer.render(scene, camera); }
    else resume();
  }
  return { destroy: cleanup, setAction };
}


/*
 * The generated model is one connected textured surface, not a skeleton.
 * Only the outer arm/foot vertices are gently displaced. Small skin-coloured
 * covers, shown only during an expression, make it possible to blink or move
 * the painted mouth without claiming a skeletal or facial rig exists.
 */
function makeProceduralFeatures(model) {
  let mesh = null;
  model.traverse(object => { if (!mesh && object.isMesh && object.geometry?.attributes?.position) mesh = object; });
  if (!mesh) return { update() {} };
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const base = position.array.slice();
  const weights = new Float32Array(position.count * 2);
  const smooth = (a, b, value) => { const x = Math.max(0, Math.min(1, (value - a) / (b - a))); return x * x * (3 - 2 * x); };
  const gate = (value, lo, hi, feather) => smooth(lo - feather, lo, value) * (1 - smooth(hi, hi + feather, value));
  let skinIndex = 0, skinDistance = Infinity;
  for (let i = 0; i < position.count; i++) {
    const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
    weights[i * 2] = smooth(0.68, 0.88, Math.abs(x)) * gate(y, -0.22, 0.12, 0.16);
    weights[i * 2 + 1] = (1 - smooth(-0.83, -0.62, y)) * smooth(0.04, 0.15, Math.abs(x));
    const distance = (x * x) + ((y + .10) * (y + .10)) + ((z - .708) * (z - .708));
    if (distance < skinDistance) { skinDistance = distance; skinIndex = i; }
  }
  position.setUsage(THREE.DynamicDrawUsage);
  let changedVertices = false;
  const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const skinMaterial = sourceMaterial.clone();
  skinMaterial.normalMap = null;
  skinMaterial.side = THREE.DoubleSide;
  skinMaterial.needsUpdate = true;
  const skinU = uv ? uv.getX(skinIndex) : 0.5, skinV = uv ? uv.getY(skinIndex) : 0.5;
  function makePatch(x, y, z, sx, sy) {
    const shape = new THREE.CircleGeometry(1, 48);
    const coords = shape.attributes.uv;
    for (let i = 0; i < coords.count; i++) coords.setXY(i, skinU, skinV);
    coords.needsUpdate = true;
    const patch = new THREE.Mesh(shape, skinMaterial);
    patch.position.set(x, y, z); patch.scale.set(sx, sy, 1); patch.visible = false;
    model.add(patch);
    return patch;
  }
  const eyelids = [makePatch(-0.32, 0.32, 0.705, 0.165, 0.19), makePatch(0.34, 0.33, 0.705, 0.165, 0.19)];
  const lidLineMaterial = new THREE.MeshBasicMaterial({ color: 0x1b4735 });
  const lidLineCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.105, .015, 0), new THREE.Vector3(0, -.025, 0), new THREE.Vector3(.105, .015, 0)]);
  const lidLineGeometry = new THREE.TubeGeometry(lidLineCurve, 20, .007, 6, false);
  const lidLines = [new THREE.Mesh(lidLineGeometry, lidLineMaterial), new THREE.Mesh(lidLineGeometry, lidLineMaterial)];
  lidLines[0].position.set(-.32,.32,.711); lidLines[1].position.set(.34,.33,.711);
  for (const line of lidLines) { line.visible = false; model.add(line); }
  const mouthCover = makePatch(0, 0.14, 0.735, 0.17, 0.135);
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0x38141e, side: THREE.DoubleSide });
  const smile = new THREE.Shape();
  smile.moveTo(-1, .26); smile.quadraticCurveTo(0, -.13, 1, .26);
  smile.bezierCurveTo(.94, -.50, .59, -1, 0, -1);
  smile.bezierCurveTo(-.59, -1, -.94, -.50, -1, .26);
  const mouthShape = new THREE.ShapeGeometry(smile, 32);
  const mouth = new THREE.Mesh(mouthShape, mouthMaterial);
  mouth.position.set(0, 0.145, 0.741); mouth.scale.set(0.14, 0.085, 1); mouth.visible = false; model.add(mouth);
  const tongueMaterial = new THREE.MeshStandardMaterial({ color: 0xff91aa, roughness: 0.6, metalness: 0 });
  const tongueShape = new THREE.SphereGeometry(1, 24, 16);
  const tongue = new THREE.Mesh(tongueShape, tongueMaterial);
  tongue.position.set(0, 0.102, 0.748); tongue.scale.set(0.07, 0.032, 0.018); tongue.visible = false; model.add(tongue);

  return {
    update(action, elapsed, time, reduced = false, allowBlink = true) {
      const movingVertices = !reduced && (action === 'walk' || action === 'wave');
      if (movingVertices || changedVertices) {
        const data = position.array;
        const rhythm = Math.sin(elapsed * (action === 'walk' ? 5.8 : 5.2));
        for (let i = 0; i < position.count; i++) {
          const x = base[i * 3], arm = weights[i * 2], foot = weights[i * 2 + 1], side = x < 0 ? -1 : 1;
          const wave = action === 'wave' ? arm * 0.12 * (0.5 + 0.5 * Math.sin(elapsed * 5.2 + (side < 0 ? 0 : 0.8))) : 0;
          const leg = action === 'walk' ? foot * 0.105 * Math.max(0, rhythm * side) : 0;
          data[i * 3] = x;
          data[i * 3 + 1] = base[i * 3 + 1] + wave + leg;
          data[i * 3 + 2] = base[i * 3 + 2] + (action === 'walk' ? foot * 0.075 * rhythm * side : 0);
        }
        position.needsUpdate = true;
        changedVertices = movingVertices;
      }
      const blinkCycle = action === 'blink' ? elapsed % 1.8 : time % 6.5;
      const blinkAt = action === 'blink' ? 0.22 : 5.65;
      const blink = reduced || !allowBlink ? 0 : Math.max(0, 1 - Math.abs(blinkCycle - blinkAt) / 0.10);
      for (let i = 0; i < eyelids.length; i++) {
        const lid = eyelids[i];
        lid.visible = blink > .01;
        lid.scale.y = .19 * Math.max(.04, blink);
        // Close downwards from the upper edge instead of growing from the centre.
        lid.position.y = (i === 0 ? .32 : .33) + .19 * (1 - blink);
      }
      for (const line of lidLines) line.visible = blink > .78;
      const movingMouth = action === 'talk' || action === 'tongue';
      mouthCover.visible = movingMouth;
      mouth.visible = movingMouth;
      tongue.visible = movingMouth;
      if (movingMouth) {
        const talking = reduced ? .75 : .22 + .78 * (0.5 + 0.5 * Math.sin(elapsed * 8));
        mouth.scale.y = .085 * (action === 'tongue' ? .8 : talking);
        tongue.scale.y = action === 'tongue' ? .072 : .032 * talking;
        tongue.position.y = action === 'tongue' ? .055 : .102 + (.02 * (1 - talking));
      }
    }
  };
}
