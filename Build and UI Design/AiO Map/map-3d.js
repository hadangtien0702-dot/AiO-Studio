/**
 * AiO Isometric USA Map - 3D Engine (Three.js)
 * High-end Matte Clay 3D styling matching reference images 1:1.
 * Pure white porcelain slab, crisp directional studio shadows, turquoise active state, 3D billboard pin.
 * Strictly NO emojis. Pure inline SVGs.
 */

class IsometricMap3D {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      scale: 0.52,
      baseDepth: 9,
      elevationHeight: 3.5, // Subtle tactile elevation matching reference photo
      highlightColor: '#00adb5',
      clayColor: '#f8fafc',
      theme: 'clay',
      showAllPins: false,
      onSelectState: null,
      onHoverState: null
    }, options);

    this.statesData = null;
    this.stateGroups = new Map(); // code -> THREE.Group
    this.filmedStatesData = new Map(); // code -> { count, latestClient, interviews }
    this.miniPins = new Map(); // code -> THREE.Group
    this.selectedState = null;
    this.hoveredState = null;

    this.animatedStates = new Set();

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mapRootGroup = null; // Root group containing all states, rotated flat
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.isDragging = false;
    this.mouseDownPos = { x: 0, y: 0 };

    this.sunLight = null;
    this.ambientLight = null;
    this.fillLight = null;
    this.groundMesh = null;
    this.groundMat = null;

    this.materials = {};
    this.pinGroup = null;

    // Camera preset coordinates matching the exact isometric reference photo framing
    this.defaultCameraPos = new THREE.Vector3(-20, 560, 520);
    this.defaultTarget = new THREE.Vector3(10, 0, 10);
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
    requestAnimationFrame(this.animate);
  }

  initScene() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();

    // Map root group: laying flat on ground (Local X->World X, Local Y->World -Z, Local Z->World +Y)
    this.mapRootGroup = new THREE.Group();
    this.mapRootGroup.rotation.x = -Math.PI / 2;
    this.scene.add(this.mapRootGroup);

    // Perspective camera with low FOV (24) gives authentic architectural isometric perspective
    this.camera = new THREE.PerspectiveCamera(24, width / height, 10, 3000);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultTarget);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Transparent canvas so rich CSS studio gradient displays
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

    // Calculate fixed isometric polar & azimuth angle from default camera vector
    const offset = new THREE.Vector3().subVectors(this.defaultCameraPos, this.defaultTarget);
    this.fixedPolarAngle = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
    this.fixedAzimuthAngle = Math.atan2(offset.x, offset.z);

    // OrbitControls: In fixed 2.5D isometric mode, tilt is locked to prevent camera tumbling
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
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
      // Strictly lock tilt (polar) angle & azimuth angle: 2.5D cut stays flawless!
      this.controls.minPolarAngle = this.fixedPolarAngle;
      this.controls.maxPolarAngle = this.fixedPolarAngle;
      this.controls.minAzimuthAngle = this.fixedAzimuthAngle;
      this.controls.maxAzimuthAngle = this.fixedAzimuthAngle;
      // Mouse buttons: Left drag pans, Wheel zooms, Click selects
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
      this.controls.maxPolarAngle = Math.PI / 2.3; // Prevent going below ground
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
    // 1. Pure Matte White Clay (sculptural porcelain) with polygonOffset to guarantee border lines never sink
    this.materials.clay = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.55,
      metalness: 0.01,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // 2. Filmed state material (clean subtle mint/teal tone)
    this.materials.filmed = new THREE.MeshStandardMaterial({
      color: 0xecfdf5,
      roughness: 0.52,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // 3. Highlighted / Selected State (Vibrant turquoise/teal matching reference photos)
    this.materials.highlight = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.highlightColor || '#00adb5'),
      roughness: 0.38,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // 4. Side bevel etched seam contours
    this.materials.edge = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.75,
      depthTest: true
    });

    // 5. Dedicated top-surface perimeter border lines (Crisp slate-700 in light mode - Prominent!)
    this.materials.topBorder = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.90,
      depthTest: true
    });

    // 6. Selected state top-surface border line
    this.materials.selectedBorder = new THREE.LineBasicMaterial({
      color: 0x00585f,
      transparent: true,
      opacity: 0.95,
      depthTest: true
    });

    // 7. Pin metal (matching teal)
    this.materials.pinMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.highlightColor || '#00adb5'),
      roughness: 0.28,
      metalness: 0.40
    });

    this.materials.miniPinMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.options.highlightColor || '#00adb5'),
      roughness: 0.3,
      metalness: 0.35
    });
  }

  initLighting() {
    // Balanced ambient fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    this.scene.add(this.ambientLight);

    // Hemisphere light for natural sky/ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xd0e2e8, 0.38);
    this.scene.add(this.hemiLight);

    // Main Key Sun Light (from West/South-West, casting pin shadow onto Nevada/Utah & map ground shadow)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.15);
    this.sunLight.position.set(-200, 440, 190);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 50;
    this.sunLight.shadow.camera.far = 1200;

    const d = 340;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.radius = 3.6; // Soft shadow edges
    this.scene.add(this.sunLight);

    // Cool secondary fill light from opposite angle
    this.fillLight = new THREE.DirectionalLight(0xd2e4ed, 0.35);
    this.fillLight.position.set(220, 200, -160);
    this.scene.add(this.fillLight);
  }

  initGround() {
    const groundGeom = new THREE.PlaneGeometry(2400, 2400);
    this.groundMat = new THREE.ShadowMaterial({ opacity: 0.18 });
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
    const baseGeom = new THREE.CylinderGeometry(2.2, 2.6, 0.8, 32);
    const whiteBaseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const baseMesh = new THREE.Mesh(baseGeom, whiteBaseMat);
    baseMesh.position.y = 0.40;
    baseMesh.castShadow = true;
    this.pinGroup.add(baseMesh);

    const innerDotGeom = new THREE.CylinderGeometry(1.0, 1.0, 0.9, 24);
    const innerDotMesh = new THREE.Mesh(innerDotGeom, this.materials.pinMetal);
    innerDotMesh.position.y = 0.48;
    this.pinGroup.add(innerDotMesh);

    // 2. Slender vertical needle pole (Teal, matching reference photos 2 & 3)
    const poleHeight = 36;
    const poleGeom = new THREE.CylinderGeometry(0.42, 0.42, poleHeight, 16);
    this.poleMesh = new THREE.Mesh(poleGeom, this.materials.pinMetal);
    this.poleMesh.position.y = poleHeight / 2 + 0.4;
    this.poleMesh.castShadow = true;
    this.pinGroup.add(this.poleMesh);

    // 3. Top joint bead
    const jointGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const jointMesh = new THREE.Mesh(jointGeom, this.materials.pinMetal);
    jointMesh.position.y = poleHeight + 0.4;
    this.pinGroup.add(jointMesh);

    // 4. Billboard badge plaque (512x140 canvas)
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

    const badgeWidth = 32;
    const badgeHeight = 8.8;
    const badgeGeom = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
    this.badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
    this.badgeMesh.position.set(0, poleHeight + badgeHeight / 2 + 0.6, 0);
    this.pinGroup.add(this.badgeMesh);

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
    const radius = 22;

    // Drop shadow on plaque
    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    // Pure white plaque background
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
    ctx.strokeStyle = 'rgba(0, 173, 181, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Exact match to user photos (spaced uppercase: CALIFORNIA / TEXAS)
    const spacedTitle = (title || '').toUpperCase().split('').join('  ');
    ctx.fillStyle = this.options.highlightColor || '#00adb5';
    ctx.font = '800 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(spacedTitle, w / 2, h / 2 + 1);

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

    const bevelThickness = 0.5;
    const bevelSize = 0.25;

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

          // Top perimeter line points, elevated slightly by 0.08 above top face to guarantee zero z-fighting
          borderPoints.push(new THREE.Vector3(x, y, depth + bevelThickness + 0.08));
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

            holeBorderPoints.push(new THREE.Vector3(x, y, depth + bevelThickness + 0.08));
          });
          shape.holes.push(holePath);

          // Top hole perimeter line
          const holeGeom = new THREE.BufferGeometry().setFromPoints(holeBorderPoints);
          const holeLine = new THREE.LineLoop(holeGeom, this.materials.topBorder);
          stateGroup.add(holeLine);
          stateGroup.userData.topBorderLines.push(holeLine);
        }

        const extrudeGeom = new THREE.ExtrudeGeometry(shape, {
          depth: depth,
          bevelEnabled: true,
          bevelThickness: bevelThickness,
          bevelSize: bevelSize,
          bevelSegments: 2
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

        // Bevel edge contours for vertical seams
        const edges = new THREE.EdgesGeometry(extrudeGeom, 30);
        const line = new THREE.LineSegments(edges, this.materials.edge);
        mesh.add(line);

        // Top perimeter border line loop for crisp, prominent boundary in light mode
        const borderGeom = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const topBorderLine = new THREE.LineLoop(borderGeom, this.materials.topBorder);
        stateGroup.add(topBorderLine);
        stateGroup.userData.topBorderLines.push(topBorderLine);

        stateGroup.add(mesh);
        stateGroup.userData.meshes.push(mesh);
      });

      // Calculate state local centroid (Z = depth + bevelThickness so pin sits exactly on top surface)
      stateGroup.userData.localCentroid = new THREE.Vector3(
        (state.centroid[0] - centerX) * scale,
        -(state.centroid[1] - centerY) * scale,
        depth + bevelThickness
      );

      this.mapRootGroup.add(stateGroup);
      this.stateGroups.set(state.code, stateGroup);
    });

    // CRITICAL: Ensure full scene hierarchy matrix is updated before any pins or calculations!
    this.scene.updateMatrixWorld(true);

    this.refreshFilmedMarkers();
  }

  // Converts local point of a state group to world coordinates
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
        const matColor = isFilmed
          ? (this.options.theme === 'console' ? 0x1d2830 : 0xecfdf5)
          : (this.options.theme === 'console' ? 0x181b24 : 0xf8fafc);
        group.userData.meshes.forEach(m => m.material.color.set(matColor));
      }

      // Add Mini-Pin if filmed and not currently selected
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
    const pinH = 12;

    const rodGeom = new THREE.CylinderGeometry(0.38, 0.38, pinH, 12);
    const rodMesh = new THREE.Mesh(rodGeom, this.materials.miniPinMetal);
    rodMesh.position.y = pinH / 2;
    rodMesh.castShadow = true;
    pin.add(rodMesh);

    const baseGeom = new THREE.CylinderGeometry(1.8, 2.2, 0.7, 20);
    const baseMesh = new THREE.Mesh(baseGeom, this.materials.miniPinMetal);
    baseMesh.position.y = 0.35;
    pin.add(baseMesh);

    const sphereGeom = new THREE.SphereGeometry(1.3, 16, 16);
    const sphereMesh = new THREE.Mesh(sphereGeom, this.materials.miniPinMetal);
    sphereMesh.position.y = pinH;
    pin.add(sphereMesh);

    this.scene.updateMatrixWorld(true);
    const worldPos = this.getStateWorldCenter(group.userData.code);
    pin.position.copy(worldPos);
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

    // Subtle tactile elevation (3.5 units, matching reference)
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

    if (animateCamera && this.viewMode === 'free3d') {
      this.flyCameraTo(worldPos);
    }

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

  setElevationHeight(height) {
    this.options.elevationHeight = height;
    if (this.selectedState) {
      const group = this.stateGroups.get(this.selectedState);
      if (group) {
        group.userData.targetZ = height;
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
        this.updateBillboardText(group.userData.stateData.name);
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
      // Light Clay Studio Mode (transparent canvas, crisp directional shadows)
      this.renderer.setClearColor(0x000000, 0);
      this.options.clayColor = '#f8fafc';
      this.materials.clay.color.set(0xf8fafc);
      this.materials.clay.roughness = 0.55;
      this.materials.filmed.color.set(0xecfdf5);
      this.materials.edge.color.set(0x475569);
      this.materials.edge.opacity = 0.75;
      // High contrast dark slate borders (prominent, never sunken!)
      this.materials.topBorder.color.set(0x334155);
      this.materials.topBorder.opacity = 0.90;
      this.groundMat.opacity = 0.20;
      this.ambientLight.intensity = 0.65;
      this.sunLight.intensity = 1.05;
      this.hemiLight.color.set(0xffffff);
      this.hemiLight.groundColor.set(0xd8e8ea);
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
    requestAnimationFrame(this.animate);

    this.controls.update();

    // Elevation transitions
    if (this.animatedStates.size > 0) {
      this.animatedStates.forEach(group => {
        const u = group.userData;
        const diff = u.targetZ - u.currentZ;
        if (Math.abs(diff) < 0.02) {
          u.currentZ = u.targetZ;
          group.position.z = u.currentZ; // Along local Z (world Y upwards!)
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

    // Billboard badge always faces camera
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
