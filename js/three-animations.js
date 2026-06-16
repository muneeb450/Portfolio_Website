(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  /* ===== Setup ===== */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    200,
  );
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1 : isMedium ? 1.5 : 2));
  renderer.domElement.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';

  const container = document.querySelector('.ambient-bg');
  if (!container) return;
  container.appendChild(renderer.domElement);

  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const galaxy = new THREE.Group();
  scene.add(galaxy);

  /* ===== Utilities ===== */
  function makeGlowTexture(c1, c2) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
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

  /* ===== 1. Star Field ===== */
  const isSmall = window.innerWidth < 480;
  const isMedium = window.innerWidth < 768;
  const STAR_COUNT = isSmall ? 800 : isMedium ? 1500 : 3500;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starSizes = new Float32Array(STAR_COUNT);
  const starPhases = new Float32Array(STAR_COUNT);
  const starColors = new Float32Array(STAR_COUNT * 3);
  const palette = [
    [1, 1, 1],
    [0.8, 0.75, 1],
    [0.6, 0.8, 1],
    [1, 0.9, 0.7],
  ];

  for (let i = 0; i < STAR_COUNT; i++) {
    const r = 6 + Math.random() * 55;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) * 0.35;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 18;
    starSizes[i] = 0.04 + Math.random() * 0.5;
    starPhases[i] = Math.random() * Math.PI * 2;
    const p = palette[Math.floor(Math.random() * palette.length)];
    starColors[i * 3] = p[0];
    starColors[i * 3 + 1] = p[1];
    starColors[i * 3 + 2] = p[2];
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const starMesh = new THREE.Points(starGeo, starMat);
  galaxy.add(starMesh);

  /* ===== 2. Nebula Clouds ===== */
  const nebulaDefs = [
    { c1: 'rgba(108,99,255,0.5)', c2: 'rgba(139,127,255,0.2)', x: -9, y: 3, z: -25, s: 16 },
    { c1: 'rgba(0,212,170,0.4)', c2: 'rgba(0,230,176,0.15)', x: 10, y: -4, z: -22, s: 14 },
    { c1: 'rgba(108,99,255,0.3)', c2: 'rgba(180,160,255,0.1)', x: -4, y: 6, z: -30, s: 20 },
    { c1: 'rgba(0,180,200,0.25)', c2: 'rgba(0,212,170,0.1)', x: 6, y: -5, z: -26, s: 12 },
  ];

  const nebulae = nebulaDefs.map((d) => {
    const tex = makeGlowTexture(d.c1, d.c2);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });
    const s = new THREE.Sprite(mat);
    s.position.set(d.x, d.y, d.z);
    s.scale.set(d.s, d.s, 1);
    s.userData = {
      fs: 0.04 + Math.random() * 0.08,
      fa: 0.3 + Math.random() * 0.6,
      rs: 0.0008 + Math.random() * 0.0015,
      bx: d.x,
      by: d.y,
      ph: Math.random() * Math.PI * 2,
    };
    galaxy.add(s);
    return s;
  });

  /* ===== 3. Aurora Waves ===== */
  function makeAurora(color, xOff, zPos) {
    const g = new THREE.PlaneGeometry(26, 5, 80, 24);
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
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
    var aurora1 = makeAurora(0x6c63ff, -4, -16);
    var aurora2 = makeAurora(0x00d4aa, 5, -18);
  } else {
    var aurora1 = null, aurora2 = null;
  }

  /* ===== 4. Holographic Grid ===== */
  const gridGroup = new THREE.Group();
  gridGroup.position.z = -8;

  for (let r = 1; r <= 6; r++) {
    const segs = 64;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(Math.cos(a) * r, Math.sin(a) * r, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x6c63ff,
      transparent: true,
      opacity: 0.05 - r * 0.007,
      depthWrite: false,
    });
    gridGroup.add(new THREE.Line(geo, mat));
  }

  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const pts = [0, 0, 0, Math.cos(a) * 6, Math.sin(a) * 6, 0];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x6c63ff,
      transparent: true,
      opacity: 0.03,
      depthWrite: false,
    });
    gridGroup.add(new THREE.Line(geo, mat));
  }

  const scanGeo = new THREE.RingGeometry(0.1, 0.3, 48);
  const scanMat = new THREE.MeshBasicMaterial({
    color: 0x6c63ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const scanRing = new THREE.Mesh(scanGeo, scanMat);
  scanRing.position.z = 0.1;
  gridGroup.add(scanRing);

  galaxy.add(gridGroup);

  /* ===== 5. Glowing Orbs ===== */
  const orbPositions = [
    { x: -4.5, y: 3, z: -6 },
    { x: 5.5, y: -2.5, z: -7 },
    { x: -2.5, y: -3.5, z: -5 },
    { x: 4, y: 2, z: -8.5 },
    { x: -1.5, y: 3.5, z: -9 },
  ];

  const orbs = orbPositions.map((pos, i) => {
    const color = i % 2 === 0 ? 0x6c63ff : 0x00d4aa;
    const geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);

    const gTex = makeGlowTexture('rgba(108,99,255,0.4)', 'rgba(108,99,255,0.1)');
    const gMat = new THREE.SpriteMaterial({
      map: gTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.12,
      color,
    });
    const glow = new THREE.Sprite(gMat);
    glow.scale.set(1.5, 1.5, 1);
    mesh.add(glow);

    mesh.userData = {
      speed: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      amp: 0.3 + Math.random() * 0.4,
      bx: pos.x,
      by: pos.y,
    };
    galaxy.add(mesh);
    return mesh;
  });

  /* ===== 6. Shooting Stars ===== */
  const shooters = [];
  for (let i = 0; i < 3; i++) {
    const pts = [0, 0, 0, 0, 0, 0];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    galaxy.add(line);
    shooters.push({ line, active: false, progress: 0, dur: 0, sx: 0, sy: 0, sz: 0, ex: 0, ey: 0, ez: 0, wait: Math.random() * 4 });
  }

  function fireShooter() {
    const s = shooters.find((x) => !x.active);
    if (!s) return;
    s.active = true;
    s.progress = 0;
    s.dur = 0.5 + Math.random() * 0.7;
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.random() * 8;
    s.sx = Math.cos(angle) * dist;
    s.sy = 3 + Math.random() * 4;
    s.sz = -8 - Math.random() * 5;
    s.ex = s.sx + (Math.random() - 0.5) * 8;
    s.ey = s.sy - 6 - Math.random() * 4;
    s.ez = s.sz + 3 + Math.random() * 3;
  }

  setInterval(fireShooter, 2000 + Math.random() * 3000);

  /* ===== 7. Foreground Particles ===== */
  const fgCount = isSmall ? 15 : isMedium ? 25 : 50;
  const fgGeo = new THREE.BufferGeometry();
  const fgPos = new Float32Array(fgCount * 3);
  const fgData = [];
  for (let i = 0; i < fgCount; i++) {
    fgPos[i * 3] = (Math.random() - 0.5) * 18;
    fgPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    fgPos[i * 3 + 2] = -1 - Math.random() * 2;
    fgData.push({ ph: Math.random() * Math.PI * 2, sp: 0.2 + Math.random() * 0.4, amp: 0.1 + Math.random() * 0.2, by: fgPos[i * 3 + 1], bx: fgPos[i * 3] });
  }
  fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
  const fgMat = new THREE.PointsMaterial({
    color: 0x6c63ff,
    size: 0.04,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const fgMesh = new THREE.Points(fgGeo, fgMat);
  galaxy.add(fgMesh);

  /* ===== Mouse & Scroll ===== */
  let mx = 0, my = 0, tx = 0, ty = 0, sy = 0;
  document.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth) * 2 - 1;
    ty = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });
  window.addEventListener('scroll', () => { sy = window.scrollY; }, { passive: true });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  /* ===== Animation ===== */
  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;

    galaxy.rotation.y = mx * 0.08;
    galaxy.rotation.x = my * 0.04;

    const scrollNorm = Math.min(sy / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1), 1);
    galaxy.position.y = -scrollNorm * 3;

    // Stars twinkle
    const cols = starGeo.attributes.color.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const tw = Math.sin(elapsed * 0.8 + starPhases[i]) * 0.25 + 0.75;
      cols[i * 3] = starColors[i * 3] * tw;
      cols[i * 3 + 1] = starColors[i * 3 + 1] * tw;
      cols[i * 3 + 2] = starColors[i * 3 + 2] * tw;
    }
    starGeo.attributes.color.needsUpdate = true;

    // Nebula drift
    nebulae.forEach((n) => {
      const u = n.userData;
      n.position.x = u.bx + Math.sin(elapsed * u.fs + u.ph) * u.fa * 0.3;
      n.position.y = u.by + Math.cos(elapsed * u.fs * 0.7 + u.ph) * u.fa;
      n.material.rotation += u.rs;
    });

    // Aurora deformation
    [aurora1, aurora2].forEach((a) => {
      if (!a) return;
      const pos = a.geometry.attributes.position;
      const arr = pos.array;
      const orig = a.userData.orig;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] = orig[i + 1] + Math.sin(orig[i] * 0.4 + elapsed * 0.6) * 0.4 + Math.sin(orig[i + 2] * 0.3 + elapsed * 0.4) * 0.3;
      }
      pos.needsUpdate = true;
    });

    // Scan ring pulse
    const pulse = (Math.sin(elapsed * 1.5) * 0.5 + 0.5) * 5 + 1;
    scanRing.scale.set(pulse, pulse, 1);
    scanMat.opacity = 0.15 * (1 - (pulse - 1) / 5);

    // Orbs float
    orbs.forEach((o) => {
      const u = o.userData;
      const t = elapsed * u.speed + u.phase;
      o.position.x = u.bx + Math.sin(t) * u.amp * 0.5;
      o.position.y = u.by + Math.cos(t * 0.7) * u.amp * 0.4;
    });

    // Shooting stars
    shooters.forEach((s) => {
      if (!s.active) {
        s.wait -= delta;
        if (s.wait <= 0) { fireShooter(); s.wait = 3 + Math.random() * 5; }
        return;
      }
      s.progress += delta / s.dur;
      if (s.progress >= 1) { s.active = false; s.line.material.opacity = 0; return; }
      const p = s.progress;
      const pos = s.line.geometry.attributes.position.array;
      pos[0] = s.sx + (s.ex - s.sx) * p;
      pos[1] = s.sy + (s.ey - s.sy) * p;
      pos[2] = s.sz + (s.ez - s.sz) * p;
      const tp = Math.max(0, p - 0.15);
      pos[3] = s.sx + (s.ex - s.sx) * tp;
      pos[4] = s.sy + (s.ey - s.sy) * tp;
      pos[5] = s.sz + (s.ez - s.sz) * tp;
      s.line.geometry.attributes.position.needsUpdate = true;
      s.line.material.opacity = p < 0.1 ? p * 10 : Math.max(0, (1 - p) * 0.8);
    });

    // Foreground particles drift
    const fgP = fgGeo.attributes.position.array;
    for (let i = 0; i < fgCount; i++) {
      const d = fgData[i];
      fgP[i * 3] = d.bx + Math.sin(elapsed * d.sp * 0.5 + d.ph) * d.amp;
      fgP[i * 3 + 1] = d.by + Math.cos(elapsed * d.sp) * d.amp;
    }
    fgGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
})();
