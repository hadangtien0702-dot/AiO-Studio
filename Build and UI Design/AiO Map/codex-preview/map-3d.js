/**
 * AiO Isometric USA Map - 3D Engine (Three.js)
 * Clean Matte Clay 3D styling, state elevation, 3D pin billboard marker, realistic soft shadows.
 * Client Interview Production Tracker enhancements.
 * Strictly NO emojis. Pure inline SVGs.
 */

class IsometricMap3D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      scale: 0.52,
      baseDepth: 8,
      elevationHeight: 14,
      highlightColor: '#00b4b6', // Teal from reference images
      filmedColor: '#e0f2f1', // Subtle teal-tinted clay for filmed states
      clayColor: '#eff2f5',
      theme: 'clay', // 'clay' (light) or 'console' (dark)
      showAllPins: true,
      onSelectState: null,
      onHoverState: null
    }, options);

    this.statesData = null;
    this.stateGroups = new Map(); // code -> THREE.Group
    this.filmedStatesData = new Map(); // code -> { count, interviews }
    this.miniPins = new Map(); // code -> THREE.Group
    this.selectedState = null;
    this.hoveredState = null;

    // Animation states
    this.animatedStates = new Set();

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.isDragging = false;
    this.mouseDownPos = { x: 0, y: 0 };

    // Lighting & Shadows
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.groundMesh = null;

    // Materials cache
    this.materials = {};

    // 3D Main Pin Marker
    this.pinGroup = null;

    // Camera preset coordinates
    this.defaultCameraPos = new THREE.Vector3(260, 340, 330);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);

    this.init();
  }

  init() {
    this.initScene();
    this.initMaterials();
    this.initLighting();
    this.initMainPinMarker();
    this.initGround();
    this.initEvents();
    this.updateThemeColors();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    // Low FOV perspective mimics authentic architectural isometric projection
    this.camera = new THREE.PerspectiveCamera(25, width / height, 10, 3000);
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
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 180;
    this.controls.maxDistance = 1400;
    this.controls.target.copy(this.defaultTarget);
  }

  initMaterials() {
    // Clay Base Material
    this.materials.clay = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.clayColor),
      roughness: 0.65,
      metalness: 0.04,
      flatShading: false
    });

    // Filmed State Material (Subtle indicator that state has interviews)
    this.materials.filmed = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e0f4f5'),
      roughness: 0.6,
      metalness: 0.06,
      flatShading: false
    });

    // Highlighted / Selected State Material (Teal/Turquoise)
    this.materials.highlight = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.highlightColor),
      roughness: 0.45,
      metalness: 0.08,
      flatShading: false
    });

    // Border line material
    this.materials.edge = new THREE.LineBasicMaterial({
      color: 0xc4c9d2,
      transparent: true,
      opacity: 0.55
    });

    // Pin materials
    this.materials.pinMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.highlightColor),
      roughness: 0.3,
      metalness: 0.4
    });

    this.materials.miniPinMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.highlightColor),
      roughness: 0.3,
      metalness: 0.3
    });
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8e2ec, 0.38);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.95);
    this.sunLight.position.set(220, 420, 240);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1200;

    const d = 320;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.radius = 3.2;
    this.scene.add(this.sunLight);

    const fillLight = new THREE.DirectionalLight(0xd9e5f2, 0.35);
    fillLight.position.set(-200, 250, -180);
    this.scene.add(fillLight);
  }

  initGround() {
    const groundGeom = new THREE.PlaneGeometry(2400, 2400);
    this.groundMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    this.groundMesh = new THREE.Mesh(groundGeom, this.groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.05;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  initMainPinMarker() {
    this.pinGroup = new THREE.Group();
    this.pinGroup.visible = false;

    // 1. Base ring on state surface
    const baseGeom = new THREE.CylinderGeometry(3.6, 4.2, 1.2, 32);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.pinMetal);
    baseMesh.position.y = 0.6;
    baseMesh.castShadow = true;
    this.pinGroup.add(baseMesh);

    // Inner white dot in base ring
    const innerDotGeom = new THREE.CylinderGeometry(1.4, 1.4, 1.3, 24);
    const innerDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const innerDotMesh = new THREE.Mesh(innerDotGeom, innerDotMat);
    innerDotMesh.position.y = 0.65;
    this.pinGroup.add(innerDotMesh);

    // 2. Slender vertical pole
    const poleHeight = 36;
    const poleGeom = new THREE.CylinderGeometry(0.7, 0.7, poleHeight, 16);
    this.poleMesh = new THREE.Mesh(poleGeom, this.materials.pinMetal);
    this.poleMesh.position.y = poleHeight / 2 + 0.6;
    this.poleMesh.castShadow = true;
    this.pinGroup.add(this.poleMesh);

    // 3. Top joint bead
    const jointGeom = new THREE.SphereGeometry(1.1, 16, 16);
    const jointMesh = new THREE.Mesh(jointGeom, this.materials.pinMetal);
    jointMesh.position.y = poleHeight + 0.6;
    this.pinGroup.add(jointMesh);

    // 4. Billboard badge card (512x140 canvas)
    this.billboardCanvas = document.createElement('canvas');
    this.billboardCanvas.width = 512;
    this.billboardCanvas.height = 140;
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
    this.badgeMesh.position.set(0, poleHeight + 6.2, 0);
    this.pinGroup.add(this.badgeMesh);

    // 5. Projected shadow sprite on state top surface
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(128, 32, 2, 128, 32, 110);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowPlaneGeom = new THREE.PlaneGeometry(badgeWidth * 0.9, 7);
    this.badgeShadowMesh = new THREE.Mesh(shadowPlaneGeom, shadowMat);
    this.badgeShadowMesh.rotation.x = -Math.PI / 2;
    this.badgeShadowMesh.position.set(6, 0.1, 8);
    this.pinGroup.add(this.badgeShadowMesh);

    this.scene.add(this.pinGroup);
  }

  updateBillboardText(title, subtitle = '') {
    const ctx = this.billboardCanvas.getContext('2d');
    const w = this.billboardCanvas.width;
    const h = this.billboardCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const pad = 8;
    const rx = pad;
    const ry = pad;
    const rw = w - pad * 2;
    const rh = h - pad * 2;
    const radius = 18;

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(rx, ry, rw, rh, radius);
    } else {
      ctx.rect(rx, ry, rw, rh);
    }
    ctx.fill();

    // Subtle border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';

    if (subtitle) {
      // Line 1: State name
      ctx.fillStyle = this.options.highlightColor;
      ctx.font = '900 38px "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText((title || '').toUpperCase(), w / 2, 58);

      // Line 2: Interview status badge
      ctx.fillStyle = '#475569';
      ctx.font = '700 24px "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(subtitle.toUpperCase(), w / 2, 98);
    } else {
      // Single line state name
      ctx.fillStyle = this.options.highlightColor;
      ctx.font = '900 46px "Inter var", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText((title || '').toUpperCase(), w / 2, h / 2);
    }

    this.billboardTex.needsUpdate = true;
  }

  loadStatesData(data) {
    this.statesData = data;
    this.buildMapMeshes();
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
        targetY: 0,
        currentY: 0,
        isFilmed: false,
        meshes: []
      };

      const geom = state.geometry;
      const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

      polygons.forEach(poly => {
        const outerRing = poly[0];
        if (!outerRing || outerRing.length < 3) return;

        const shape = new THREE.Shape();
        outerRing.forEach(([px, py], i) => {
          const x = (px - centerX) * scale;
          const y = -(py - centerY) * scale;
          if (i === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        });

        for (let h = 1; h < poly.length; h++) {
          const holeRing = poly[h];
          if (!holeRing || holeRing.length < 3) continue;
          const holePath = new THREE.Path();
          holeRing.forEach(([px, py], i) => {
            const x = (px - centerX) * scale;
            const y = -(py - centerY) * scale;
            if (i === 0) holePath.moveTo(x, y);
            else holePath.lineTo(x, y);
          });
          shape.holes.push(holePath);
        }

        const extrudeGeom = new THREE.ExtrudeGeometry(shape, {
          depth: depth,
          bevelEnabled: true,
          bevelThickness: 0.65,
          bevelSize: 0.5,
          bevelSegments: 2
        });

        extrudeGeom.rotateX(-Math.PI / 2);
        extrudeGeom.computeVertexNormals();

        const meshMat = this.materials.clay.clone();
        const mesh = new THREE.Mesh(extrudeGeom, meshMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
          parentGroup: stateGroup,
          stateCode: state.code
        };

        const edges = new THREE.EdgesGeometry(extrudeGeom, 32);
        const line = new THREE.LineSegments(edges, this.materials.edge);
        mesh.add(line);

        stateGroup.add(mesh);
        stateGroup.userData.meshes.push(mesh);
      });

      state.center3D = new THREE.Vector3(
        (state.centroid[0] - centerX) * scale,
        depth,
        (state.centroid[1] - centerY) * scale
      );

      this.scene.add(stateGroup);
      this.stateGroups.set(state.code, stateGroup);
    });

    // Refresh filmed states markers if any was set prior to load
    this.refreshFilmedMarkers();
  }

  updateFilmedStates(filmedMap) {
    this.filmedStatesData = filmedMap; // code -> { count, latestClient, interviews }
    this.refreshFilmedMarkers();
  }

  refreshFilmedMarkers() {
    if (!this.stateGroups || this.stateGroups.size === 0) return;

    // Clear existing mini-pins
    this.miniPins.forEach(p => this.scene.remove(p));
    this.miniPins.clear();

    this.stateGroups.forEach((group, code) => {
      const isFilmed = this.filmedStatesData.has(code);
      group.userData.isFilmed = isFilmed;

      // Subtle surface tint for filmed states when unselected
      if (code !== this.selectedState) {
        const matColor = isFilmed
          ? (this.options.theme === 'console' ? '#1c2930' : '#e6f5f5')
          : this.options.clayColor;
        group.userData.meshes.forEach(m => m.material.color.set(matColor));
      }

      // Add Mini-Pin if filmed and not currently selected
      if (isFilmed && this.options.showAllPins) {
        const info = this.filmedStatesData.get(code);
        const state = group.userData.stateData;
        const miniPin = this.createMiniPin(state, info ? info.count : 1);
        miniPin.visible = (code !== this.selectedState);
        this.scene.add(miniPin);
        this.miniPins.set(code, miniPin);
      }
    });
  }

  createMiniPin(state, count) {
    const pin = new THREE.Group();
    const pinH = 14;

    // Needle pole
    const rodGeom = new THREE.CylinderGeometry(0.45, 0.45, pinH, 12);
    const rodMesh = new THREE.Mesh(rodGeom, this.materials.miniPinMetal);
    rodMesh.position.y = pinH / 2;
    rodMesh.castShadow = true;
    pin.add(rodMesh);

    // Base ring
    const baseGeom = new THREE.CylinderGeometry(2, 2.4, 0.8, 18);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.miniPinMetal);
    baseMesh.position.y = 0.4;
    pin.add(baseMesh);

    // Top sphere bead
    const sphereGeom = new THREE.SphereGeometry(1.4, 16, 16);
    const sphereMesh = new THREE.Mesh(sphereGeom, this.materials.miniPinMetal);
    sphereMesh.position.y = pinH;
    pin.add(sphereMesh);

    pin.position.set(state.center3D.x, state.center3D.y, state.center3D.z);
    return pin;
  }

  setShowAllPins(show) {
    this.options.showAllPins = show;
    this.miniPins.forEach((pin, code) => {
      pin.visible = show && (code !== this.selectedState);
    });
  }

  selectState(stateCode, animateCamera = false) {
    if (!stateCode) {
      this.deselect();
      return;
    }

    const group = this.stateGroups.get(stateCode);
    if (!group) return;

    // Previous selection reset
    if (this.selectedState && this.selectedState !== stateCode) {
      const prevGroup = this.stateGroups.get(this.selectedState);
      if (prevGroup) {
        prevGroup.userData.targetY = 0;
        this.animatedStates.add(prevGroup);
        const prevColor = prevGroup.userData.isFilmed
          ? (this.options.theme === 'console' ? '#1c2930' : '#e6f5f5')
          : this.options.clayColor;
        prevGroup.userData.meshes.forEach(m => m.material.color.set(prevColor));
      }

      // Show back old mini-pin if it had one
      const oldMiniPin = this.miniPins.get(this.selectedState);
      if (oldMiniPin && this.options.showAllPins) oldMiniPin.visible = true;
    }

    this.selectedState = stateCode;
    const state = group.userData.stateData;

    // Hide mini-pin for current selected state
    const curMiniPin = this.miniPins.get(stateCode);
    if (curMiniPin) curMiniPin.visible = false;

    // Elevate selected state
    group.userData.targetY = this.options.elevationHeight;
    this.animatedStates.add(group);

    // Apply highlight color
    group.userData.meshes.forEach(m => {
      m.material.color.set(this.options.highlightColor);
    });

    // Check filmed interviews info for billboard subtitle
    const filmedInfo = this.filmedStatesData.get(stateCode);
    let sub = '';
    if (filmedInfo && filmedInfo.count > 0) {
      sub = `${filmedInfo.count} Filmed (${filmedInfo.latestClient || 'Client'})`;
    } else {
      sub = '0 Interviews';
    }

    // Update & position 3D Pin Marker
    this.updateBillboardText(state.name, sub);
    this.pinGroup.position.set(state.center3D.x, state.center3D.y + group.userData.targetY, state.center3D.z);
    this.pinGroup.visible = true;

    if (animateCamera) {
      this.flyCameraTo(state.center3D);
    }

    if (this.options.onSelectState) {
      this.options.onSelectState(state, filmedInfo);
    }
  }

  deselect() {
    if (this.selectedState) {
      const prevGroup = this.stateGroups.get(this.selectedState);
      if (prevGroup) {
        prevGroup.userData.targetY = 0;
        this.animatedStates.add(prevGroup);
        const prevColor = prevGroup.userData.isFilmed
          ? (this.options.theme === 'console' ? '#1c2930' : '#e6f5f5')
          : this.options.clayColor;
        prevGroup.userData.meshes.forEach(m => m.material.color.set(prevColor));
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

  setElevationHeight(height) {
    this.options.elevationHeight = height;
    if (this.selectedState) {
      const group = this.stateGroups.get(this.selectedState);
      if (group) {
        group.userData.targetY = height;
        this.animatedStates.add(group);
      }
    }
  }

  setHighlightColor(hexColor) {
    this.options.highlightColor = hexColor;
    this.materials.highlight.color.set(hexColor);
    this.materials.pinMetal.color.set(hexColor);
    this.materials.miniPinMetal.color.set(hexColor);

    if (this.selectedState) {
      const group = this.stateGroups.get(this.selectedState);
      if (group) {
        group.userData.meshes.forEach(m => m.material.color.set(hexColor));
        const filmedInfo = this.filmedStatesData.get(this.selectedState);
        const sub = filmedInfo && filmedInfo.count > 0 ? `${filmedInfo.count} Filmed` : '';
        this.updateBillboardText(group.userData.stateData.name, sub);
      }
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
      this.options.clayColor = '#161922';
      this.materials.clay.color.set(0x161922);
      this.materials.clay.roughness = 0.7;
      this.materials.edge.color.set(0x282e3c);
      this.materials.edge.opacity = 0.6;
      this.groundMat.opacity = 0.45;
      this.ambientLight.intensity = 0.5;
      this.sunLight.intensity = 0.85;
      this.hemiLight.color.set(0x404552);
      this.hemiLight.groundColor.set(0x090a0d);
    } else {
      this.renderer.setClearColor(0xecf0f4, 1);
      this.options.clayColor = '#f0f3f6';
      this.materials.clay.color.set(0xf0f3f6);
      this.materials.clay.roughness = 0.65;
      this.materials.edge.color.set(0xc8cfd8);
      this.materials.edge.opacity = 0.55;
      this.groundMat.opacity = 0.16;
      this.ambientLight.intensity = 0.72;
      this.sunLight.intensity = 0.95;
      this.hemiLight.color.set(0xffffff);
      this.hemiLight.groundColor.set(0xd8e2ec);
    }

    this.refreshFilmedMarkers();
  }

  flyCameraTo(targetVec3) {
    const startTarget = this.controls.target.clone();
    const endTarget = new THREE.Vector3(targetVec3.x, 0, targetVec3.z);

    const startTime = performance.now();
    const duration = 650;

    const animateCamera = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    requestAnimationFrame(animateCamera);
  }

  setCameraPreset(presetName) {
    const duration = 750;
    const startTime = performance.now();
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    let endPos = this.defaultCameraPos.clone();
    let endTarget = this.defaultTarget.clone();

    if (presetName === 'isometric') {
      endPos = new THREE.Vector3(260, 340, 330);
      endTarget = new THREE.Vector3(0, 0, 0);
    } else if (presetName === 'topdown') {
      endPos = new THREE.Vector3(0, 480, 5);
      endTarget = new THREE.Vector3(0, 0, 0);
    } else if (presetName === 'cinematic') {
      endPos = new THREE.Vector3(190, 160, 290);
      endTarget = new THREE.Vector3(0, 10, 0);
    }

    const anim = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
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

    window.addEventListener('resize', () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
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
              ? (this.options.theme === 'console' ? '#1c2930' : '#e6f5f5')
              : this.options.clayColor;
            oldGroup.userData.meshes.forEach(m => m.material.color.set(oldColor));
          }
        }

        this.hoveredState = state.code;
        this.container.style.cursor = 'pointer';

        if (state.code !== this.selectedState) {
          parentGroup.userData.meshes.forEach(m => m.material.color.set(0xffffff));
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
              ? (this.options.theme === 'console' ? '#1c2930' : '#e6f5f5')
              : this.options.clayColor;
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
    requestAnimationFrame(this.animate);

    // The illustrated view does not need a continuously rendered WebGL scene.
    if (this.container.style.visibility === 'hidden') return;

    this.controls.update();

    if (this.animatedStates.size > 0) {
      this.animatedStates.forEach(group => {
        const u = group.userData;
        const diff = u.targetY - u.currentY;
        if (Math.abs(diff) < 0.05) {
          u.currentY = u.targetY;
          group.position.y = u.currentY;
          this.animatedStates.delete(group);
        } else {
          u.currentY += diff * 0.15;
          group.position.y = u.currentY;
        }

        if (this.selectedState === u.code) {
          const state = u.stateData;
          this.pinGroup.position.set(state.center3D.x, state.center3D.y + u.currentY, state.center3D.z);
        }
      });
    }

    if (this.badgeMesh && this.pinGroup.visible) {
      this.badgeMesh.quaternion.copy(this.camera.quaternion);
    }

    this.renderer.render(this.scene, this.camera);
  }

  exportPNG(options = {}) {
    const { transparent = false, multiplier = 2 } = options;

    const originalWidth = this.container.clientWidth;
    const originalHeight = this.container.clientHeight;
    const originalPixelRatio = this.renderer.getPixelRatio();
    const originalClearColor = new THREE.Color();
    const originalClearAlpha = this.renderer.getClearAlpha();
    this.renderer.getClearColor(originalClearColor);

    if (transparent) {
      this.renderer.setClearColor(0x000000, 0);
      this.groundMesh.visible = false;
    }

    this.renderer.setPixelRatio(multiplier);
    this.renderer.setSize(originalWidth, originalHeight);
    this.renderer.render(this.scene, this.camera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    if (transparent) {
      this.renderer.setClearColor(originalClearColor, originalClearAlpha);
      this.groundMesh.visible = true;
    }
    this.renderer.setPixelRatio(originalPixelRatio);
    this.renderer.setSize(originalWidth, originalHeight);
    this.renderer.render(this.scene, this.camera);

    const link = document.createElement('a');
    const stateName = this.selectedState ? `-${this.selectedState}` : '';
    link.download = `AiO-US-Interview-Map${stateName}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }
}

window.IsometricMap3D = IsometricMap3D;
