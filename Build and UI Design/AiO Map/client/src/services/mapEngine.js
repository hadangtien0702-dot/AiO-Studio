/**
 * AiO Studio — 3D Isometric USA Map Engine (Three.js)
 * High-end Matte Porcelain Clay 3D styling matching reference images 1:1.
 * Features:
 * - Fixed 2.5D Isometric cut (tilt angle locked, pan & zoom navigation)
 * - Prominent, high-contrast Slate-700 state borders (anti-sunken polygonOffset)
 * - Needle billboard pin with bold uppercase tracked state badge (CALIFORNIA / TEXAS)
 * - Zero matrixWorld desync
 * Strictly NO emojis.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Map3DEngine {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      scale: 0.52,
      baseDepth: 10.5, // Solid architectural clay board depth
      elevationHeight: 1.6, // Grounded subtle tactile edge matching reference photo
      highlightColor: '#02c5cc',
      clayColor: '#f3f7f6',
      theme: 'clay',
      showAllPins: true,
      onSelectState: null,
      onHoverState: null
    }, options);

    this.statesData = null;
    this.stateGroups = new Map();
    this.filmedStatesData = new Map();
    this.miniPins = new Map();
    this.selectedState = null;
    this.hoveredState = null;

    this.animatedStates = new Set();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mapRootGroup = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.isDragging = false;
    this.mouseDownPos = { x: 0, y: 0 };

    this.sunLight = null;
    this.ambientLight = null;
    this.fillLight = null;
    this.hemiLight = null;
    this.groundMesh = null;
    this.groundMat = null;

    this.materials = {};
    this.pinGroup = null;

    // Fixed 2.5D Isometric Camera Framing centered on USA landmass (-15, 0, 5)
    this.defaultCameraPos = new THREE.Vector3(-15, 540, 500);
    this.defaultTarget = new THREE.Vector3(-15, 0, 5);
    this.fixedPolarAngle = 0;
    this.fixedAzimuthAngle = 0;
    this.viewMode = 'isometric';

    this.init();
  }

  init() {
    this.initScene();
    this.initMaterials();
    this.initLighting();
    this.initGround();
    this.initMainPinMarker();
    this.initEvents();
    this.updateThemeColors();

    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    // Map root group laying flat on ground (Local X->World X, Local Y->World -Z, Local Z->World +Y)
    this.mapRootGroup = new THREE.Group();
    this.mapRootGroup.rotation.x = -Math.PI / 2;
    this.scene.add(this.mapRootGroup);

    // Architectural low-distortion perspective camera
    this.camera = new THREE.PerspectiveCamera(24, width / height, 10, 3000);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Calculate fixed isometric angles from default vector
    const offset = new THREE.Vector3().subVectors(this.defaultCameraPos, this.defaultTarget);
    this.fixedPolarAngle = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
    this.fixedAzimuthAngle = Math.atan2(offset.x, offset.z);

    // OrbitControls: In fixed 2.5D isometric mode, tilt is locked to prevent camera tumbling
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 250;
    this.controls.maxDistance = 1400;
    this.controls.target.copy(this.defaultTarget);

    this.applyViewMode('isometric');
  }

  applyViewMode(mode) {
    this.viewMode = mode;
    if (mode === 'isometric') {
      // Strictly lock tilt (polar) angle & azimuth: flawless 2.5D cut
      this.controls.minPolarAngle = this.fixedPolarAngle;
      this.controls.maxPolarAngle = this.fixedPolarAngle;
      this.controls.minAzimuthAngle = this.fixedAzimuthAngle;
      this.controls.maxAzimuthAngle = this.fixedAzimuthAngle;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.enableRotate = false;
    } else if (mode === 'topdown') {
      this.controls.minPolarAngle = 0.001;
      this.controls.maxPolarAngle = 0.001;
      this.controls.minAzimuthAngle = 0;
      this.controls.maxAzimuthAngle = 0;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.enableRotate = false;
    } else { // 'free3d'
      this.controls.minPolarAngle = 0.2;
      this.controls.maxPolarAngle = Math.PI / 2.3;
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      this.controls.enableRotate = true;
    }
    this.controls.update();
  }

  initMaterials() {
    // 1. Warm porcelain chalk clay (Matching exact reference tone #f3f7f6)
    this.materials.clay = new THREE.MeshStandardMaterial({
      color: 0xf3f7f6,
      roughness: 0.62,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // 2. Filmed state material (Warm porcelain)
    this.materials.filmed = new THREE.MeshStandardMaterial({
      color: 0xf3f7f6,
      roughness: 0.62,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // 3. Highlighted / Selected State (Exact electric turquoise #02c5cc from user image)
    this.materials.highlight = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#02c5cc'),
      roughness: 0.32,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // 4. Subtle, delicate top-surface perimeter border lines (Exact soft sage-gray #cbdad6)
    this.materials.topBorder = new THREE.LineBasicMaterial({
      color: 0xc4d4ce,
      transparent: true,
      opacity: 0.42,
      depthTest: true
    });

    // 5. Selected state top-surface border line
    this.materials.selectedBorder = new THREE.LineBasicMaterial({
      color: 0x009aa2,
      transparent: true,
      opacity: 0.38,
      depthTest: true
    });

    // 6. Pin metal (Exact vibrant needle color #1acad3)
    this.materials.pinMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1acad3'),
      roughness: 0.25,
      metalness: 0.20
    });

    this.materials.miniPinMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1acad3'),
      roughness: 0.25,
      metalness: 0.20
    });
  }

  initLighting() {
    // Soft, airy studio lighting matching #e5eeef background
    this.ambientLight = new THREE.AmbientLight(0xeef5f3, 0.58);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8e6e4, 0.30);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
    this.sunLight.position.set(-200, 500, 240);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1400;

    const d = 360;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0002;
    this.sunLight.shadow.radius = 5.0;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0xd5e6e8, 0.20);
    this.fillLight.position.set(240, 200, -180);
    this.scene.add(this.fillLight);
  }

  initGround() {
    const groundGeom = new THREE.PlaneGeometry(2400, 2400);
    // Ultra-soft, gentle floor shadow (0.08) matching #dfeff0 in reference image
    this.groundMat = new THREE.ShadowMaterial({ opacity: 0.08 });
    this.groundMesh = new THREE.Mesh(groundGeom, this.groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.05;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  initMainPinMarker() {
    this.pinGroup = new THREE.Group();
    this.pinGroup.visible = false;

    // 1. Base ring sitting on state top surface (White disc with teal dot, matching reference)
    const baseGeom = new THREE.CylinderGeometry(2.4, 2.7, 0.6, 32);
    const whiteBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const baseMesh = new THREE.Mesh(baseGeom, whiteBaseMat);
    baseMesh.position.y = 0.30;
    baseMesh.castShadow = true;
    this.pinGroup.add(baseMesh);

    const innerDotGeom = new THREE.CylinderGeometry(1.1, 1.1, 0.7, 24);
    const innerDotMesh = new THREE.Mesh(innerDotGeom, this.materials.pinMetal);
    innerDotMesh.position.y = 0.36;
    this.pinGroup.add(innerDotMesh);

    // 2. Slender vertical needle pole (Teal, matching reference photo 1:1)
    const poleHeight = 34;
    const poleGeom = new THREE.CylinderGeometry(0.38, 0.38, poleHeight, 16);
    this.poleMesh = new THREE.Mesh(poleGeom, this.materials.pinMetal);
    this.poleMesh.position.y = poleHeight / 2 + 0.3;
    this.poleMesh.castShadow = true;
    this.pinGroup.add(this.poleMesh);

    // 3. Top joint bead
    const jointGeom = new THREE.SphereGeometry(0.7, 16, 16);
    const jointMesh = new THREE.Mesh(jointGeom, this.materials.pinMetal);
    jointMesh.position.y = poleHeight + 0.3;
    this.pinGroup.add(jointMesh);

    // 4. Billboard badge plaque (High-res 1024x280 canvas for retina crispness)
    this.billboardCanvas = document.createElement('canvas');
    this.billboardCanvas.width = 1024;
    this.billboardCanvas.height = 280;
    this.billboardTex = new THREE.CanvasTexture(this.billboardCanvas);
    this.billboardTex.minFilter = THREE.LinearFilter;
    this.billboardTex.magFilter = THREE.LinearFilter;

    const badgeMat = new THREE.MeshBasicMaterial({
      map: this.billboardTex,
      transparent: true,
      side: THREE.DoubleSide
    });

    const badgeWidth = 34;
    const badgeHeight = 9.3;
    const badgeGeom = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
    this.badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    this.badgeMesh.position.set(0, poleHeight + badgeHeight / 2 + 0.3, 0);
    this.pinGroup.add(this.badgeMesh);

    this.scene.add(this.pinGroup);
  }

  updateBillboardText(title) {
    const ctx = this.billboardCanvas.getContext('2d');
    const w = this.billboardCanvas.width;
    const h = this.billboardCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const pad = 12;
    const rx = pad;
    const ry = pad;
    const rw = w - pad * 2;
    const rh = h - pad * 2;
    const radius = 32;

    // Drop shadow on plaque
    ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;

    // Pure white rounded card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, rw, rh, radius);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.fill();

    // Subtle edge hairline
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(2, 197, 204, 0.22)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Exact match to user photos (spaced uppercase: C A L I F O R N I A)
    const spacedTitle = (title || '').toUpperCase().split('').join('  ');
    ctx.fillStyle = this.options.highlightColor || '#02c5cc';
    ctx.font = '800 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
    ctx.fillText(spacedTitle, w / 2, h / 2 + 2);

    this.billboardTex.needsUpdate = true;
  }

  loadStatesData(data) {
    this.statesData = data;
    this.buildMapMeshes();
    if (this.selectedState) {
      const code = this.selectedState;
      this.selectedState = null;
      this.selectState(code);
    }
  }

  buildMapMeshes() {
    if (!this.statesData || !this.statesData.states) return;

    const scale = this.options.scale;
    const depth = this.options.baseDepth;
    const centerX = 480;
    const centerY = 300;

    this.statesData.states.forEach(state => {
      const stateGroup = new THREE.Group();
      stateGroup.userData = {
        stateData: state,
        code: state.code,
        name: state.name,
        targetZ: 0,
        currentZ: 0,
        isFilmed: false,
        meshes: [],
        topBorderLines: []
      };

      const geom = state.geometry;
      const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

      polygons.forEach(poly => {
        const outerRing = poly[0];
        if (!outerRing || outerRing.length < 3) return;

        const shape = new THREE.Shape();
        const borderPoints = [];

        outerRing.forEach(([px, py], i) => {
          const x = (px - centerX) * scale;
          const y = -(py - centerY) * scale;
          if (i === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);

          // Top perimeter line points, elevated slightly by 0.06 above flat top face
          borderPoints.push(new THREE.Vector3(x, y, depth + 0.06));
        });

        for (let h = 1; h < poly.length; h++) {
          const holeRing = poly[h];
          if (!holeRing || holeRing.length < 3) continue;
          const holePath = new THREE.Path();
          const holeBorderPoints = [];

          holeRing.forEach(([px, py], i) => {
            const x = (px - centerX) * scale;
            const y = -(py - centerY) * scale;
            if (i === 0) holePath.moveTo(x, y);
            else holePath.lineTo(x, y);

            holeBorderPoints.push(new THREE.Vector3(x, y, depth + 0.06));
          });
          shape.holes.push(holePath);

          const holeGeom = new THREE.BufferGeometry().setFromPoints(holeBorderPoints);
          const holeLine = new THREE.LineLoop(holeGeom, this.materials.topBorder);
          stateGroup.add(holeLine);
          stateGroup.userData.topBorderLines.push(holeLine);
        }

        // Clean vertical extrusion without bevel expansion to prevent overlapping borders and spikes
        const extrudeGeom = new THREE.ExtrudeGeometry(shape, {
          depth: depth,
          bevelEnabled: false
        });
        extrudeGeom.computeVertexNormals();

        const meshMat = this.materials.clay.clone();
        meshMat.polygonOffset = true;
        meshMat.polygonOffsetFactor = 1.0;
        meshMat.polygonOffsetUnits = 1.0;

        const mesh = new THREE.Mesh(extrudeGeom, meshMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
          parentGroup: stateGroup,
          stateCode: state.code
        };

        // Delicate top-surface perimeter border loop for architectural hairline boundary
        const borderGeom = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const topBorderLine = new THREE.LineLoop(borderGeom, this.materials.topBorder);
        stateGroup.add(topBorderLine);
        stateGroup.userData.topBorderLines.push(topBorderLine);

        stateGroup.add(mesh);
        stateGroup.userData.meshes.push(mesh);
      });

      // Calculate state local centroid (Z = depth)
      stateGroup.userData.localCentroid = new THREE.Vector3(
        (state.centroid[0] - centerX) * scale,
        -(state.centroid[1] - centerY) * scale,
        depth
      );

      this.mapRootGroup.add(stateGroup);
      this.stateGroups.set(state.code, stateGroup);
    });

    // Ensure full scene hierarchy matrix is updated before any pins or calculations!
    this.scene.updateMatrixWorld(true);

    this.refreshFilmedMarkers();
  }

  getStateWorldCenter(stateCode) {
    const group = this.stateGroups.get(stateCode);
    if (!group) return new THREE.Vector3(0, 0, 0);

    this.scene.updateMatrixWorld(true);
    const localCenter = group.userData.localCentroid.clone();
    return localCenter.applyMatrix4(group.matrixWorld);
  }

  updateFilmedStates(filmedMap) {
    this.filmedStatesData = filmedMap;
    this.refreshFilmedMarkers();
  }

  refreshFilmedMarkers() {
    if (!this.stateGroups || this.stateGroups.size === 0) return;

    // Clear existing mini-pins
    this.miniPins.forEach(p => this.scene.remove(p));
    this.miniPins.clear();

    this.scene.updateMatrixWorld(true);

    this.stateGroups.forEach((group, code) => {
      const isFilmed = this.filmedStatesData.has(code);
      group.userData.isFilmed = isFilmed;

      if (code !== this.selectedState) {
        // Pure porcelain white for all non-selected states, matching reference photo 1:1
        const matColor = this.options.theme === 'console' ? 0x181b24 : 0xffffff;
        group.userData.meshes.forEach(m => m.material.color.set(matColor));
      }

      // Add needle split-badge pin for filmed states (WA, TX, NY, FL, etc.)
      if (isFilmed && this.options.showAllPins) {
        const info = this.filmedStatesData.get(code);
        const miniPin = this.createMiniPin(group, info ? info.count : 1);
        miniPin.visible = (code !== this.selectedState);
        this.scene.add(miniPin);
        this.miniPins.set(code, miniPin);
      }
    });
  }

  createMiniPin(group, count) {
    const pin = new THREE.Group();
    const code = group.userData.code;
    const pinH = 26; // Slender needle pole height

    // 1. Base anchor disc sitting on top surface of state
    const baseGeom = new THREE.CylinderGeometry(1.6, 2.0, 0.45, 24);
    const whiteBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const baseMesh = new THREE.Mesh(baseGeom, whiteBaseMat);
    baseMesh.position.y = 0.22;
    baseMesh.castShadow = true;
    pin.add(baseMesh);

    const innerDotGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.55, 20);
    const innerDotMesh = new THREE.Mesh(innerDotGeom, this.materials.miniPinMetal);
    innerDotMesh.position.y = 0.28;
    pin.add(innerDotMesh);

    // 2. Slender needle pole (teal)
    const poleGeom = new THREE.CylinderGeometry(0.30, 0.30, pinH, 16);
    const poleMesh = new THREE.Mesh(poleGeom, this.materials.miniPinMetal);
    poleMesh.position.y = pinH / 2 + 0.2;
    poleMesh.castShadow = true;
    pin.add(poleMesh);

    // 3. Top joint bead
    const jointGeom = new THREE.SphereGeometry(0.55, 16, 16);
    const jointMesh = new THREE.Mesh(jointGeom, this.materials.miniPinMetal);
    jointMesh.position.y = pinH + 0.2;
    pin.add(jointMesh);

    // 4. Split badge plaque [ STATE | COUNT ] (High-res 480x200 canvas)
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    const pad = 10;
    const rx = pad;
    const ry = pad;
    const rw = canvas.width - pad * 2;
    const rh = canvas.height - pad * 2;
    const radius = 24;

    // Soft drop shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    // Pure white rounded card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, rw, rh, radius);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.fill();

    // Subtle edge hairline
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(2, 197, 204, 0.22)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Middle divider line
    const splitX = rx + rw * 0.54;
    ctx.beginPath();
    ctx.moveTo(splitX, ry + 16);
    ctx.lineTo(splitX, ry + rh - 16);
    ctx.strokeStyle = 'rgba(100, 130, 140, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // State code (e.g. WA, TX, NY, FL)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1f3f4e';
    ctx.font = '800 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(code, (rx + splitX) / 2, rh / 2 + ry + 2);

    // Shoot count (e.g. 1, 2)
    ctx.fillStyle = this.options.highlightColor || '#02c5cc';
    ctx.font = '800 74px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(String(count), (splitX + rx + rw) / 2, rh / 2 + ry + 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    const badgeWidth = 17;
    const badgeHeight = 7.1;
    const badgeGeom = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide
    });
    const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    badgeMesh.position.set(0, pinH + badgeHeight / 2 + 0.2, 0);
    pin.add(badgeMesh);
    pin.userData.badgeMesh = badgeMesh;

    this.scene.updateMatrixWorld(true);
    const worldPos = this.getStateWorldCenter(group.userData.code);
    pin.position.copy(worldPos);
    return pin;
  }

  setShowAllPins(show) {
    this.options.showAllPins = show;
    this.refreshFilmedMarkers();
  }

  selectState(stateCode) {
    if (!stateCode) {
      this.deselect();
      return;
    }

    const group = this.stateGroups.get(stateCode);
    if (!group) {
      this.selectedState = stateCode;
      return;
    }

    // Reset previous selection
    if (this.selectedState && this.selectedState !== stateCode) {
      const prevGroup = this.stateGroups.get(this.selectedState);
      if (prevGroup) {
        prevGroup.userData.targetZ = 0;
        this.animatedStates.add(prevGroup);
        const prevColor = prevGroup.userData.isFilmed
          ? (this.options.theme === 'console' ? 0x1d2830 : 0xecfdf5)
          : (this.options.theme === 'console' ? 0x181b24 : 0xf8fafc);
        prevGroup.userData.meshes.forEach(m => m.material.color.set(prevColor));
        if (prevGroup.userData.topBorderLines) {
          prevGroup.userData.topBorderLines.forEach(l => l.material = this.materials.topBorder);
        }
      }

      const oldMiniPin = this.miniPins.get(this.selectedState);
      if (oldMiniPin && this.options.showAllPins) oldMiniPin.visible = true;
    }

    this.selectedState = stateCode;
    const state = group.userData.stateData;

    // Hide mini-pin for active state
    const curMiniPin = this.miniPins.get(stateCode);
    if (curMiniPin) curMiniPin.visible = false;

    // Subtle tactile elevation (3.5 units)
    group.userData.targetZ = this.options.elevationHeight;
    this.animatedStates.add(group);

    // Apply bright turquoise/teal highlight color
    group.userData.meshes.forEach(m => {
      m.material.color.set(this.options.highlightColor);
    });
    if (group.userData.topBorderLines) {
      group.userData.topBorderLines.forEach(l => {
        l.material = this.materials.selectedBorder;
      });
    }

    // Update billboard title (spaced uppercase state name matching reference photos 2 & 3)
    this.updateBillboardText(state.name);

    // Position main 3D Pin Marker
    this.scene.updateMatrixWorld(true);
    const worldPos = this.getStateWorldCenter(stateCode);
    this.pinGroup.position.copy(worldPos);
    this.pinGroup.visible = true;

    if (this.options.onSelectState) {
      const filmedInfo = this.filmedStatesData.get(stateCode);
      this.options.onSelectState(state, filmedInfo);
    }
  }

  deselect() {
    if (this.selectedState) {
      const prevGroup = this.stateGroups.get(this.selectedState);
      if (prevGroup) {
        prevGroup.userData.targetZ = 0;
        this.animatedStates.add(prevGroup);
        const prevColor = prevGroup.userData.isFilmed
          ? (this.options.theme === 'console' ? 0x1d2830 : 0xecfdf5)
          : (this.options.theme === 'console' ? 0x181b24 : 0xf8fafc);
        prevGroup.userData.meshes.forEach(m => m.material.color.set(prevColor));
        if (prevGroup.userData.topBorderLines) {
          prevGroup.userData.topBorderLines.forEach(l => l.material = this.materials.topBorder);
        }
      }

      const oldMiniPin = this.miniPins.get(this.selectedState);
      if (oldMiniPin && this.options.showAllPins) oldMiniPin.visible = true;

      this.selectedState = null;
    }
    this.pinGroup.visible = false;
    if (this.options.onSelectState) {
      this.options.onSelectState(null, null);
    }
  }

  setTheme(themeName) {
    this.options.theme = themeName;
    this.updateThemeColors();
  }

  updateThemeColors() {
    const isDark = this.options.theme === 'console';
    if (isDark) {
      this.renderer.setClearColor(0x090a0d, 1);
      this.options.clayColor = '#181b24';
      this.materials.clay.color.set(0x181b24);
      this.materials.clay.roughness = 0.65;
      this.materials.filmed.color.set(0x1d2830);
      this.materials.edge.color.set(0x334155);
      this.materials.edge.opacity = 0.60;
      this.materials.topBorder.color.set(0x475569);
      this.materials.topBorder.opacity = 0.80;
      this.groundMat.opacity = 0.45;
      this.ambientLight.intensity = 0.45;
      this.sunLight.intensity = 0.90;
      this.hemiLight.color.set(0x404552);
      this.hemiLight.groundColor.set(0x090a0d);
    } else {
      // Light Clay Studio Mode (Exact reference palette #e5eeef background, #02c5cc CA, #f3f7f6 clay)
      this.renderer.setClearColor(0xe5eeef, 1);
      this.options.clayColor = '#f3f7f6';
      this.materials.clay.color.set(0xf3f7f6);
      this.materials.clay.roughness = 0.62;
      this.materials.filmed.color.set(0xf3f7f6);
      this.materials.highlight.color.set(0x02c5cc);
      this.materials.pinMetal.color.set(0x1acad3);
      this.materials.miniPinMetal.color.set(0x1acad3);
      // Subtle, delicate architectural laser-etched border lines (#c4d4ce, opacity 0.42)
      this.materials.topBorder.color.set(0xc4d4ce);
      this.materials.topBorder.opacity = 0.42;
      this.materials.selectedBorder.color.set(0x009aa2);
      this.materials.selectedBorder.opacity = 0.38;
      // Ultra-soft floor shadow (0.08)
      this.groundMat.opacity = 0.08;
      this.ambientLight.color.set(0xeef5f3);
      this.ambientLight.intensity = 0.58;
      this.sunLight.intensity = 1.15;
      this.hemiLight.color.set(0xffffff);
      this.hemiLight.groundColor.set(0xd8e6e4);
    }

    this.refreshFilmedMarkers();
  }

  resetCamera() {
    this.applyViewMode('isometric');
    const duration = 650;
    const startTime = performance.now();
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = this.defaultCameraPos.clone();
    const endTarget = this.defaultTarget.clone();

    const anim = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();
      if (progress < 1) {
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  setCameraPreset(preset) {
    let endPos = this.defaultCameraPos.clone();
    let endTarget = this.defaultTarget.clone();

    if (preset === 'topdown') {
      this.applyViewMode('topdown');
      endPos.set(10, 720, 10.01);
      endTarget.set(10, 0, 10);
    } else if (preset === 'free3d') {
      this.applyViewMode('free3d');
      return;
    } else { // 'isometric'
      this.applyViewMode('isometric');
      endPos.copy(this.defaultCameraPos);
      endTarget.copy(this.defaultTarget);
    }

    const duration = 650;
    const startTime = performance.now();
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const anim = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();
      if (progress < 1) {
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  initEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      this.mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    el.addEventListener('mousemove', (e) => {
      const dx = Math.abs(e.clientX - this.mouseDownPos.x);
      const dy = Math.abs(e.clientY - this.mouseDownPos.y);
      if (dx > 4 || dy > 4) {
        this.isDragging = true;
      }

      const rect = el.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.checkHover();
    });

    el.addEventListener('mouseup', (e) => {
      if (!this.isDragging) {
        this.handleClick();
      }
    });

    this.onResize = () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('resize', this.onResize);
  }

  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = [];
    this.stateGroups.forEach(g => {
      meshes.push(...g.userData.meshes);
    });

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const parentGroup = hitMesh.userData.parentGroup;
      const state = parentGroup.userData.stateData;

      if (this.hoveredState !== state.code) {
        if (this.hoveredState && this.hoveredState !== this.selectedState) {
          const oldGroup = this.stateGroups.get(this.hoveredState);
          if (oldGroup) {
            const oldColor = oldGroup.userData.isFilmed
              ? (this.options.theme === 'console' ? 0x1d2830 : 0xecfdf5)
              : (this.options.theme === 'console' ? 0x181b24 : 0xf8fafc);
            oldGroup.userData.meshes.forEach(m => m.material.color.set(oldColor));
          }
        }

        this.hoveredState = state.code;
        this.container.style.cursor = 'pointer';

        if (state.code !== this.selectedState) {
          const hoverColor = this.options.theme === 'console' ? 0x222a36 : 0xe8f4f6;
          parentGroup.userData.meshes.forEach(m => m.material.color.set(hoverColor));
        }

        if (this.options.onHoverState) {
          const filmedInfo = this.filmedStatesData.get(state.code);
          this.options.onHoverState(state, filmedInfo);
        }
      }
    } else {
      if (this.hoveredState) {
        if (this.hoveredState !== this.selectedState) {
          const oldGroup = this.stateGroups.get(this.hoveredState);
          if (oldGroup) {
            const oldColor = oldGroup.userData.isFilmed
              ? (this.options.theme === 'console' ? 0x1d2830 : 0xecfdf5)
              : (this.options.theme === 'console' ? 0x181b24 : 0xf8fafc);
            oldGroup.userData.meshes.forEach(m => m.material.color.set(oldColor));
          }
        }
        this.hoveredState = null;
        this.container.style.cursor = 'default';
        if (this.options.onHoverState) {
          this.options.onHoverState(null, null);
        }
      }
    }
  }

  handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = [];
    this.stateGroups.forEach(g => {
      meshes.push(...g.userData.meshes);
    });

    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const parentGroup = hitMesh.userData.parentGroup;
      const code = parentGroup.userData.code;
      if (this.selectedState === code) {
        this.deselect();
      } else {
        this.selectState(code);
      }
    } else {
      this.deselect();
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.controls.update();

    // Elevation transitions
    if (this.animatedStates.size > 0) {
      this.animatedStates.forEach(group => {
        const u = group.userData;
        const diff = u.targetZ - u.currentZ;
        if (Math.abs(diff) < 0.02) {
          u.currentZ = u.targetZ;
          group.position.z = u.currentZ;
          this.animatedStates.delete(group);
        } else {
          u.currentZ += diff * 0.18;
          group.position.z = u.currentZ;
        }

        // Keep pin marker synced with state top surface
        if (this.selectedState === u.code) {
          this.scene.updateMatrixWorld(true);
          const worldPos = this.getStateWorldCenter(u.code);
          this.pinGroup.position.copy(worldPos);
        }
      });
    }

    // Billboard badges always face camera
    if (this.badgeMesh && this.pinGroup.visible) {
      this.badgeMesh.quaternion.copy(this.camera.quaternion);
    }
    this.miniPins.forEach(p => {
      if (p.visible && p.userData.badgeMesh) {
        p.userData.badgeMesh.quaternion.copy(this.camera.quaternion);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
