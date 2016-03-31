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
    const ret = (lens === 0) ?
      (new THREE.Vector2(
        fishRad * ar.y * Math.cos(ar.x) * 0.5 + 0.25,
        fishRad2 * ar.y * Math.sin(ar.x) + fishCenter)) :
      (new THREE.Vector2(
        fishRad * (1.0 - ar.y) * Math.cos(-1.0 * ar.x + Math.PI) * 0.5 + 0.75,
        fishRad2 * (1.0 - ar.y) * Math.sin(-1.0 * ar.x + Math.PI) + fishCenter));
    return ret;
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
  };

  start(videoDOM, containerDOM, w, h) {
    const self = this;
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

    function onWheel(e) {
      e.preventDefault();
      let diff = 0;
      if (event.wheelDeltaY) diff = event.wheelDeltaY * -0.05; // webkit
      else if (event.wheelDelta) diff = event.wheelDelta * -0.05; // Opera / Explorer 9
      else if (event.detail) diff = event.detail * 1.0; // Firefox
      self._camera.fov += diff;
      self._camera.updateProjectionMatrix();
    }

    function onMouseUp(e) {
      e.preventDefault();
      self._isUserInteracting = false;
    }

    function onMouseDown(e) {
      e.preventDefault();
      self._isUserInteracting = true;
      self._onPointerDownPointerX = e.clientX;
      self._onPointerDownPointerY = e.clientY;
      self._onPointerDownLon = self._lon;
      self._onPointerDownLat = self._lat;
    }

    function onMouseMove(e) {
      if (self._isUserInteracting !== true) return;
      self._lon = (self._onPointerDownPointerX - e.clientX) * 0.1 + self._onPointerDownLon;
      self._lat = (e.clientY - self._onPointerDownPointerY) * 0.1 + self._onPointerDownLat;
    }

    this._renderer.domElement.addEventListener('mousewheel', onWheel, false);
    this._renderer.domElement.addEventListener('MozMousePixelScroll', onWheel, false);
    this._renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    this._renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    this._renderer.domElement.addEventListener('mousemove', onMouseMove, false);

    containerDOM.appendChild(this._renderer.domElement);
  };

  stop(containerDOM) {
    const child = containerDOM.lastChild;
    if (child) containerDOM.removeChild(child);
  }

  animate() {
    let phi = 0;
    let theta = 0;
    if (this._camera === null) return;
    this._lat = Math.max(-85, Math.min(85, this._lat));
    phi = THREE.Math.degToRad(90 - this._lat);
    theta = THREE.Math.degToRad(this._lon);
    this._camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    this._camera.target.y = 500 * Math.cos(phi);
    this._camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
    this._camera.lookAt(this._camera.target);
    this._renderer.render(this._scene, this._camera);
  };

  resize(w, h) {
    if (this._camera === null) return;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  };

};

exports.ThetaView = ThetaView;
