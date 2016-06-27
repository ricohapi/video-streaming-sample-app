/* global THREE */
'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

class ThetaView {

  _cyln2world(a, e) {
    return (new THREE.Vector3(
      Math.cos(e) * Math.cos(a),
      Math.cos(e) * Math.sin(a),
      Math.sin(e)));
  }

  _world2fish(x, y, z) {
    let nz = z;
    if (z < -1.0) nz = -1.0;
    else if (z > 1.0) nz = 1.0;
    return (new THREE.Vector2(
      Math.atan2(y, x),
      Math.acos(nz) / Math.PI)); // 0.0 to 1.0
  }

  _calcTexUv(i, j, lens) {
    const world = this._cyln2world(
      ((i + 90) / 180.0 - 1.0) * Math.PI, // rotate 90 deg for polygon
      (0.5 - j / 180.0) * Math.PI);
    const ar = this._world2fish(
      Math.sin(-0.5 * Math.PI) * world.z + Math.cos(-0.5 * Math.PI) * world.x,
      world.y,
      Math.cos(-0.5 * Math.PI) * world.z - Math.sin(-0.5 * Math.PI) * world.x);

    const fishRad = 0.883;
    const fishRad2 = fishRad * 0.88888888888888;
    const fishCenter = 1.0 - 0.44444444444444;
    const x = (lens === 0) ?
      fishRad * ar.y * Math.cos(ar.x) * 0.5 + 0.25 :
      fishRad * (1.0 - ar.y) * Math.cos(-1.0 * ar.x + Math.PI) * 0.5 + 0.75;
    const y = (lens === 0) ?
      fishRad2 * ar.y * Math.sin(ar.x) + fishCenter :
      fishRad2 * (1.0 - ar.y) * Math.sin(-1.0 * ar.x + Math.PI) + fishCenter;
    return (new THREE.Vector2(x, y));
  }

  _createGeometry() {
    const geometry = new THREE.Geometry();

    const uvs = [];
    for (let j = 0; j <= 180; j += 5) {
      for (let i = 0; i <= 360; i += 5) {
        geometry.vertices.push(new THREE.Vector3(
          Math.sin(Math.PI * j / 180.0) * Math.sin(Math.PI * i / 180.0) * 500.0,
          Math.cos(Math.PI * j / 180.0) * 500.0,
          Math.sin(Math.PI * j / 180.0) * Math.cos(Math.PI * i / 180.0) * 500.0));
      }
      /* devide texture */
      for (let k = 0; k <= 180; k += 5) {
        uvs.push(this._calcTexUv(k, j, 0));
      }
      for (let l = 180; l <= 360; l += 5) {
        uvs.push(this._calcTexUv(l, j, 1));
      }
    }

    for (let m = 0; m < 36; m++) {
      for (let n = 0; n < 72; n++) {
        const v = m * 73 + n;
        geometry.faces.push(
          new THREE.Face3(v + 0, v + 1, v + 73, null, null, 0),
          new THREE.Face3(v + 1, v + 74, v + 73, null, null, 0));
        const t = (n < 36) ? m * 74 + n : m * 74 + n + 1;

        geometry.faceVertexUvs[0].push(
          [uvs[t + 0], uvs[t + 1], uvs[t + 74]], [uvs[t + 1], uvs[t + 75], uvs[t + 74]]);
      }
    }
    geometry.scale(-1, 1, 1); // rotate left-right
    return geometry;
  }

  _createMaterial(video) { // video:DOM
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });
  }

  _animate() {
    this._timer = requestAnimationFrame(this._animate.bind(this));
    if (this._camera === null) return;

    this._lat = Math.max(-85, Math.min(85, this._lat));
    const phi = THREE.Math.degToRad(90 - this._lat);
    const theta = THREE.Math.degToRad(this._lon);
    this._camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    this._camera.target.y = 500 * Math.cos(phi);
    this._camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
    this._camera.lookAt(this._camera.target);
    this._renderer.render(this._scene, this._camera);
  }

  _onWheel(e) {
    if (!e) return;
    if (e.preventDefault) e.preventDefault();
    const k = this._isChrome ? 0.05 : 1.0;
    this._camera.fov += (e.deltaY * k);
    this._camera.updateProjectionMatrix();
  }

  _onMouseUp(e) {
    if (!e) return;
    if (e.preventDefault) e.preventDefault();
    this._isUserInteracting = false;
  }

  _onTouchEnd(e) {
    this._onMouseUp(e.touches[0]);
    return false;
  }

  _onMouseDown(e) {
    if (!e) return;
    if (e.preventDefault) e.preventDefault();
    this._isUserInteracting = true;
    this._onPointerDownPointerX = e.clientX;
    this._onPointerDownPointerY = e.clientY;
    this._onPointerDownLon = this._lon;
    this._onPointerDownLat = this._lat;
  }

  _onTouchStart(e) {
    this._onMouseDown(e.touches[0]);
    return false;
  }

  _onMove(e, d) {
    if (!this._isUserInteracting) return;
    this._lon = (this._onPointerDownPointerX - e.clientX) * d + this._onPointerDownLon;
    this._lat = (e.clientY - this._onPointerDownPointerY) * d + this._onPointerDownLat;
  }

  _onMouseMove(e) {
    if (!e) return;
    if (e.preventDefault) e.preventDefault();
    this._onMove(e, 0.1);
  }

  _onTouchMove(e) {
    if (!e) return false;
    if (e.preventDefault) e.preventDefault();
    this._onMove(e.touches[0], 1.0);
    return false;
  }

  constructor() {
    this._isUserInteracting = false;
    this._lon = 0;
    this._lat = 0;
    this._onPointerDownPointerX = 0;
    this._onPointerDownPointerY = 0;
    this._onPointerDownLon = 0;
    this._onPointerDownLat = 0;
    this._camera = null;
    this._scene = null;
    this._renderer = null;
    this._container = undefined;
    this._timer = undefined;
    const ua = window.navigator.userAgent.toLowerCase();
    this._isChrome = (ua.indexOf('chrome') !== -1);
  }

  start(videoDOM) {
    if (!this._container) return;
    if (this._timer) return;
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;

    // create Camera
    this._camera = new THREE.PerspectiveCamera(75, w / h, 1, 1100);
    this._camera.target = new THREE.Vector3(0, 0, 0);

    // create Scene
    this._scene = new THREE.Scene();
    this._scene.add(new THREE.Mesh(this._createGeometry(), this._createMaterial(videoDOM)));

    // create Renderer
    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(w, h);

    this._renderer.domElement.addEventListener('wheel', this._onWheel.bind(this), false);
    this._renderer.domElement.addEventListener('mouseup', this._onMouseUp.bind(this), false);
    this._renderer.domElement.addEventListener('mousedown', this._onMouseDown.bind(this), false);
    this._renderer.domElement.addEventListener('mousemove', this._onMouseMove.bind(this), false);
    this._renderer.domElement.addEventListener('touchend', this._onTouchEnd.bind(this), false);
    this._renderer.domElement.addEventListener('touchstart', this._onTouchStart.bind(this), false);
    this._renderer.domElement.addEventListener('touchmove', this._onTouchMove.bind(this), false);

    this._container.appendChild(this._renderer.domElement);
    const dom = videoDOM;
    dom.style.display = 'none';
    this._animate();
  }

  stop(videoDOM) {
    if (!this._timer) return;
    cancelAnimationFrame(this._timer);
    this._timer = undefined;

    const child = this._container.lastChild;
    if (child) this._container.removeChild(child);
    const dom = videoDOM;
    dom.style.display = 'block';
  }

  setContainer(elm) {
    this._container = elm;
    window.onresize = () => {
      if (this._camera === null) return;
      const w = this._container.clientWidth;
      const ww = this._renderer.domElement.width;
      const hh = this._renderer.domElement.height;
      this._camera.aspect = ww / hh;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize(w, w / this._camera.aspect);
    };
  }
}

exports.ThetaView = ThetaView;
