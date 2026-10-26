// MasterDrive 3D stage: builds a stylised car from a side profile and shows it
// from outside (orbit) or from the driver's seat (look around).
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

// Side profiles: x is a fraction of length (rear = 0, front = 1), y in metres.
// cab = indices of [rear beltline, rear roof, front roof, front beltline].
const BODIES = {
  sedan:  { L: 4.75, W: 1.86, r: 0.35, c: 0.17, wx: [0.19, 0.8], cab: [3, 4, 5, 6],
    pts: [[0, .42], [0, .8], [.04, .9], [.26, .97], [.38, 1.42], [.6, 1.45], [.76, 1.02], [.95, .88], [1, .7], [1, .42]] },
  suv:    { L: 4.8, W: 1.95, r: 0.4, c: 0.22, wx: [0.18, 0.81], cab: [1, 2, 3, 4],
    pts: [[0, .5], [0, 1.08], [.03, 1.64], [.7, 1.72], [.81, 1.16], [.97, 1.04], [1, .8], [1, .5]] },
  sports: { L: 4.52, W: 1.94, r: 0.36, c: 0.13, wx: [0.2, 0.8], cab: [3, 4, 5, 6],
    pts: [[0, .38], [0, .8], [.12, .87], [.29, .98], [.43, 1.2], [.56, 1.22], [.73, .9], [.96, .7], [1, .5], [1, .38]] },
  hatch:  { L: 4.05, W: 1.8, r: 0.33, c: 0.16, wx: [0.17, 0.81], cab: [1, 2, 3, 4],
    pts: [[0, .42], [0, .98], [.05, 1.46], [.6, 1.52], [.77, 1.02], [.96, .88], [1, .66], [1, .42]] },
  pickup: { L: 5.35, W: 2.0, r: 0.41, c: 0.25, wx: [0.17, 0.8], cab: [2, 3, 4, 5],
    pts: [[0, .55], [0, 1.14], [.4, 1.14], [.42, 1.82], [.68, 1.84], [.77, 1.22], [.97, 1.14], [1, .86], [1, .55]] },
  van:    { L: 5.1, W: 2.0, r: 0.36, c: 0.18, wx: [0.17, 0.82], cab: [1, 2, 3, 4],
    pts: [[0, .46], [0, 1.2], [.01, 1.94], [.7, 1.98], [.86, 1.22], [.98, 1.08], [1, .78], [1, .46]] },
};
const BEVEL = 0.045;

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function inset(p, centre, d) {
  const dx = centre.x - p.x, dy = centre.y - p.y, len = Math.hypot(dx, dy) || 1;
  return new THREE.Vector2(p.x + dx / len * d, p.y + dy / len * d);
}

function buildCar(car, mats) {
  const b = BODIES[car.body] || BODIES.sedan;
  const { L, W, r, c } = b;
  const P = b.pts.map(([x, y]) => new THREE.Vector2(x * L, y));
  const arch = r + 0.1;
  const group = new THREE.Group();

  // Body: outline from rear bottom, over the top, then back along the floor around both wheel arches.
  const shape = new THREE.Shape();
  shape.moveTo(P[0].x, c);
  P.forEach(p => shape.lineTo(p.x, p.y));
  shape.lineTo(L, c);
  const [rx, fx] = b.wx.map(f => f * L);
  shape.lineTo(fx + arch, c);
  shape.absarc(fx, r, arch, 0, Math.PI, false);
  shape.lineTo(rx + arch, c);
  shape.absarc(rx, r, arch, 0, Math.PI, false);
  shape.lineTo(0, c);
  const depth = W - BEVEL * 2;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 5, curveSegments: 24,
  });
  bodyGeo.translate(0, 0, -depth / 2);
  const body = new THREE.Mesh(bodyGeo, mats.paint);
  group.add(body);

  // Glass: side windows poke out of the flanks; windscreen, roof and rear glass sit over the top.
  const cab = b.cab.map(i => P[i]);
  const centre = cab.reduce((a, p) => a.add(p.clone()), new THREE.Vector2()).multiplyScalar(1 / 4);
  const side = new THREE.Shape(cab.map(p => inset(p, centre, 0.08)));
  const sideGeo = new THREE.ExtrudeGeometry(side, { depth: W + 0.012, bevelEnabled: false });
  sideGeo.translate(0, 0, -(W + 0.012) / 2);
  group.add(new THREE.Mesh(sideGeo, mats.glass));
  const top = new THREE.Shape(cab.map(p => inset(p, centre, -(BEVEL + 0.012))));
  const topW = W - 0.26;
  const topGeo = new THREE.ExtrudeGeometry(top, { depth: topW, bevelEnabled: false, curveSegments: 4 });
  topGeo.translate(0, 0, -topW / 2);
  group.add(new THREE.Mesh(topGeo, mats.glass));

  // Lights, grille and bumpers.
  const front = P[P.length - 2], rear = P[1];
  const box = (w, h, d, m, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  const headY = front.y - 0.07;
  for (const s of [-1, 1]) box(0.04, 0.05, W * 0.3, mats.head, L + BEVEL - 0.01, headY, s * W * 0.3);
  box(0.04, 0.045, W * 0.86, mats.tail, -BEVEL + 0.01, rear.y - 0.08, 0);
  if (car.fuel !== 'ev') box(0.03, 0.16, W * 0.42, mats.trim, L + BEVEL - 0.012, (headY + c) / 2 + 0.02, 0);
  box(0.06, 0.1, W * 0.95, mats.trim, L + BEVEL - 0.03, c + 0.06, 0);
  box(0.06, 0.1, W * 0.95, mats.trim, -BEVEL + 0.03, c + 0.06, 0);

  // Wheels.
  const tireGeo = new THREE.CylinderGeometry(r, r, 0.26, 40);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(r * 0.66, r * 0.66, 0.27, 40);
  rimGeo.rotateX(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(r * 1.2, 0.07, 0.04);
  for (const x of [rx, fx]) for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(tireGeo, mats.tire));
    w.add(new THREE.Mesh(rimGeo, mats.rimDark));
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Mesh(spokeGeo, mats.rim);
      sp.rotation.z = k * Math.PI * 2 / 5;
      sp.position.z = s * 0.125;
      w.add(sp);
    }
    w.position.set(x, r, s * (W / 2 - 0.12));
    group.add(w);
  }

  // Interior.
  const [beltRear, roofRear, roofFront, beltFront] = cab;
  const floorY = c + 0.18;
  // Low cars get lower seats so headrests and the driver's eye stay under the roof.
  const roofY = Math.min(roofRear.y, roofFront.y);
  const seatScale = Math.min(1, (roofY - floorY - 0.22) / 0.95);
  const beltY = beltFront.y;
  const driverZ = -W * 0.22;
  const frontSeatX = beltFront.x - 1.05;
  const seat = (x, z, wide) => {
    const s = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.13, wide ? W - 0.4 : 0.5), mats.seat);
    base.position.y = 0.06;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.68, wide ? W - 0.4 : 0.5), mats.seat);
    back.position.set(-0.24, 0.38, 0);
    back.rotation.z = 0.2;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.28), mats.seat);
    head.position.set(-0.33, 0.8, 0);
    head.rotation.z = 0.2;
    s.add(base, back);
    if (!wide) s.add(head);
    s.scale.y = seatScale;
    s.position.set(x, floorY + 0.12 * seatScale, z);
    group.add(s);
  };
  seat(frontSeatX, driverZ, false);
  seat(frontSeatX, -driverZ, false);
  if (beltFront.x - beltRear.x > 1.9) seat(frontSeatX - 0.9, 0, true);
  if (car.body === 'van' && beltFront.x - beltRear.x > 2.9) seat(frontSeatX - 1.8, 0, true);
  box(0.5, 0.26, W - 0.18, mats.dash, beltFront.x - 0.32, beltY - 0.1, 0);
  box(0.1, 0.06, W - 0.3, mats.trimLight, beltFront.x - 0.56, beltY - 0.12, 0);
  const screen = box(0.02, 0.2, 0.36, mats.screen, beltFront.x - 0.52, beltY + 0.1, 0);
  screen.rotation.z = 0.25;
  const cluster = box(0.02, 0.1, 0.3, mats.screen, beltFront.x - 0.5, beltY + 0.04, driverZ);
  cluster.rotation.z = 0.3;
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 12, 40), mats.trim);
  wheel.rotation.y = Math.PI / 2;
  wheel.rotation.x = 0;
  const wheelPivot = new THREE.Group();
  wheelPivot.add(wheel);
  wheelPivot.rotation.z = 0.42;
  wheelPivot.position.set(beltFront.x - 0.6, beltY - 0.05, driverZ);
  group.add(wheelPivot);
  const doorLen = beltFront.x - beltRear.x - 0.1;
  for (const s of [-1, 1]) box(doorLen, beltY - floorY, 0.05, mats.door, (beltFront.x + beltRear.x) / 2, (beltY + floorY) / 2, s * (W / 2 - 0.08));
  box(doorLen, 0.02, W - 0.2, mats.floor, (beltFront.x + beltRear.x) / 2, floorY, 0);

  // Soft contact shadow.
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.35, W * 1.7), mats.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(L / 2, 0.003, 0);
  group.add(shadow);

  group.position.x = -L / 2;
  return {
    group, L, W,
    eye: new THREE.Vector3(frontSeatX - 0.14 - L / 2, Math.min(floorY + 0.95, roofY - 0.16), driverZ),
  };
}

export class CarStage {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'stage-canvas';
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 3);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x99bbff, 0.8);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
    this.mats = {
      paint: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x0a0e15, metalness: 0.3, roughness: 0.04, transparent: true, opacity: 0.86 }),
      head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdff4ff, emissiveIntensity: 2.2 }),
      tail: new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1e3c, emissiveIntensity: 2 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.55, metalness: 0.2 }),
      trimLight: new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.3, metalness: 0.9 }),
      tire: new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.9 }),
      rim: new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.22, metalness: 1 }),
      rimDark: new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.4, metalness: 0.8 }),
      seat: new THREE.MeshStandardMaterial({ color: 0x3b2a22, roughness: 0.65 }),
      dash: new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6 }),
      door: new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.7, side: THREE.DoubleSide }),
      floor: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 1 }),
      screen: new THREE.MeshStandardMaterial({ color: 0x050a14, emissive: 0x2e8bff, emissiveIntensity: 0.9 }),
      shadow: new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }),
    };
    this.cache = new Map();
    this.current = null;
    this.mode = 'ext';
    this.theta = 0.75; this.phi = 1.22; this.dist = 9;
    this.yaw = 0; this.pitch = -0.08;
    this.autoRotate = true;
    this.idleAt = 0;
    this.running = false;
    this.pointers = new Map();
    this._bindInput();
  }

  _model(car) {
    const key = car.body + '|' + car.fuel;
    if (!this.cache.has(key)) this.cache.set(key, buildCar(car, this.mats));
    return this.cache.get(key);
  }

  show(car, color) {
    const m = this._model(car);
    if (this.current && this.current !== m) this.scene.remove(this.current.group);
    this.current = m;
    this.scene.add(m.group);
    this.setColor(color || (car.colors && car.colors[0]) || '#c8ccd2');
    this.dist = m.L * 1.75;
  }

  setColor(hex) { this.mats.paint.color.set(hex); }

  setMode(mode) {
    this.mode = mode;
    this.yaw = 0; this.pitch = -0.14;
    const inside = mode === 'int';
    this.mats.glass.opacity = inside ? 0.18 : 0.86;
    this.mats.glass.side = inside ? THREE.DoubleSide : THREE.FrontSide;
    this.mats.glass.needsUpdate = true;
    this.camera.fov = inside ? 72 : 32;
    this.camera.updateProjectionMatrix();
  }

  _place() {
    const m = this.current;
    if (!m) return;
    if (this.mode === 'int') {
      this.camera.position.copy(m.eye);
      const dir = new THREE.Vector3(Math.cos(this.pitch) * Math.cos(this.yaw), Math.sin(this.pitch), Math.cos(this.pitch) * Math.sin(this.yaw));
      this.camera.lookAt(m.eye.clone().add(dir));
    } else {
      const target = new THREE.Vector3(0, 0.62, 0);
      // Back off on tall, narrow stages (phones, split view) so the whole car stays in frame.
      const d = this.dist * Math.max(1, 1.35 / this.camera.aspect);
      this.camera.position.set(
        target.x + d * Math.sin(this.phi) * Math.cos(this.theta),
        target.y + d * Math.cos(this.phi),
        target.z + d * Math.sin(this.phi) * Math.sin(this.theta));
      this.camera.lookAt(target);
    }
  }

  mount(host) {
    this.host = host;
    host.appendChild(this.canvas);
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(host);
    if (!this.running) {
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        if (this.mode === 'ext' && this.autoRotate && performance.now() - this.idleAt > 2500) this.theta += 0.0035;
        this._place();
        this.renderer.render(this.scene, this.camera);
        this._raf = requestAnimationFrame(loop);
      };
      loop();
    }
  }

  unmount() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    this.canvas.remove();
    this.host = null;
  }

  _resize() {
    if (!this.host) return;
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // Renders a still of a car (used for catalogue cards) without disturbing the live view.
  snapshot(car, color, w = 640, h = 400) {
    const prev = { current: this.current, mode: this.mode, theta: this.theta, phi: this.phi, dist: this.dist, color: this.mats.paint.color.clone() };
    if (this.mode !== 'ext') this.setMode('ext');
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.show(car, color);
    this.theta = 0.62; this.phi = 1.28; this.dist = this.current.L * 1.38;
    this._place();
    this.renderer.render(this.scene, this.camera);
    const url = this.canvas.toDataURL('image/png');
    if (prev.current) {
      if (prev.current !== this.current) { this.scene.remove(this.current.group); this.scene.add(prev.current.group); }
      this.current = prev.current;
      this.mats.paint.color.copy(prev.color);
    } else {
      this.scene.remove(this.current.group);
      this.current = null;
    }
    Object.assign(this, { theta: prev.theta, phi: prev.phi, dist: prev.dist });
    if (prev.mode !== 'ext') this.setMode(prev.mode);
    this._resize();
    return url;
  }

  _bindInput() {
    const el = this.canvas;
    el.style.touchAction = 'none';
    let pinch = 0;
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.idleAt = performance.now();
    });
    el.addEventListener('pointermove', e => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      this.idleAt = performance.now();
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) this._zoom(pinch / d);
        pinch = d;
        return;
      }
      if (this.mode === 'int') {
        this.yaw += dx * 0.005;
        this.pitch = Math.max(-0.9, Math.min(0.7, this.pitch - dy * 0.005));
      } else {
        this.theta += dx * 0.008;
        this.phi = Math.max(0.35, Math.min(1.5, this.phi - dy * 0.006));
      }
    });
    const up = e => { this.pointers.delete(e.pointerId); pinch = 0; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => {
      e.preventDefault();
      this.idleAt = performance.now();
      this._zoom(Math.exp(e.deltaY * 0.001));
    }, { passive: false });
  }

  _zoom(k) {
    if (this.mode === 'int') {
      this.camera.fov = Math.max(40, Math.min(90, this.camera.fov * k));
      this.camera.updateProjectionMatrix();
    } else if (this.current) {
      this.dist = Math.max(this.current.L * 0.95, Math.min(this.current.L * 3, this.dist * k));
    }
  }
}
