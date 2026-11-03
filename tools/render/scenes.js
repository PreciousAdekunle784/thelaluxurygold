import * as L from './lib.js';
const { THREE } = L;

export const C = {
  ivory: '#ede7dc', sage: '#a2ac98', sageDeep: '#879681', forest: '#26382f', burgundy: '#4b1726',
  black: '#141414', champagne: '#d8c7a6', stone: '#e3d9c8', stoneWarm: '#d9ccb6', stoneDark: '#b9ad99',
};

function studio(R, o = {}) {
  const { bg = C.ivory, env = {}, light = {}, sweepO = {} } = o;
  const scene = new THREE.Scene();
  scene.userData.env = L.studioEnv(R, env);
  scene.background = new THREE.Color(bg);
  scene.add(L.sweep(bg, sweepO));
  L.lights(scene, light);
  return scene;
}

export const jobs = {};
const job = (name, w, h, build, extra = {}) => (jobs[name] = { w, h, build, ...extra });
const cam = (w, h, c) => L.orbit(w, h, { fov: 24, ...c });
const PI = Math.PI;
const G = (k, r) => L.gold(k, r);

function flatLoop(y0, o = {}) {
  const path = o.loose ? L.looseLoop({ rx: o.rx ?? 5.4, rz: o.rz ?? 7, seed: o.seed ?? 9, wobble: o.wobble ?? 0.08, pinch: o.pinch ?? 0.3, rot: o.rot ?? 0 })
    : L.necklaceShape({ rx: o.rx ?? 5.2, rz: o.rz ?? 7, seed: o.seed ?? 9, v: o.v ?? 1.0, rot: o.rot ?? 0 });
  path.points.forEach((p) => (p.y = y0));
  return path;
}

// ------------------------------------------------------------------ products
// place(scene, y0) puts the piece on a surface at height y0, centred around x = z = 0.
const products = {
  'aurelia-band': {
    area: 4,
    place(s, y) {
      const a = L.band(G('18k')); a.rotation.y = -0.55; a.position.set(-0.35, y + 1.02, -0.2); s.add(a);
      const b = L.band(G('18k')); b.rotation.x = -PI / 2; b.position.set(1.15, y + 0.18, 1.25); s.add(b);
    },
    main: { az: 12, el: 22, dist: 14.5, target: [0.35, 0.95, 0.5] },
    alt: { az: -20, el: 30, dist: 15.5, target: [0.35, 1.0, 0.5] },
  },
  'maison-signet': {
    area: 4,
    place(s, y) { const r = L.signet(G('21k')); r.rotation.y = -0.45; r.position.set(0, y + 1.02, 0); s.add(r); },
    main: { az: 14, el: 26, dist: 13, target: [0, 1.05, 0] },
    alt: { az: -28, el: 38, dist: 12.5, target: [0, 1.1, 0] },
  },
  'corda-twist': {
    area: 4,
    place(s, y) { const r = L.ropeRing(G('18k')); r.rotation.y = -0.5; r.position.set(0, y + 1.18, 0); s.add(r); },
    main: { az: 10, el: 22, dist: 13, target: [0, 1.15, 0] },
    alt: { az: -25, el: 45, dist: 12.5, target: [0, 1.1, 0] },
  },
  'soleil-dome': {
    area: 4,
    place(s, y) { const r = L.domeRing(G('22k')); r.rotation.y = -0.4; r.position.set(0, y + 1.0, 0); s.add(r); },
    main: { az: 14, el: 24, dist: 13, target: [0, 1.1, 0] },
    alt: { az: -30, el: 34, dist: 12.5, target: [0, 1.15, 0] },
  },
  'riviera-cable-chain': {
    area: 10,
    place(s, y) { s.add(L.cableChain(flatLoop(y, { seed: 9, v: 0.4 }), G('18k'), { r: 0.16, tube: 0.043 })); },
    main: { az: 0, el: 72, dist: 46, target: [0, 0, 0.4] },
    detail: { az: 0, el: -30, k: 0.25, target: [0, 0, 7.2] },
    alt: { az: 18, el: 40, dist: 34, target: [0, 0, 1.5] },
  },
  'medaille-coin-pendant': {
    area: 10,
    place(s, y) {
      s.add(L.cableChain(flatLoop(y, { rx: 4.6, rz: 6.6, seed: 4, v: 0.9 }), G('18k'), { r: 0.08, tube: 0.022 }));
      const c = L.coinPendant(G('21k')); c.position.set(0, y + 0.08, 8.85); s.add(c);
    },
    main: { az: 0, el: 74, dist: 46, target: [0, 0, 1.4] },
    alt: { az: 10, el: 38, dist: 22, target: [0, 0, 6.6] },
    detail: { az: 0, el: -14, k: 0.22, target: [0, 0, 8.6] },
  },
  'corde-rope-chain': {
    area: 10,
    place(s, y) { s.add(L.ropeChain(flatLoop(y, { seed: 21, rx: 5.2, rz: 7, v: 0.4 }), G('22k'), { ro: 0.055, sr: 0.07, twist: 2.2 })); },
    main: { az: 0, el: 72, dist: 46, target: [0, 0, 0.4] },
    detail: { az: 0, el: -30, k: 0.2, target: [0, 0, 7.2] },
    alt: { az: -15, el: 32, dist: 20, target: [0, 0, 5] },
  },
  'goutte-teardrop-pendant': {
    area: 10,
    place(s, y) {
      s.add(L.cableChain(flatLoop(y, { rx: 4.4, rz: 6.4, seed: 12, v: 0.9 }), G('18k'), { r: 0.07, tube: 0.02 }));
      const t = L.teardrop(G('18k'), { h: 1.7, rmax: 0.5 }); t.rotation.x = -PI / 2; t.position.set(0, y + 0.22, 8.35 + 0.85); s.add(t);
      const b = L.band(G('18k'), { R: 0.12, t: 0.05, w: 0.06 }); b.rotation.y = PI / 2; b.position.set(0, y + 0.1, 7.3 + 0.85); b.rotation.x = 0; s.add(b);
    },
    main: { az: 0, el: 74, dist: 44, target: [0, 0, 1.2] },
    alt: { az: 10, el: 40, dist: 20, target: [0, 0, 7.3] },
    detail: { az: 0, el: -16, k: 0.22, target: [0, 0, 8.9] },
  },
  'halo-bangle': {
    area: 7,
    place(s, y) {
      const a = L.bangle(G('22k')); a.rotation.y = -0.5; a.position.set(-0.6, y + 3.44, -0.6); s.add(a);
      const b = L.bangle(G('22k')); b.rotation.x = -PI / 2; b.position.set(1.4, y + 0.17, 2.6); s.add(b);
    },
    main: { az: 10, el: 24, dist: 36, target: [0.4, 2.4, 1] },
    alt: { az: -24, el: 36, dist: 36, target: [0.4, 2.4, 1] },
  },
  'arc-cuff': {
    area: 7,
    place(s, y) { const c = L.cuff(G('18k')); c.rotation.y = -0.6; c.position.set(0, y + 3.17, 0); s.add(c); },
    main: { az: 14, el: 20, dist: 30, target: [0, 2.6, 0] },
    alt: { az: -30, el: 32, dist: 30, target: [0, 2.7, 0] },
  },
  'riviera-cable-bracelet': {
    area: 7,
    place(s, y) { s.add(L.cableChain(flatLoop(y, { loose: true, rx: 3.4, rz: 3.0, seed: 3, wobble: 0.07, pinch: 0.05, rot: 0.4 }), G('18k'), { r: 0.17, tube: 0.05 })); },
    main: { az: 0, el: 66, dist: 28, target: [0, 0, 0.3] },
    alt: { az: 20, el: 34, dist: 22, target: [0, 0, 0.6] },
  },
  'classic-hoops': {
    area: 4,
    place(s, y) {
      const a = L.hoop(G('18k')); a.rotation.y = -0.6; a.position.set(-0.6, y + 0.99, -0.4); s.add(a);
      const b = L.hoop(G('18k')); b.rotation.x = -PI / 2; b.rotation.z = 0.8; b.position.set(1.1, y + 0.12, 1.2); s.add(b);
    },
    main: { az: 10, el: 24, dist: 14, target: [0.25, 0.8, 0.4] },
    alt: { az: -24, el: 34, dist: 14, target: [0.25, 0.85, 0.4] },
  },
  'petite-huggies': {
    area: 4,
    place(s, y) {
      const o = { R: 0.42, t: 0.2, w: 0.3, gap: 0.22 };
      const a = L.hoop(G('18k'), o); a.rotation.y = -0.5; a.position.set(-0.5, y + 0.62, -0.2); s.add(a);
      const b = L.hoop(G('18k'), o); b.rotation.x = -PI / 2; b.rotation.z = 0.5; b.position.set(0.75, y + 0.15, 0.7); s.add(b);
    },
    main: { az: 10, el: 24, dist: 9.5, target: [0.1, 0.5, 0.25] },
    alt: { az: -24, el: 34, dist: 9.5, target: [0.1, 0.55, 0.25] },
  },
  'goutte-drop-earrings': {
    area: 4,
    place(s, y) {
      for (const [x, z, ry] of [[-0.85, 0, 0.12], [0.85, 0.5, -0.18]]) {
        const g = new THREE.Group();
        const h = L.hoop(G('21k'), { R: 0.3, t: 0.12, w: 0.16, gap: 0.3 }); h.rotation.x = -PI / 2; h.position.set(0, 0.08, -1.25); g.add(h);
        const t = L.teardrop(G('21k'), { h: 1.5, rmax: 0.45 }); t.rotation.x = -PI / 2; t.position.set(0, 0.2, 0.2); g.add(t);
        const l = L.band(G('21k'), { R: 0.09, t: 0.04, w: 0.05 }); l.rotation.y = PI / 2; l.position.set(0, 0.13, -0.7); g.add(l);
        g.rotation.y = ry; g.position.set(x, y, z); s.add(g);
      }
    },
    main: { az: 0, el: 62, dist: 15, target: [0, 0, 0.1] },
    alt: { az: 20, el: 34, dist: 13, target: [0, 0.2, 0.3] },
  },
};

const barSizes = { '5g': [1.5, 2.5, 0.12], '10g': [1.8, 3.1, 0.14], '20g': [2.2, 3.6, 0.16], '50g': [2.6, 4.6, 0.2] };
for (const [wt, [bw, bd, bh]] of Object.entries(barSizes)) {
  const sc = bd / 3.1;
  products[`minted-gold-bar-${wt}`] = {
    area: 5 * sc, bar: true,
    place(s, y) {
      const b = L.mintedBar(G('24k', 0.09), { w: bw, d: bd, h: bh, lines: ['FINE GOLD', '24K', wt.replace('g', ' GRAMS')] });
      b.rotation.y = 0.42; b.position.set(0, y + bh / 2, 0); s.add(b);
    },
    main: { az: 6, el: 52, dist: 15 * sc, target: [0, 0, 0.1] },
    alt: { az: -30, el: 30, dist: 14 * sc, target: [0, 0.4, 0] },
  };
}
products['cast-gold-bar-100g'] = {
  area: 6,
  place(s, y) { const b = L.castBar(G('24k', 0.16), { w: 2.2, d: 4.6, h: 0.9 }); b.rotation.y = 0.45; b.position.set(0, y + 0.45, 0); s.add(b); },
  main: { az: 8, el: 38, dist: 22, target: [0, 0.5, 0] },
  alt: { az: -32, el: 24, dist: 20, target: [0, 0.8, 0] },
};

for (const [slug, p] of Object.entries(products)) {
  job(`products/${slug}-1`, 1200, 1500, (R, w, h) => {
    const s = studio(R, { bg: C.ivory, env: { high: p.bar ? 3.6 : 3 }, light: { area: p.area } });
    p.place(s, 0);
    return { scene: s, camera: cam(w, h, p.main), post: { vignette: 0.12 } };
  });
  job(`products/${slug}-2`, 1200, 1500, (R, w, h) => {
    const s = studio(R, { bg: C.sage, light: { area: p.area * 1.6, keyPos: [-38, 50, 18], amb: 0.6 } });
    const ph = 1.4;
    const pr = Math.max(3.2, p.area * 0.85);
    s.add(L.plinth(L.stoneMaterial(C.stone, 11), { r: pr, h: ph }));
    p.place(s, ph);
    const c = { ...p.alt, dist: p.alt.dist * 1.3, target: [p.alt.target[0], p.alt.target[1] + ph - 0.25, p.alt.target[2]] };
    return { scene: s, camera: cam(w, h, c), post: { vignette: 0.18 } };
  });
}

for (const [slug, p] of Object.entries(products)) {
  job(`products/${slug}-3`, 1200, 1500, (R, w, h) => {
    const s = studio(R, { bg: C.ivory, env: { high: p.bar ? 3.6 : 3 }, light: { area: p.area } });
    p.place(s, 0);
    const d = p.detail ?? {};
    const c = { ...p.main, az: (p.main.az ?? 0) + (d.az ?? -18), el: (p.main.el ?? 30) + (d.el ?? 4), dist: p.main.dist * (d.k ?? 0.52), target: d.target ?? p.main.target };
    return { scene: s, camera: cam(w, h, c), post: { vignette: 0.14 } };
  });
}

// ------------------------------------------------------------------ editorial
export function heroScene(R, o = {}) {
  const s = studio(R, { bg: C.forest, env: { floor: '#24342c' }, light: { key: 4.2, keyPos: [-45, 40, 30], area: 18, amb: 0.36, ground: '#2a3b31', spread: 10, soft: o.soft ?? 14 } });
  const tall = L.plinth(L.stoneMaterial(C.stoneWarm, 17), { r: 5, h: 10 }); tall.position.x = 9; tall.position.z = -3; s.add(tall);
  const low = L.plinth(L.stoneMaterial(C.stone, 23), { box: true, w: 9, h: 3.2, d: 7 }); low.position.set(19, 1.6, 2.5); s.add(low);
  const cx = 9, cz = -3, r = 5, top = 10, off = 0.13;
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector3(cx - 2.2 + t * 2.6, top + off, cz - 2.5 + t * 4.2)); }
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * (PI / 2); pts.push(new THREE.Vector3(cx + 0.5, top + off - (1 - Math.cos(a)) * 0.6, cz + (r - 0.6) + Math.sin(a) * 0.6 + off)); }
  for (let i = 1; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(cx + 0.5 + t * 0.3, top - 0.6 - t * (top - 1.2), cz + r + off)); }
  pts.push(new THREE.Vector3(cx + 0.9, 0.35, cz + r + 0.6));
  for (const [x, z] of [[11, 4.0], [13, 5.6], [15.2, 5.2], [15.0, 3.6], [12.8, 3.2], [11.6, 4.8], [13.6, 7.4], [10.6, 7.0]]) pts.push(new THREE.Vector3(x, 0.12, z));
  s.add(L.ropeChain(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), G('22k'), { ro: 0.06, sr: 0.075, twist: 2.1, lift: false }));
  const sig = L.signet(G('21k')); sig.rotation.y = -0.5; sig.position.set(17.6, 3.2 + 1.02, 2.2); s.add(sig);
  const bd = L.band(G('18k')); bd.rotation.x = -PI / 2; bd.position.set(20.2, 3.2 + 0.18, 3.6); s.add(bd);
  const dm = L.domeRing(G('22k')); dm.rotation.y = 0.5; dm.position.set(20.6, 3.2 + 1.0, 1.0); s.add(dm);
  const bar = L.mintedBar(G('24k', 0.09), { w: 2.6, d: 4.6, h: 0.2, lines: ['FINE GOLD', '24K', '50 GRAMS'] });
  bar.rotation.y = -0.35; bar.position.set(17.5, 0.1, 8.2); s.add(bar);
  const pool = new THREE.SpotLight('#ffd9a0', 2.2, 0, 0.42, 1, 0);
  pool.position.set(8, 40, 40); pool.target.position.set(13, 10, -34); s.add(pool); s.add(pool.target);
  const rim = new THREE.SpotLight('#fff0d8', 1.4, 0, 0.3, 1, 0);
  rim.position.set(30, 30, -20); rim.target.position.set(12, 4, 0); s.add(rim); s.add(rim.target);
  s.userData.refs = { dome: dm, signet: sig, bar };
  return s;
}
job('editorial/hero', 2400, 1400, (R, w, h) => ({ scene: heroScene(R), camera: cam(w, h, { az: 5, el: 11, dist: 55, target: [7.4, 5.6, 1.5], fov: 22 }), post: { vignette: 0.32, grain: 5 } }));
job('editorial/hero-mobile', 1080, 1600, (R, w, h) => ({ scene: heroScene(R), camera: cam(w, h, { az: 8, el: 14, dist: 62, target: [14.8, 8.8, 2], fov: 22 }), post: { vignette: 0.3, grain: 5 } }));

job('editorial/category-rings', 900, 1200, (R, w, h) => {
  const s = studio(R, { bg: C.sageDeep, light: { area: 6, amb: 0.55, ground: '#7d8a77', keyPos: [-35, 45, 22] } });
  const ph = 1.6;
  s.add(L.plinth(L.stoneMaterial(C.stone, 31), { r: 4.2, h: ph }));
  const a = L.signet(G('21k')); a.rotation.y = -0.4; a.position.set(-0.9, ph + 1.02, -0.6); s.add(a);
  const b = L.domeRing(G('22k')); b.rotation.x = -PI / 2; b.position.set(1.3, ph + 0.17, 0.6); s.add(b);
  const c = L.band(G('18k')); c.rotation.x = -PI / 2; c.position.set(-0.9, ph + 0.18, 1.6); s.add(c);
  return { scene: s, camera: cam(w, h, { az: 10, el: 30, dist: 20, target: [0, ph + 0.6, 0.4] }) };
});
job('editorial/category-necklaces', 900, 1200, (R, w, h) => {
  const s = studio(R, { bg: C.ivory, light: { area: 12, amb: 0.6, keyPos: [-40, 40, 10] } });
  const sk = L.silk('#efe8dc', { amp: 1.1, seed: 8, w: 120, d: 100, freq: 2.6, sheen: '#fff6e8' }); s.add(sk.mesh);
  const p = L.onSurface(L.looseLoop({ rx: 4.8, rz: 6.8, seed: 4, wobble: 0.06, pinch: 0.55 }), (x, z) => sk.H(x, z) + 0.02);
  s.add(L.cableChain(p, G('18k'), { r: 0.08, tube: 0.022, up: (q) => sk.normalAt(q.x, q.z) }));
  const c = L.coinPendant(G('21k'));
  let mh = -1e9; for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2; mh = Math.max(mh, sk.H(Math.cos(a) * 1.05, 7.7 + Math.sin(a) * 1.05)); }
  c.position.set(0, mh + 0.1, 7.7); const n = sk.normalAt(0, 7.7); c.rotation.set(n.z * 0.6, 0, -n.x * 0.6); s.add(c);
  return { scene: s, camera: cam(w, h, { az: 0, el: 68, dist: 46, target: [0, 0, 1.4] }) };
});
job('editorial/category-bracelets', 900, 1200, (R, w, h) => {
  const s = studio(R, { bg: C.burgundy, env: { floor: '#3a1420' }, light: { area: 8, amb: 0.4, ground: '#4b1726', keyPos: [-35, 45, 20] } });
  const ph = 2.2;
  s.add(L.plinth(L.stoneMaterial(C.stoneWarm, 41), { r: 5.5, h: ph }));
  const a = L.bangle(G('22k')); a.rotation.y = -0.45; a.position.set(-0.8, ph + 3.44, -1); s.add(a);
  const c = L.cuff(G('18k')); c.rotation.x = -PI / 2; c.rotation.z = 0.6; c.position.set(1.6, ph + 0.5, 2.0); s.add(c);
  return { scene: s, camera: cam(w, h, { az: 8, el: 26, dist: 44, target: [0.4, ph + 2.4, 0.6] }) };
});
job('editorial/category-earrings', 900, 1200, (R, w, h) => {
  const s = studio(R, { bg: C.champagne, light: { area: 5, amb: 0.65, ground: '#cdb994' } });
  const a = L.hoop(G('18k')); a.rotation.y = -0.5; a.position.set(-0.7, 0.99, -0.5); s.add(a);
  const b = L.hoop(G('18k')); b.rotation.x = -PI / 2; b.rotation.z = 0.8; b.position.set(1.0, 0.12, 1.1); s.add(b);
  const c = L.hoop(G('18k'), { R: 0.42, t: 0.2, w: 0.3, gap: 0.22 }); c.rotation.x = -PI / 2; c.position.set(-1.3, 0.15, 1.7); s.add(c);
  return { scene: s, camera: cam(w, h, { az: 10, el: 30, dist: 15, target: [0, 0.7, 0.6] }) };
});
function barsScene(R, bg = C.black, o = {}) {
  const s = studio(R, { bg, env: { floor: '#1a1a1a', back: 1.1, rim: 2.4, top: 2.0, high: 1.8 }, light: { area: 9, amb: o.amb ?? 0.25, ground: '#202020', key: 3.4, keyPos: [-40, 40, 10] } });
  const st = L.plinth(L.stoneMaterial('#2a2724', 51, { contrast: 0.6 }), { box: true, w: 14, h: 1.2, d: 10, radius: 0.1 });
  s.add(st);
  const y = 1.2;
  const sizes = [['50g', 2.6, 4.6, 0.2], ['20g', 2.2, 3.6, 0.16], ['10g', 1.8, 3.1, 0.14], ['5g', 1.5, 2.5, 0.12]];
  let k = 0;
  for (const [wt, bw, bd, bh] of sizes) {
    const b = L.mintedBar(G('24k', 0.09), { w: bw, d: bd, h: bh, lines: ['FINE GOLD', '24K', wt.replace('g', ' GRAMS')] });
    b.rotation.y = 0.25 + k * 0.32; b.position.set(-2.4 + k * 0.9, y + bh / 2 + k * 0.205, 0.5 - k * 0.15);
    s.add(b); k++;
  }
  const cb = L.castBar(G('24k', 0.16), { w: 2.2, d: 4.6, h: 0.9 }); cb.rotation.y = -0.5; cb.position.set(3.4, y + 0.45, -0.6); s.add(cb);
  return s;
}
job('editorial/category-bars', 900, 1200, (R, w, h) => ({ scene: barsScene(R), camera: cam(w, h, { az: 6, el: 36, dist: 22, target: [0.3, 1.6, 0] }) }));
job('editorial/investment', 2000, 1400, (R, w, h) => ({ scene: barsScene(R, '#1a2420'), camera: cam(w, h, { az: -8, el: 28, dist: 22, target: [0.6, 1.6, 0], fov: 24 }), post: { vignette: 0.35 } }));

job('editorial/story', 1200, 1500, (R, w, h) => {
  const s = studio(R, { bg: C.burgundy, env: { floor: '#3a1420' }, light: { area: 6, amb: 0.42, ground: '#4b1726', keyPos: [-30, 50, 25] } });
  const ph = 3.5;
  const p = L.plinth(L.stoneMaterial(C.stone, 61), { box: true, w: 6.5, h: ph, d: 6.5, radius: 0.08 }); p.rotation.y = 0.5; s.add(p);
  let y = ph;
  for (const [fn, k, h0] of [[L.band, '18k', 0.36], [L.domeRing, '22k', 0.34], [L.band, '21k', 0.36]]) {
    const r = fn(G(k)); r.rotation.x = -PI / 2; r.position.set(0, y + h0 / 2, 0); s.add(r); y += h0 * 0.98;
  }
  const sg = L.signet(G('21k')); sg.rotation.y = -0.7; sg.position.set(-2.3, 1.02, 3.6); s.add(sg);
  return { scene: s, camera: cam(w, h, { az: 12, el: 18, dist: 27, target: [-0.6, 2.6, 1.2] }), post: { vignette: 0.3 } };
});

job('editorial/campaign', 2400, 1200, (R, w, h) => {
  const s = studio(R, { bg: C.burgundy, env: { floor: '#3a1420' }, light: { area: 16, amb: 0.4, ground: '#4b1726', keyPos: [-50, 30, 10], spread: 8 } });
  const sk = L.silk('#5a1b2d', { amp: 1.8, seed: 14, w: 160, d: 120, freq: 2.0, sheen: '#c98a96', rough: 0.35 }); s.add(sk.mesh);
  const path = L.onSurface(L.looseLoop({ rx: 9, rz: 5.6, seed: 31, wobble: 0.07, pinch: 0.2, rot: 0.15 }), (x, z) => sk.H(x, z));
  s.add(L.ropeChain(path, G('22k'), { ro: 0.055, sr: 0.07, twist: 2.2 }));
  const p2 = L.onSurface(L.looseLoop({ rx: 6, rz: 3.8, seed: 5, wobble: 0.06, pinch: 0.5, cx: 3, cz: 1, rot: -0.2 }), (x, z) => sk.H(x, z) + 0.02);
  s.add(L.cableChain(p2, G('18k'), { r: 0.07, tube: 0.02, up: (q) => sk.normalAt(q.x, q.z) }));
  const t = L.teardrop(G('18k'), { h: 1.7, rmax: 0.5 }); t.rotation.x = -PI / 2; t.rotation.y = 0.3;
  t.position.set(2.0, sk.H(2.0, 5.6) + 0.35, 5.6); s.add(t);
  return { scene: s, camera: cam(w, h, { az: 0, el: 30, dist: 31, target: [-0.5, 0, -1.2], fov: 22 }), post: { vignette: 0.34 } };
});

job('editorial/social-1', 1000, 1000, (R, w, h) => {
  const s = studio(R, { bg: C.sageDeep, light: { area: 4, ground: '#7d8a77' } });
  const a = L.hoop(G('18k')); a.rotation.y = -0.4; a.position.set(0, 0.99, 0); s.add(a);
  return { scene: s, camera: cam(w, h, { az: 16, el: 18, dist: 9, target: [0.1, 0.9, 0] }) };
});
job('editorial/social-2', 1000, 1000, (R, w, h) => {
  const s = studio(R, { bg: C.ivory, light: { area: 6 } });
  s.add(L.ropeChain(flatLoop(0, { loose: true, rx: 3.2, rz: 2.6, seed: 77, wobble: 0.2, pinch: 0.1 }), G('22k'), { ro: 0.055, sr: 0.07, twist: 2.2 }));
  return { scene: s, camera: cam(w, h, { az: 10, el: 40, dist: 11, target: [1.5, 0, 1.5] }) };
});
job('editorial/social-3', 1000, 1000, (R, w, h) => {
  const s = studio(R, { bg: C.forest, env: { floor: '#24342c' }, light: { area: 4, amb: 0.35, ground: '#2a3b31' } });
  const b = L.mintedBar(G('24k', 0.09), { lines: ['FINE GOLD', '24K', '10 GRAMS'] }); b.rotation.y = 0.3; b.position.y = 0.08; s.add(b);
  return { scene: s, camera: cam(w, h, { az: 0, el: 58, dist: 9, target: [0, 0, 0.1] }) };
});
job('editorial/social-4', 1000, 1000, (R, w, h) => {
  const s = studio(R, { bg: C.burgundy, env: { floor: '#3a1420' }, light: { area: 4, amb: 0.4, ground: '#4b1726' } });
  const r = L.signet(G('21k')); r.rotation.y = -0.5; r.position.y = 1.02; s.add(r);
  return { scene: s, camera: cam(w, h, { az: 8, el: 34, dist: 8, target: [0, 1.1, 0] }) };
});
job('editorial/social-5', 1000, 1000, (R, w, h) => {
  const s = studio(R, { bg: C.champagne, light: { area: 8, ground: '#cdb994' } });
  for (let i = 0; i < 3; i++) { const b = L.bangle(G(['18k', '22k', '21k'][i])); b.rotation.x = -PI / 2; b.position.set(i * 0.5 - 0.5, 0.17 + i * 0.34, i * 0.4 - 0.4); s.add(b); }
  return { scene: s, camera: cam(w, h, { az: 0, el: 50, dist: 26, target: [0, 0.4, 0] }) };
});
job('editorial/social-6', 1000, 1000, (R, w, h) => {
  const s = studio(R, { bg: C.ivory, light: { area: 6, keyPos: [-40, 40, 10] } });
  const sk = L.silk('#efe8dc', { amp: 0.6, seed: 3, w: 80, d: 80, freq: 4, sheen: '#fff6e8' }); s.add(sk.mesh);
  const c = L.coinPendant(G('21k')); let mh = -1e9; for (let i = 0; i < 16; i++) { const a = (i / 16) * PI * 2; mh = Math.max(mh, sk.H(Math.cos(a) * 1.1, Math.sin(a) * 1.1)); } c.position.set(0, mh + 0.1, 0); s.add(c);
  return { scene: s, camera: cam(w, h, { az: 0, el: 62, dist: 9.5, target: [0, 0, -0.2] }) };
});

// ------------------------------------------------------------------ films (seamless loops)
// update(t) receives t in [0, 1); every motion is periodic so frame 0 follows the last frame.
export const films = {};
const TAU = Math.PI * 2;
function heroFilm(w, h, c, amp = 6.5) {
  return (R) => {
    const scene = heroScene(R, { soft: 10 });
    const cam0 = cam(w, h, c);
    const golds = [];
    scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.metalness > 0.5 && !golds.includes(m)) golds.push(m); });
    const glint = new THREE.DirectionalLight('#fff4dc', 0);
    scene.add(glint); scene.add(glint.target); glint.target.position.set(14, 4, 2);
    const { dome } = scene.userData.refs;
    const update = (t) => {
      const a = Math.sin(TAU * t);
      const camera = cam(w, h, { ...c, az: c.az + amp * a, el: c.el + 1.2 * Math.sin(TAU * t + 1.1), dist: c.dist * (1 - 0.035 * Math.cos(TAU * t)) });
      cam0.position.copy(camera.position); cam0.quaternion.copy(camera.quaternion);
      // reflections glide across the gold: rotate the studio environment
      for (const m of golds) m.envMapRotation.set(0, 0.55 * Math.sin(TAU * t - 0.6), 0);
      // a soft travelling glint
      glint.position.set(14 + 40 * Math.cos(TAU * t), 28, 2 + 30 * Math.sin(TAU * t));
      glint.intensity = 1.1 + 0.6 * Math.sin(TAU * t * 2);
      dome.rotation.y = 0.5 + TAU * t;
    };
    return { scene, camera: cam0, update, post: { vignette: 0.32, grain: 2.5 } };
  };
}
films['hero-desktop'] = { w: 1920, h: 1080, seconds: 12, fps: 24, build: heroFilm(1920, 1080, { az: 5, el: 11, dist: 66, target: [6.8, 5.4, 1.5], fov: 22 }, 4.0) };
films['hero-mobile'] = { w: 1080, h: 1920, seconds: 12, fps: 24, build: heroFilm(1080, 1920, { az: 8, el: 15, dist: 122, target: [13.6, -3.2, 2], fov: 22 }, 3.0) };
