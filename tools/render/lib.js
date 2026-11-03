// Studio toolkit for rendering gold jewellery still-life imagery. Units: centimetres.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export { THREE };

export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

const GOLD = {
  '18k': [1.0, 0.72, 0.36],
  '21k': [1.0, 0.7, 0.32],
  '22k': [1.0, 0.69, 0.3],
  '24k': [1.0, 0.67, 0.26],
};

export function gold(k = '18k', roughness = 0.14, extra = {}) {
  const m = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness, envMapIntensity: 1.0, ...extra });
  const c = GOLD[k];
  m.color.setRGB(c[0], c[1], c[2]);
  return m;
}

// ---------------------------------------------------------------- environment
export function studioEnv(renderer, o = {}) {
  const { base = '#1d1b18', floor = '#5a554c', key = 12, fill = 6, rim = 5, top = 5, front = 3.2, back = 2.6, high = 3 } = o;
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), new THREE.MeshBasicMaterial({ color: base, side: THREE.BackSide })));
  const fl = new THREE.Mesh(new THREE.CircleGeometry(59, 64), new THREE.MeshBasicMaterial({ color: floor }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = -3; env.add(fl);
  const panel = (w, h, x, y, z, i, tint = [1, 0.95, 0.86]) => {
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    m.color.setRGB(i * tint[0], i * tint[1], i * tint[2]);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z); p.lookAt(0, 0, 0); env.add(p);
  };
  panel(34, 34, 2, 44, 2, top);
  panel(9, 50, -36, 12, 14, key);
  panel(7, 44, 36, 14, -6, fill);
  panel(56, 7, 0, 16, -40, rim);
  panel(60, 22, 0, 22, -42, back, [1, 0.93, 0.82]);
  panel(30, 12, 6, 6, 40, front);
  panel(44, 18, 0, 40, -34, high, [1, 0.96, 0.9]);
  panel(4, 36, -16, 10, 38, key * 0.7);
  panel(4, 36, 22, 10, 34, fill * 0.6);
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(env, 0.0, 0.1, 200).texture;
  pm.dispose();
  return t;
}

// ---------------------------------------------------------------- backdrop
export function sweep(color, o = {}) {
  const { width = 400, front = 160, back = 30, radius = 40, height = 260, rough = 1, envI = 0.0 } = o;
  const prof = [];
  const nF = 24;
  for (let i = 0; i <= nF; i++) prof.push([front - (front + back) * (i / nF), 0]);
  const nA = 40;
  for (let i = 1; i <= nA; i++) {
    const a = (i / nA) * Math.PI / 2;
    prof.push([-back - Math.sin(a) * radius, radius - Math.cos(a) * radius]);
  }
  const nU = 10;
  for (let i = 1; i <= nU; i++) prof.push([-back - radius, radius + (height - radius) * (i / nU)]);
  const pos = [], idx = [], nx = 6;
  for (let j = 0; j < prof.length; j++) for (let i = 0; i <= nx; i++) pos.push(-width / 2 + (width * i) / nx, prof[j][1], prof[j][0]);
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: envI, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------- lights
export function lights(scene, o = {}) {
  const { key = 3.6, keyPos = [-30, 55, 30], area = 12, soft = 14, spread = 7, amb = 0.75, warm = '#fff7ec', sky = '#fbfaf6', ground = '#e2ddd3', mapSize = 1536, fillI = 0.35 } = o;
  const kp = new THREE.Vector3(...keyPos);
  const side = new THREE.Vector3().crossVectors(kp, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(side, kp).normalize();
  const out = [];
  for (let i = 0; i < soft; i++) {
    const a = i * 2.39996, rr = spread * Math.sqrt((i + 0.5) / soft);
    const p = kp.clone().add(side.clone().multiplyScalar(Math.cos(a) * rr)).add(up.clone().multiplyScalar(Math.sin(a) * rr));
    const d = new THREE.DirectionalLight(warm, key / soft);
    d.position.copy(p); d.castShadow = true;
    d.shadow.mapSize.set(mapSize, mapSize);
    const c = d.shadow.camera;
    c.left = -area; c.right = area; c.top = area; c.bottom = -area; c.near = 1; c.far = 400;
    d.shadow.bias = -0.0003; d.shadow.normalBias = 0.008;
    scene.add(d); scene.add(d.target); out.push(d);
  }
  const f = new THREE.DirectionalLight('#f4f1ff', fillI); f.position.set(35, 25, 20); scene.add(f);
  scene.add(new THREE.HemisphereLight(sky, ground, amb));
  return out;
}

// ---------------------------------------------------------------- textures
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export function stoneTexture(base = '#d9cfbf', seed = 4, o = {}) {
  const { size = 1024, veins = 90, pits = 1800, contrast = 0.22 } = o;
  const r = rng(seed); const c = canvas(size, size); const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, size, size);
  for (let i = 0; i < veins; i++) {
    const y = r() * size, h = 2 + r() * 14, l = r() > 0.5 ? 255 : 0;
    x.fillStyle = `rgba(${l},${l},${l},${(0.015 + r() * 0.05) * contrast})`;
    x.beginPath();
    x.ellipse(r() * size, y, 30 + r() * size * 0.25, h * 0.6, (r() - 0.5) * 0.08, 0, Math.PI * 2);
    x.fill();
  }
  for (let i = 0; i < pits; i++) {
    x.fillStyle = `rgba(60,48,36,${(0.06 + r() * 0.18) * contrast})`;
    x.beginPath(); x.ellipse(r() * size, r() * size, 0.6 + r() * 3.4, 0.4 + r() * 1.6, 0, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

export function stoneMaterial(base = '#d9cfbf', seed = 4, o = {}) {
  const map = stoneTexture(base, seed, o);
  return new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.35, roughness: o.rough ?? 0.92, metalness: 0, envMapIntensity: o.envI ?? 0.02, color: '#ffffff' });
}

function textCanvas(draw, w, h, blur = 2) {
  const c = canvas(w, h); const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
  x.filter = `blur(${blur}px)`;
  draw(x, w, h);
  return c;
}

// ---------------------------------------------------------------- generic helpers
export class FnCurve extends THREE.Curve {
  constructor(fn) { super(); this.fn = fn; }
  getPoint(t, target = new THREE.Vector3()) { return target.copy(this.fn(t)); }
}

function finish(mesh, cast = true) { mesh.castShadow = cast; mesh.receiveShadow = true; return mesh; }

// ---------------------------------------------------------------- rings / bangles / hoops
// Ring lies in the XY plane, axis = z, inner radius R, top at +y.
export function ringGeo(o = {}) {
  const { R = 0.85, t = 0.18, w = 0.32, n = 2.4, nIn = 7, segU = 360, segV = 64, t0 = 0, t1 = Math.PI * 2, closed = true, tFn = null, wFn = null, flatY = null } = o;
  const nu = closed ? segU : segU + 1;
  const pos = new Float32Array(nu * segV * 3);
  let k = 0;
  for (let i = 0; i < nu; i++) {
    const u = i / segU, th = t0 + (t1 - t0) * u;
    const tt = (tFn ? tFn(th, u) : 1) * t, ww = (wFn ? wFn(th, u) : 1) * w;
    const rc = R + tt / 2;
    for (let j = 0; j < segV; j++) {
      const ph = (j / segV) * Math.PI * 2, c = Math.cos(ph), s = Math.sin(ph);
      const ex = c < 0 ? nIn : n;
      const ro = (tt / 2) * Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
      const ax = (ww / 2) * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
      const rr = rc + ro;
      let y = Math.sin(th) * rr;
      if (flatY !== null && y > flatY) y = flatY;
      pos[k++] = Math.cos(th) * rr; pos[k++] = y; pos[k++] = ax;
    }
  }
  const idx = [];
  const rows = closed ? segU : segU;
  for (let i = 0; i < rows; i++) {
    const i2 = closed ? (i + 1) % segU : i + 1;
    for (let j = 0; j < segV; j++) {
      const j2 = (j + 1) % segV;
      const a = i * segV + j, b = i * segV + j2, c = i2 * segV + j, d = i2 * segV + j2;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export const bump = (center, width, amp = 1) => (th) => {
  let d = th - center; d = Math.atan2(Math.sin(d), Math.cos(d));
  return 1 + amp * Math.exp(-((d / width) ** 2));
};

const endTaper = (edge = 0.02, min = 0) => (th, u) => {
  const e = Math.min(u, 1 - u) / edge;
  if (e >= 1) return 1;
  return min + (1 - min) * Math.sqrt(Math.max(0, 1 - (1 - e) ** 2));
};

export function band(mat, o = {}) { return finish(new THREE.Mesh(ringGeo({ t: 0.17, w: 0.36, n: 2.2, ...o }), mat)); }

export function signet(mat, o = {}) {
  const { R = 0.86 } = o;
  const g = ringGeo({ R, t: 0.16, w: 0.3, n: 3.2, nIn: 8, segU: 480, segV: 72,
    tFn: bump(Math.PI / 2, 0.62, 2.6), wFn: bump(Math.PI / 2, 0.55, 1.75), flatY: R + 0.5 });
  return finish(new THREE.Mesh(g, mat));
}

export function domeRing(mat, o = {}) {
  const g = ringGeo({ R: 0.86, t: 0.14, w: 0.34, n: 2.1, nIn: 8, segU: 480, segV: 72, tFn: bump(Math.PI / 2, 0.95, 2.4), wFn: bump(Math.PI / 2, 1.0, 1.9) });
  return finish(new THREE.Mesh(g, mat));
}

export function ropeRing(mat, o = {}) {
  const { R = 0.86, ro = 0.075, sr = 0.085, k = 22, strands = 2 } = o;
  const grp = new THREE.Group();
  for (let s = 0; s < strands; s++) {
    const p0 = (s / strands) * Math.PI * 2;
    const curve = new FnCurve((u) => {
      const th = u * Math.PI * 2, a = k * th + p0, rc = R + ro + sr;
      const rr = rc + ro * Math.cos(a);
      return new THREE.Vector3(Math.cos(th) * rr, Math.sin(th) * rr, ro * Math.sin(a));
    });
    grp.add(finish(new THREE.Mesh(new THREE.TubeGeometry(curve, 1400, sr, 16, true), mat)));
  }
  return grp;
}

export function bangle(mat, o = {}) {
  return finish(new THREE.Mesh(ringGeo({ R: 3.1, t: 0.34, w: 0.34, n: 2, nIn: 2, segU: 480, segV: 48, ...o }), mat));
}

export function cuff(mat, o = {}) {
  const gap = o.gap ?? 0.55;
  const t0 = -Math.PI / 2 + gap / 2, t1 = -Math.PI / 2 + Math.PI * 2 - gap / 2;
  const taper = endTaper(0.012, 0);
  const g = ringGeo({ R: 3.0, t: 0.2, w: 1.0, n: 2.3, nIn: 6, segU: 600, segV: 64, t0, t1, closed: false,
    wFn: (th, u) => (0.55 + 0.45 * Math.sin(Math.PI * u) ** 0.8) * taper(th, u),
    tFn: (th, u) => (0.7 + 0.3 * Math.sin(Math.PI * u)) * taper(th, u) });
  const grp = new THREE.Group();
  grp.add(finish(new THREE.Mesh(g, mat)));
  for (const th of [t0 + 0.035, t1 - 0.035]) {
    const s = finish(new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 32), mat));
    s.position.set(Math.cos(th) * 3.12, Math.sin(th) * 3.12, 0);
    grp.add(s);
  }
  return grp;
}

export function hoop(mat, o = {}) {
  const { R = 0.75, t = 0.24, w = 0.24, gap = 0.16 } = o;
  const t0 = Math.PI / 2 + gap / 2, t1 = Math.PI / 2 + Math.PI * 2 - gap / 2;
  const taper = endTaper(0.03, 0.35);
  const g = ringGeo({ R, t, w, n: 2, nIn: 2, segU: 360, segV: 40, t0, t1, closed: false, tFn: taper, wFn: taper });
  const grp = new THREE.Group();
  grp.add(finish(new THREE.Mesh(g, mat)));
  const post = finish(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 16), mat));
  post.rotation.z = Math.PI / 2 - 0.25;
  post.position.set(Math.cos(t1) * (R + t / 2) + 0.12, Math.sin(t1) * (R + t / 2) + 0.03, 0);
  grp.add(post);
  return grp;
}

// ---------------------------------------------------------------- chains
function frames(path, M) {
  const P = [], T = [], N = [], B = [];
  for (let i = 0; i <= M; i++) { P.push(path.getPointAt(i / M)); T.push(path.getTangentAt(i / M).normalize()); }
  let n = new THREE.Vector3(0, 1, 0);
  if (Math.abs(n.dot(T[0])) > 0.9) n.set(1, 0, 0);
  n.sub(T[0].clone().multiplyScalar(n.dot(T[0]))).normalize();
  for (let i = 0; i <= M; i++) {
    if (i > 0) { n = n.clone().sub(T[i].clone().multiplyScalar(n.dot(T[i]))).normalize(); }
    N.push(n.clone()); B.push(new THREE.Vector3().crossVectors(T[i], n));
  }
  return { P, T, N, B };
}

// Cable chain: interlocking oval links along a path. up = surface normal used for "flat" links.
export function cableChain(path, mat, o = {}) {
  const { r = 0.13, tube = 0.035, sx = 1.45, lift = true, jitter = 0.18, seed = 7, up = null, flatten = 1 } = o;
  const geo = new THREE.TorusGeometry(r, tube, 16, 48);
  geo.scale(sx, 1, flatten);
  const pitch = (2 * r - tube) * sx - tube * 1.05;
  const L = path.getLength();
  const n = Math.floor(L / pitch);
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const rnd = rng(seed);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), tw = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const u = (i * pitch) / L;
    const p = path.getPointAt(u), T = path.getTangentAt(u).normalize();
    const U = (typeof up === 'function' ? up(p) : up || new THREE.Vector3(0, 1, 0)).clone();
    const S = new THREE.Vector3().crossVectors(U, T).normalize();
    const Nn = new THREE.Vector3().crossVectors(T, S).normalize();
    const standing = i % 2 === 1;
    const yAxis = standing ? Nn : S, zAxis = standing ? S.clone().negate() : Nn;
    m.makeBasis(T, yAxis, zAxis);
    q.setFromRotationMatrix(m);
    tw.setFromAxisAngle(T, (rnd() - 0.5) * jitter);
    q.premultiply(tw);
    const pos = p.clone();
    if (lift) pos.add(Nn.clone().multiplyScalar(standing ? r + tube * 0.9 : tube * flatten));
    m.compose(pos, q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return finish(mesh);
}

// Rope chain: twisted strands around a path.
export function ropeChain(path, mat, o = {}) {
  const { ro = 0.07, sr = 0.075, strands = 3, twist = 2.4, lift = true, M = 1600 } = o;
  const F = frames(path, M);
  const L = path.getLength();
  const grp = new THREE.Group();
  for (let s = 0; s < strands; s++) {
    const p0 = (s / strands) * Math.PI * 2;
    const curve = new FnCurve((u) => {
      const f = Math.min(M, Math.max(0, u * M)), i = Math.min(M - 1, Math.floor(f)), a = f - i;
      const P = F.P[i].clone().lerp(F.P[i + 1], a), N = F.N[i].clone().lerp(F.N[i + 1], a).normalize(), B = F.B[i].clone().lerp(F.B[i + 1], a).normalize();
      const ang = p0 + u * L * twist * Math.PI * 2;
      const v = P.add(N.multiplyScalar(ro * Math.cos(ang))).add(B.multiplyScalar(ro * Math.sin(ang)));
      if (lift) v.y += ro + sr;
      return v;
    });
    grp.add(finish(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.floor(L * 90), sr, 10, false), mat)));
  }
  return grp;
}

// Smooth loose necklace outline lying on a surface (closed loop), returned as CatmullRom.
export function looseLoop(o = {}) {
  const { cx = 0, cz = 0, rx = 8, rz = 6, seed = 3, wobble = 0.12, points = 18, rot = 0, height = () => 0, pinch = 0.25 } = o;
  const r = rng(seed); const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    let k = 1 + (r() - 0.5) * 2 * wobble;
    // heart-like pinch at the top (clasp area) and drop at bottom (pendant)
    const pz = Math.sin(a) < 0 ? 1 + pinch * Math.sin(a) ** 4 : 1;
    let x = Math.cos(a) * rx * k, z = Math.sin(a) * rz * k * pz;
    const xr = x * Math.cos(rot) - z * Math.sin(rot), zr = x * Math.sin(rot) + z * Math.cos(rot);
    pts.push(new THREE.Vector3(cx + xr, 0, cz + zr));
  }
  pts.forEach((p) => (p.y = height(p.x, p.z)));
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}

export function necklaceShape(o = {}) {
  const { rx = 5, rz = 7, v = 1.2, seed = 3, wobble = 0.03, cx = 0, cz = 0, rot = 0, n = 28 } = o;
  const r = rng(seed); const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * wobble;
    let x = rx * Math.sin(t) * (0.62 + 0.38 * (1 - Math.cos(t)) / 2) * k;
    let d = t - Math.PI;
    let z = -rz * Math.cos(t) * k + v * Math.exp(-(d * d) / 0.18);
    const xr = x * Math.cos(rot) - z * Math.sin(rot), zr = x * Math.sin(rot) + z * Math.cos(rot);
    pts.push(new THREE.Vector3(cx + xr, 0, cz + zr));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}

export function draped(points, closed = false) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
}

// ---------------------------------------------------------------- pendants
function monogramCanvas(text = 'LG', size = 512, blur = 3) {
  return textCanvas((x, w, h) => {
    x.fillStyle = '#fff';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `400 ${size * 0.42}px "Cormorant Garamond", "Times New Roman", serif`;
    x.fillText(text, w / 2, h / 2 + size * 0.02);
    x.lineWidth = size * 0.012; x.strokeStyle = '#fff';
    x.beginPath(); x.arc(w / 2, h / 2, size * 0.4, 0, Math.PI * 2); x.stroke();
  }, size, size, blur);
}

export function coinPendant(mat, o = {}) {
  const { R = 1.05, th = 0.16, mono = true } = o;
  const prof = [
    [0, th * 0.42], [R * 0.82, th * 0.42], [R * 0.86, th * 0.5], [R * 0.95, th * 0.52], [R, th * 0.3],
    [R, -th * 0.3], [R * 0.95, -th * 0.5], [0, -th * 0.5],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(prof, 128);
  const grp = new THREE.Group();
  grp.add(finish(new THREE.Mesh(g, mat)));
  if (mono) {
    const c = monogramCanvas('LG', 1024, 5);
    const t = new THREE.CanvasTexture(c);
    const rc = textCanvas((x, w, h) => { x.drawImage(c, 0, 0); }, 1024, 1024, 0);
    const m2 = mat.clone(); m2.bumpMap = t; m2.bumpScale = 1.4;
    const rt = new THREE.CanvasTexture(rc);
    m2.roughnessMap = rt; m2.roughness = 1;
    // remap: field polished, letters satin
    const rcx = rc.getContext('2d'); const id = rcx.getImageData(0, 0, 1024, 1024);
    for (let i = 0; i < id.data.length; i += 4) { const v = id.data[i] / 255; const rv = (0.12 + v * 0.35) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = rv; }
    rcx.putImageData(id, 0, 0); rt.needsUpdate = true;
    const face = new THREE.Mesh(new THREE.CircleGeometry(R * 0.81, 96), m2);
    face.rotation.x = -Math.PI / 2; face.position.y = th * 0.42 + 0.0015;
    face.receiveShadow = true;
    grp.add(face);
  }
  const bail = finish(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 16, 40), mat));
  bail.position.set(0, 0, -R - 0.12); bail.rotation.y = Math.PI / 2;
  grp.add(bail);
  return grp;
}

export function teardrop(mat, o = {}) {
  const { h = 1.6, rmax = 0.55, flat = 0.6 } = o;
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64; // 0 bottom -> 1 top
    const a = t * Math.PI;
    const r = rmax * Math.sin(a) * Math.pow(1 - t, 0.55) * 1.25;
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), -Math.cos(a) * h * 0.5));
  }
  const g = new THREE.LatheGeometry(pts, 96);
  g.scale(1, 1, flat);
  return finish(new THREE.Mesh(g, mat));
}

// ---------------------------------------------------------------- gold bars
function barFaceCanvases(o = {}) {
  const { w = 1024, h = 1600, lines = ['FINE GOLD', '24K'], brand = true } = o;
  const draw = (x, W, H) => {
    x.fillStyle = '#fff'; x.strokeStyle = '#fff';
    x.lineWidth = W * 0.008;
    const m = W * 0.06;
    x.strokeRect(m, m, W - 2 * m, H - 2 * m);
    x.lineWidth = W * 0.003;
    x.strokeRect(m * 1.45, m * 1.45, W - 2.9 * m, H - 2.9 * m);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if (brand) {
      x.font = `500 ${W * 0.2}px "Cormorant Garamond", "Times New Roman", serif`;
      x.fillText('LG', W / 2, H * 0.24);
      x.beginPath(); x.lineWidth = W * 0.005; x.arc(W / 2, H * 0.24, W * 0.16, 0, Math.PI * 2); x.stroke();
      x.font = `500 ${W * 0.065}px "Cormorant Garamond", "Times New Roman", serif`;
      x.fillText('L A   L U X U R Y   G O L D', W / 2, H * 0.4);
    }
    x.fillRect(W * 0.3, H * 0.47, W * 0.4, W * 0.004);
    x.font = `500 ${W * 0.085}px "Cormorant Garamond", "Times New Roman", serif`;
    x.fillText(lines[0], W / 2, H * 0.58);
    x.font = `500 ${W * 0.17}px "Cormorant Garamond", "Times New Roman", serif`;
    x.fillText(lines[1], W / 2, H * 0.74);
    if (lines[2]) { x.font = `500 ${W * 0.06}px "Cormorant Garamond", serif`; x.fillText(lines[2], W / 2, H * 0.86); }
  };
  const bumpC = textCanvas(draw, w, h, 3);
  const roughC = textCanvas(draw, w, h, 1);
  const rx = roughC.getContext('2d'); const id = rx.getImageData(0, 0, w, h);
  for (let i = 0; i < id.data.length; i += 4) { const v = id.data[i] / 255; const rv = (0.1 + v * 0.42) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = rv; }
  rx.putImageData(id, 0, 0);
  return { bumpC, roughC };
}

export function mintedBar(mat, o = {}) {
  const { w = 1.9, d = 3.1, h = 0.16, lines } = o; // lies flat, long side along z
  const grp = new THREE.Group();
  const body = finish(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, 0.07), mat));
  grp.add(body);
  const { bumpC, roughC } = barFaceCanvases({ lines });
  const m2 = mat.clone();
  m2.bumpMap = new THREE.CanvasTexture(bumpC); m2.bumpScale = 1.1;
  m2.roughnessMap = new THREE.CanvasTexture(roughC); m2.roughness = 1;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, d - 0.16), m2);
  face.rotation.x = -Math.PI / 2; face.position.y = h / 2 + 0.0008; face.receiveShadow = true;
  grp.add(face);
  return grp;
}

export function castBar(mat, o = {}) {
  const { w = 2.4, d = 5.0, h = 1.0, taper = 0.84, seed = 2 } = o;
  const g = new THREE.BoxGeometry(w, h, d, 24, 4, 40);
  const p = g.attributes.position; const r = rng(seed);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y > 0) { p.setX(i, p.getX(i) * taper); p.setZ(i, p.getZ(i) * (taper + 0.08)); }
  }
  g.computeVertexNormals();
  // cast surface: subtle noise bump
  const c = canvas(512, 512); const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const v = 100 + r() * 60; x.fillStyle = `rgba(${v},${v},${v},0.35)`; x.beginPath(); x.ellipse(r() * 512, r() * 512, 2 + r() * 10, 1 + r() * 6, r() * 3, 0, Math.PI * 2); x.fill(); }
  const m = mat.clone(); m.bumpMap = new THREE.CanvasTexture(c); m.bumpScale = 0.35; m.roughness = Math.max(mat.roughness, 0.24);
  const grp = new THREE.Group();
  grp.add(finish(new THREE.Mesh(g, m)));
  const { bumpC, roughC } = barFaceCanvases({ w: 1024, h: 2048, lines: ['FINE GOLD', '24K'] });
  const m2 = mat.clone(); m2.bumpMap = new THREE.CanvasTexture(bumpC); m2.bumpScale = 1.6; m2.roughnessMap = new THREE.CanvasTexture(roughC); m2.roughness = 1.3;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * taper - 0.25, d * (taper + 0.08) - 0.35), m2);
  face.rotation.x = -Math.PI / 2; face.position.y = h / 2 + 0.002; face.receiveShadow = true;
  grp.add(face);
  return grp;
}

// ---------------------------------------------------------------- props
export function plinth(mat, o = {}) {
  const { r = 6, h = 3, seg = 128, box = false, w = 10, d = 10, radius = 0.15 } = o;
  const g = box ? new RoundedBoxGeometry(w, h, d, 4, radius) : new THREE.CylinderGeometry(r, r, h, seg, 1);
  const mesh = finish(new THREE.Mesh(g, mat));
  mesh.position.y = h / 2;
  return mesh;
}

export function silk(color, o = {}) {
  const { w = 120, d = 90, seg = 360, amp = 1.6, seed = 3, sheen = '#ffffff', rough = 0.4, waves: nW = 8, ridge = 0.5, freq = 1 } = o;
  const r = rng(seed); const waves = [];
  for (let i = 0; i < nW; i++) {
    const a = r() * Math.PI * 0.6 + Math.PI * 0.2;
    waves.push({ dx: Math.cos(a), dz: Math.sin(a), f: (0.05 + r() * 0.14) * freq, p: r() * 6.28, A: ((0.4 + r()) * amp) / (1 + i * 0.45), ridge: r() < ridge });
  }
  let off = 0;
  const H0 = (x, z) => {
    let y = 0;
    for (const W of waves) {
      const s = Math.sin((x * W.dx + z * W.dz) * W.f + W.p);
      y += W.ridge ? W.A * (1 - Math.abs(s)) * 1.2 - W.A * 0.5 : W.A * s;
    }
    return y;
  };
  let mn = Infinity;
  for (let i = 0; i <= 80; i++) for (let j = 0; j <= 80; j++) mn = Math.min(mn, H0(-w / 2 + (w * i) / 80, -d / 2 + (d * j) / 80));
  off = 0.05 - mn;
  const H = (x, z) => H0(x, z) + off;
  const g = new THREE.PlaneGeometry(w, d, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: rough, sheen: 1, sheenColor: new THREE.Color(sheen), sheenRoughness: 0.35, envMapIntensity: o.envI ?? 0.03 });
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true; mesh.castShadow = true;
  const normalAt = (x, z) => {
    const e = 0.05;
    return new THREE.Vector3(-(H(x + e, z) - H(x - e, z)) / (2 * e), 1, -(H(x, z + e) - H(x, z - e)) / (2 * e)).normalize();
  };
  return { mesh, H, normalAt };
}

export function camera(w, h, o = {}) {
  const { fov = 26, pos = [0, 10, 20], target = [0, 0, 0] } = o;
  const c = new THREE.PerspectiveCamera(fov, w / h, 0.5, 2000);
  c.position.set(...pos); c.lookAt(...target);
  return c;
}

// Place a camera on a sphere around target: az (deg, 0 = +z), el (deg), dist.
export function orbit(w, h, { az = 0, el = 30, dist = 20, target = [0, 0, 0], fov = 26 } = {}) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const pos = [target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a)];
  return camera(w, h, { fov, pos, target });
}

// Resample a curve so that every point sits on the height field H(x,z).
export function onSurface(curve, H, n = 400, closed = true) {
  const pts = curve.getSpacedPoints(n);
  if (closed) pts.pop();
  pts.forEach((p) => (p.y = H(p.x, p.z)));
  return new THREE.CatmullRomCurve3(pts, closed, 'centripetal');
}
