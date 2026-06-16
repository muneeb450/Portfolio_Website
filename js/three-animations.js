(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  const isSmall = window.innerWidth < 480;
  const isMedium = window.innerWidth < 768;
  const pixelRatio = Math.min(window.devicePixelRatio, isSmall ? 1 : isMedium ? 1.5 : 2);

  /* ===== Setup ===== */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(pixelRatio);
  renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';

  const container = document.querySelector('.ambient-bg');
  if (!container) return;
  container.appendChild(renderer.domElement);

  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const galaxy = new THREE.Group();
  scene.add(galaxy);

  /* ===== Utility Functions ===== */
  function makeGlowTexture(c1, c2) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, c1);
    g.addColorStop(0.2, c2);
    g.addColorStop(0.6, 'rgba(0,0,0,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }

  function randomRange(min, max) { return min + Math.random() * (max - min); }

  /* ===== 1. Star Field (Rich Multi-Layer) ===== */
  const STAR_COUNT = isSmall ? 1200 : isMedium ? 2000 : 5000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starSizes = new Float32Array(STAR_COUNT);
  const starPhases = new Float32Array(STAR_COUNT);
  const starColors = new Float32Array(STAR_COUNT * 3);
  const starLayers = new Float32Array(STAR_COUNT); // 0=depth,1=mid,2=fore
  const palette = [
    [1, 1, 1],
    [0.85, 0.8, 1],
    [0.65, 0.75, 1],
    [1, 0.9, 0.7],
    [0.7, 0.5, 1],
    [1, 0.75, 0.8],
    [0.5, 0.85, 1],
  ];

  for (let i = 0; i < STAR_COUNT; i++) {
    const layer = Math.random();
    const r = layer < 0.33 ? randomRange(4, 18) : layer < 0.66 ? randomRange(18, 40) : randomRange(40, 65);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const flatten = 0.3 + layer * 0.15;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) * flatten;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - (8 + layer * 12);
    starSizes[i] = layer < 0.33 ? randomRange(0.02, 0.12) : layer < 0.66 ? randomRange(0.06, 0.25) : randomRange(0.12, 0.5);
    starPhases[i] = Math.random() * Math.PI * 2;
    starLayers[i] = layer;
    const p = palette[Math.floor(Math.random() * palette.length)];
    const brightness = 0.6 + layer * 0.4;
    starColors[i * 3] = p[0] * brightness;
    starColors[i * 3 + 1] = p[1] * brightness;
    starColors[i * 3 + 2] = p[2] * brightness;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const starMesh = new THREE.Points(starGeo, starMat);
  galaxy.add(starMesh);

  /* ===== 2. Nebula Clouds (Richer) ===== */
  const nebulaDefs = [
    { c1: 'rgba(108,99,255,0.5)', c2: 'rgba(139,127,255,0.2)', x: -9, y: 3, z: -25, s: 18 },
    { c1: 'rgba(0,212,170,0.4)', c2: 'rgba(0,230,176,0.15)', x: 10, y: -4, z: -22, s: 15 },
    { c1: 'rgba(108,99,255,0.35)', c2: 'rgba(180,160,255,0.12)', x: -4, y: 6, z: -30, s: 22 },
    { c1: 'rgba(0,180,200,0.3)', c2: 'rgba(0,212,170,0.1)', x: 6, y: -5, z: -28, s: 14 },
    { c1: 'rgba(180,120,255,0.25)', c2: 'rgba(200,150,255,0.08)', x: -7, y: -3, z: -32, s: 16 },
    { c1: 'rgba(100,200,255,0.2)', c2: 'rgba(150,220,255,0.06)', x: 8, y: 2, z: -35, s: 12 },
  ];

  const nebulae = nebulaDefs.map((d) => {
    const tex = makeGlowTexture(d.c1, d.c2);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 });
    const s = new THREE.Sprite(mat);
    s.position.set(d.x, d.y, d.z);
    s.scale.set(d.s, d.s, 1);
    s.userData = { fs: randomRange(0.03, 0.08), fa: randomRange(0.3, 0.8), rs: randomRange(0.0006, 0.0015), bx: d.x, by: d.y, ph: Math.random() * Math.PI * 2, scaleBase: d.s };
    galaxy.add(s);
    return s;
  });

  /* ===== 3. Aurora Waves (Enhanced) ===== */
  function makeAurora(color, xOff, zPos, opacityBase) {
    const g = new THREE.PlaneGeometry(28, 6, 80, 28);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacityBase || 0.05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(xOff, -1, zPos);
    mesh.rotation.x = -0.35;
    mesh.rotation.z = 0.12 + xOff * 0.04;
    const pos = g.attributes.position;
    const orig = new Float32Array(pos.array);
    mesh.userData.orig = orig;
    galaxy.add(mesh);
    return mesh;
  }

  if (!isSmall) {
    var aurora1 = makeAurora(0x6c63ff, -4, -16, 0.06);
    var aurora2 = makeAurora(0x00d4aa, 5, -18, 0.05);
    var aurora3 = makeAurora(0x8b5cf6, -8, -20, 0.03);
    var aurora4 = makeAurora(0x38bdf8, 7, -22, 0.03);
  } else {
    var aurora1 = null, aurora2 = null, aurora3 = null, aurora4 = null;
  }

  /* ===== 4. Holographic Grid (Enhanced) ===== */
  const gridGroup = new THREE.Group();
  gridGroup.position.z = -8;

  for (let r = 1; r <= 7; r++) {
    const segs = 72;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x6c63ff, transparent: true, opacity: 0.06 - r * 0.008, depthWrite: false });
    gridGroup.add(new THREE.Line(geo, mat));
  }

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const pts = [0, 0, 0, Math.cos(a) * 7, Math.sin(a) * 7, 0];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x6c63ff, transparent: true, opacity: 0.04, depthWrite: false });
    gridGroup.add(new THREE.Line(geo, mat));
  }

  // Scan ring
  const scanGeo = new THREE.RingGeometry(0.1, 0.35, 48);
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x6c63ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const scanRing = new THREE.Mesh(scanGeo, scanMat);
  scanRing.position.z = 0.1;
  gridGroup.add(scanRing);

  // Second counter-rotating ring
  const scanGeo2 = new THREE.RingGeometry(0.15, 0.25, 32);
  const scanMat2 = new THREE.MeshBasicMaterial({ color: 0x00d4aa, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const scanRing2 = new THREE.Mesh(scanGeo2, scanMat2);
  scanRing2.position.z = 0.15;
  gridGroup.add(scanRing2);

  galaxy.add(gridGroup);

  /* ===== 5. Glowing Orbs (More, with pulse) ===== */
  const orbPositions = [
    { x: -4.5, y: 2.8, z: -6 },
    { x: 5.5, y: -2.5, z: -7 },
    { x: -2.5, y: -3.5, z: -5 },
    { x: 4, y: 2.2, z: -8.5 },
    { x: -1.5, y: 3.5, z: -9 },
    { x: 3.5, y: -3, z: -11 },
    { x: -3.8, y: -1.5, z: -4 },
  ];

  const orbs = orbPositions.map((pos, i) => {
    const color = i % 2 === 0 ? 0x6c63ff : 0x00d4aa;
    const geo = new THREE.SphereGeometry(randomRange(0.1, 0.2), 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);

    const glowTex = makeGlowTexture('rgba(108,99,255,0.5)', 'rgba(108,99,255,0.15)');
    const gMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.15, color });
    const glow = new THREE.Sprite(gMat);
    glow.scale.set(1.8, 1.8, 1);
    mesh.add(glow);

    mesh.userData = { speed: randomRange(0.12, 0.3), phase: Math.random() * Math.PI * 2, amp: randomRange(0.3, 0.5), bx: pos.x, by: pos.y, pulsePhase: Math.random() * Math.PI * 2 };
    galaxy.add(mesh);
    return mesh;
  });

  /* ===== 6. Shooting Stars (More, with tail) ===== */
  const shooters = [];
  for (let i = 0; i < 5; i++) {
    const segments = 12;
    const pts = new Float32Array((segments + 1) * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    galaxy.add(line);
    shooters.push({ line, segments, active: false, progress: 0, dur: 0, sx: 0, sy: 0, sz: 0, ex: 0, ey: 0, ez: 0, wait: Math.random() * 5, color: new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.5, 0.7 + Math.random() * 0.3) });
  }

  function fireShooter() {
    const s = shooters.find((x) => !x.active);
    if (!s) return;
    s.active = true;
    s.progress = 0;
    s.dur = 0.4 + Math.random() * 0.8;
    const angle = Math.random() * Math.PI * 2;
    const dist = 4 + Math.random() * 10;
    s.sx = Math.cos(angle) * dist;
    s.sy = 2 + Math.random() * 5;
    s.sz = -6 - Math.random() * 8;
    s.ex = s.sx + (Math.random() - 0.5) * 10;
    s.ey = s.sy - 5 - Math.random() * 6;
    s.ez = s.sz + 2 + Math.random() * 4;
    s.line.material.color.set(s.color);
  }

  setInterval(fireShooter, 1500 + Math.random() * 2500);

  /* ===== 7. Foreground Particles (More dynamic) ===== */
  const fgCount = isSmall ? 20 : isMedium ? 35 : 70;
  const fgGeo = new THREE.BufferGeometry();
  const fgPos = new Float32Array(fgCount * 3);
  const fgData = [];
  for (let i = 0; i < fgCount; i++) {
    fgPos[i * 3] = (Math.random() - 0.5) * 20;
    fgPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    fgPos[i * 3 + 2] = -0.5 - Math.random() * 2.5;
    fgData.push({ ph: Math.random() * Math.PI * 2, sp: randomRange(0.15, 0.5), amp: randomRange(0.1, 0.3), by: fgPos[i * 3 + 1], bx: fgPos[i * 3], ampV: randomRange(0.02, 0.06) });
  }
  fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
  const fgMat = new THREE.PointsMaterial({
    color: 0x6c63ff,
    size: 0.05,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const fgMesh = new THREE.Points(fgGeo, fgMat);
  galaxy.add(fgMesh);

  /* ===== 8. Cosmic Dust Layer ===== */
  if (!isSmall) {
    const dustCount = isMedium ? 300 : 800;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 40;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      dustPos[i * 3 + 2] = -40 - Math.random() * 20;
      dustSizes[i] = randomRange(0.02, 0.08);
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x6c63ff,
      size: 0.03,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const dustMesh = new THREE.Points(dustGeo, dustMat);
    galaxy.add(dustMesh);
  }

  /* ===== Mouse & Scroll ===== */
  let mx = 0, my = 0, tx = 0, ty = 0, sy = 0;
  let targetRotX = 0, targetRotY = 0;

  document.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = -(e.clientY / window.innerHeight) * 2 + 1;
    targetRotX = ty * 0.12;
    targetRotY = tx * 0.2;
  }, { passive: true });

  window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  /* ===== Animation Loop ===== */
  const clock = new THREE.Clock();
  let ambientRot = 0;

  function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    mx += (tx - mx) * 0.03;
    my += (ty - my) * 0.03;

    // Subtle ambient rotation
    ambientRot += delta * 0.012;
    galaxy.rotation.y = mx * 0.12 + Math.sin(ambientRot) * 0.04;
    galaxy.rotation.x = my * 0.06 + Math.sin(ambientRot * 0.6) * 0.02;

    const scrollNorm = Math.min(sy / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1), 1);
    galaxy.position.y = -scrollNorm * 3;

    /* Stars twinkle (only update visible range for perf) */
    const cols = starGeo.attributes.color.array;
    const updateBatch = Math.min(STAR_COUNT, 2000);
    for (let i = 0; i < updateBatch; i++) {
      const tw = Math.sin(elapsed * 0.6 + starPhases[i]) * 0.3 + 0.7;
      const bright = 0.6 + starLayers[i] * 0.4;
      cols[i * 3] = starColors[i * 3] * tw;
      cols[i * 3 + 1] = starColors[i * 3 + 1] * tw;
      cols[i * 3 + 2] = starColors[i * 3 + 2] * tw;
    }
    starGeo.attributes.color.needsUpdate = true;

    /* Nebula drift + breathing */
    nebulae.forEach((n) => {
      const u = n.userData;
      n.position.x = u.bx + Math.sin(elapsed * u.fs + u.ph) * u.fa * 0.4;
      n.position.y = u.by + Math.cos(elapsed * u.fs * 0.7 + u.ph) * u.fa;
      n.material.rotation += u.rs;
      const breathe = Math.sin(elapsed * 0.15 + u.ph) * 0.08 + 1;
      n.scale.set(u.scaleBase * breathe, u.scaleBase * breathe, 1);
    });

    /* Aurora waves */
    [aurora1, aurora2, aurora3, aurora4].forEach((a) => {
      if (!a) return;
      const pos = a.geometry.attributes.position;
      const arr = pos.array;
      const orig = a.userData.orig;
      const t1 = elapsed * 0.5;
      const t2 = elapsed * 0.35;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] = orig[i + 1] + Math.sin(orig[i] * 0.4 + t1) * 0.5 + Math.sin(orig[i + 2] * 0.3 + t2) * 0.35;
      }
      pos.needsUpdate = true;
      a.material.opacity = 0.04 + Math.sin(elapsed * 0.2 + a.position.x) * 0.02;
    });

    /* Scan rings */
    const pulse = (Math.sin(elapsed * 1.5) * 0.5 + 0.5) * 5 + 1;
    scanRing.scale.set(pulse, pulse, 1);
    scanMat.opacity = 0.2 * (1 - (pulse - 1) / 5);

    const pulse2 = (Math.sin(elapsed * 1.8 + 1.2) * 0.5 + 0.5) * 4 + 1;
    scanRing2.scale.set(pulse2, pulse2, 1);
    scanMat2.opacity = 0.1 * (1 - (pulse2 - 1) / 4);
    scanRing2.rotation.z += delta * 0.3;

    /* Orbs float + pulse glow */
    orbs.forEach((o) => {
      const u = o.userData;
      const t = elapsed * u.speed + u.phase;
      o.position.x = u.bx + Math.sin(t) * u.amp * 0.5;
      o.position.y = u.by + Math.cos(t * 0.7) * u.amp * 0.4;
      const glowPulse = Math.sin(elapsed * 1.2 + u.pulsePhase) * 0.3 + 0.7;
      o.children[0].scale.set(1.8 * glowPulse, 1.8 * glowPulse, 1);
      o.children[0].material.opacity = 0.08 + glowPulse * 0.12;
    });

    /* Shooting stars (with trail segments) */
    shooters.forEach((s) => {
      if (!s.active) {
        s.wait -= delta;
        if (s.wait <= 0) { fireShooter(); s.wait = 2 + Math.random() * 6; }
        return;
      }
      s.progress += delta / s.dur;
      if (s.progress >= 1) { s.active = false; s.line.material.opacity = 0; return; }
      const p = s.progress;
      const seg = s.segments;
      const arr = s.line.geometry.attributes.position.array;
      const cx = s.sx + (s.ex - s.sx) * p;
      const cy = s.sy + (s.ey - s.sy) * p;
      const cz = s.sz + (s.ez - s.sz) * p;
      for (let j = 0; j <= seg; j++) {
        const tp = Math.max(0, p - (j / seg) * 0.25);
        arr[j * 3] = s.sx + (s.ex - s.sx) * tp;
        arr[j * 3 + 1] = s.sy + (s.ey - s.sy) * tp;
        arr[j * 3 + 2] = s.sz + (s.ez - s.sz) * tp;
      }
      s.line.geometry.attributes.position.needsUpdate = true;
      s.line.material.opacity = p < 0.05 ? p * 20 : Math.max(0, (1 - p) * 0.9);
    });

    /* Foreground particles drift */
    const fgP = fgGeo.attributes.position.array;
    for (let i = 0; i < fgCount; i++) {
      const d = fgData[i];
      fgP[i * 3] = d.bx + Math.sin(elapsed * d.sp * 0.4 + d.ph) * d.amp;
      fgP[i * 3 + 1] = d.by + Math.cos(elapsed * d.sp * 0.6 + d.ph) * d.amp + Math.sin(elapsed * 0.3 + d.ph) * d.ampV;
    }
    fgGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
})();
