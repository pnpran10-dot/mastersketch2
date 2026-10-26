// MasterDrive 3D stage: shows a realistic car model from outside (orbit) or
// from the driver's seat (look around), repainted in the chosen colour.
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './vendor/jsm/libs/meshopt_decoder.module.js';

// One representative model per family. `turn` points the nose at +x,
// `eye` is the driver's eye in model space after centring (metres).
const MODELS = {
  sports: { url: new URL('models/', import.meta.url).href + 'sports.glb', paint: /^(Body_Color|Ferrari_Yellow)$/, turn: -Math.PI / 2, eye: [-0.15, 0.98, -0.33] },
  sedan: { url: new URL('models/', import.meta.url).href + 'sedan.glb', paint: /^Paint [12] /, turn: Math.PI / 2, eye: [0.1, 0.95, 0] },
};
export const modelFor = car => (car.body === 'sports' ? 'sports' : 'sedan');

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export class CarStage {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'stage-canvas';
    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 6, 4);
    this.scene.add(key, new THREE.HemisphereLight(0xffffff, 0x445544, 0.5));
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.03, 100);
    this.loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    this.models = new Map();
    this.current = null;
    this.mode = 'ext';
    this.theta = 0.7; this.phi = 1.25; this.dist = 8.2;
    this.yaw = 0; this.pitch = -0.12;
    this.lookY = 0.55;
    this.autoRotate = true;
    this.idleAt = 0;
    this.running = false;
    this.pointers = new Map();
    this._bindInput();
  }

  // Loads (once) and prepares a model: centred on the ground, nose to +x, paint split out.
  load(kind) {
    if (this.models.has(kind)) return this.models.get(kind);
    const spec = MODELS[kind];
    const p = this.loader.loadAsync(spec.url).then(gltf => {
      const root = gltf.scene;
      const group = new THREE.Group();
      root.rotation.y = spec.turn;
      group.add(root);
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root, true);
      const centre = box.getCenter(new THREE.Vector3());
      root.position.set(-centre.x, -box.min.y, -centre.z);
      const size = box.getSize(new THREE.Vector3());
      const paint = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04 });
      const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, metalness: 0.2, roughness: 0.02, transparent: true, opacity: 0.45 });
      root.traverse(o => {
        if (!o.isMesh) return;
        if (spec.paint.test(o.material.name)) o.material = paint;
        else if (/^glass(_gray)?$/i.test(o.material.name)) o.material = glass;
      });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.25, size.z * 1.6),
        new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.002;
      group.add(shadow);
      return { group, paint, glass, length: size.x, eye: new THREE.Vector3(...spec.eye) };
    });
    this.models.set(kind, p);
    return p;
  }

  async show(car, color) {
    const m = await this.load(modelFor(car));
    if (this.current && this.current !== m) this.scene.remove(this.current.group);
    this.current = m;
    this.scene.add(m.group);
    this.setColor(color || car.colors?.[0] || '#c8ccd2');
    this.dist = m.length * 1.85;
    return m;
  }

  setColor(hex) { if (this.current) this.current.paint.color.set(hex); }

  // 'none' in the dialog (drag spins the car); 'pan-y' on the page so vertical swipes still scroll.
  setTouch(value) { this.canvas.style.touchAction = value; }

  // Higher look-at point = car sits lower in the frame (leaves room for titles above it).
  setFraming(lookY) { this.lookY = lookY; }

  setMode(mode) {
    this.mode = mode;
    this.yaw = 0; this.pitch = -0.12;
    this.camera.fov = mode === 'int' ? 75 : 30;
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
      const target = new THREE.Vector3(0, this.lookY, 0);
      // Back off on tall, narrow stages (phones, split view) so the whole car stays in frame.
      const d = this.dist * Math.max(1, 1.35 / this.camera.aspect);
      this.camera.position.set(
        d * Math.sin(this.phi) * Math.cos(this.theta),
        target.y + d * Math.cos(this.phi),
        d * Math.sin(this.phi) * Math.sin(this.theta));
      this.camera.lookAt(target);
    }
  }

  mount(host) {
    this.host = host;
    host.appendChild(this.canvas);
    this._resize();
    this._ro?.disconnect();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(host);
    if (!this.running) {
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        if (this.mode === 'ext' && this.autoRotate && performance.now() - this.idleAt > 2500) this.theta += 0.003;
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
    this._ro?.disconnect();
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

  // Renders a still of a car (catalogue cards) without disturbing the live view.
  async snapshot(car, color, w = 800, h = 480) {
    const m = await this.load(modelFor(car));
    const prev = { current: this.current, mode: this.mode, theta: this.theta, phi: this.phi, dist: this.dist, lookY: this.lookY, color: this.current?.paint.color.clone() };
    if (this.current && this.current !== m) this.scene.remove(this.current.group);
    this.scene.add(m.group);
    this.current = m;
    const oldColor = m.paint.color.clone();
    m.paint.color.set(color || '#c8ccd2');
    this.mode = 'ext';
    this.lookY = 0.55;
    this.camera.fov = 26;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.theta = 0.55; this.phi = 1.33; this.dist = m.length * 1.3;
    this._place();
    this.renderer.render(this.scene, this.camera);
    const url = this.canvas.toDataURL('image/png');
    m.paint.color.copy(oldColor);
    if (prev.current !== m) {
      this.scene.remove(m.group);
      if (prev.current) { this.scene.add(prev.current.group); prev.current.paint.color.copy(prev.color); }
    }
    Object.assign(this, { current: prev.current, theta: prev.theta, phi: prev.phi, dist: prev.dist, lookY: prev.lookY });
    this.setMode(prev.mode);
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
      this.camera.fov = Math.max(40, Math.min(95, this.camera.fov * k));
      this.camera.updateProjectionMatrix();
    } else if (this.current) {
      this.dist = Math.max(this.current.length * 1.0, Math.min(this.current.length * 3.2, this.dist * k));
    }
  }
}
