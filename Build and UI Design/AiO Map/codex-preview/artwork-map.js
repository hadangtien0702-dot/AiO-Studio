/* Illustrated map adapter. Geographic data and interview records stay independent
 * of the generated artwork. Positions are illustration anchors, not GPS locations. */
class ProductionMapView {
  constructor(container, options) {
    this.container = container;
    this.options = { ...options };
    this.selectedState = null;
    this.region = 'ALL';
    this.filmedStates = new Map();
    this.mode = 'artwork';
    this.engine = null;
    this.images = {
      overview: 'assets/concepts/usa-isometric-v1/usa-overview.png',
      CA: 'assets/concepts/usa-isometric-v1/usa-california.png',
      TX: 'assets/concepts/usa-isometric-v1/usa-texas.png'
    };
    // Pixel anchors on the 1254-square illustration. Small Northeast states use
    // the accessible state chooser instead of overlapping, tiny touch targets.
    this.anchors = {
      AL:[843,661], AK:[210,807], AZ:[287,581], AR:[695,601], CA:[148,478],
      CO:[434,489], CT:[1123,406], DE:[1082,492], DC:[1058,510], FL:[982,788],
      GA:[921,660], HI:[514,915], ID:[307,357], IL:[767,491], IN:[843,482],
      IA:[676,441], KS:[576,508], KY:[897,536], LA:[689,693], ME:[1176,315],
      MD:[1056,490], MA:[1134,388], MI:[871,404], MN:[677,336], MS:[770,668],
      MO:[697,516], MT:[405,303], NE:[555,443], NV:[233,451], NH:[1130,353],
      NJ:[1102,452], NM:[412,586], NY:[1062,396], NC:[1005,589], ND:[558,302],
      OH:[917,479], OK:[577,588], OR:[193,328], PA:[1013,451], RI:[1147,404],
      SC:[970,631], SD:[555,375], TN:[889,590], TX:[549,694], UT:[325,461],
      VT:[1107,352], VA:[1007,538], WA:[223,251], WV:[970,514], WI:[758,385], WY:[417,399]
    };
    this.stage = document.createElement('section');
    this.stage.className = 'artwork-stage';
    this.stage.setAttribute('aria-label', 'United States interview map');
    this.stage.innerHTML = `
      <div class="artwork-heading"><div><span class="artwork-eyebrow">YOUR PRODUCTION JOURNEY</span>
        <h1>Across the United States.</h1><p>People met. Stories filmed. Places to go.</p></div>
        <label class="artwork-chooser">Explore a state<select id="artwork-state"><option value="">All states</option></select></label></div>
      <div class="artwork-board"><div class="artwork-canvas">
        <img class="artwork-image" width="1254" height="1254" fetchpriority="high" draggable="false" alt="White isometric map of the United States, with Alaska and Hawaii insets">
        <div class="artwork-markers" aria-label="Interview locations by state"></div>
      </div></div>
      <div class="artwork-footer"><div class="artwork-legend"><span><i class="legend-filmed"></i>Filmed</span><span><i class="legend-planned"></i>Planned</span><span>Pins represent states</span></div>
        <button type="button" class="artwork-reset">View all states</button></div>
      <p class="artwork-status" role="status" aria-live="polite"></p>`;
    container.after(this.stage);
    this.image = this.stage.querySelector('.artwork-image');
    this.image.src = this.images.overview;
    this.markers = this.stage.querySelector('.artwork-markers');
    this.chooser = this.stage.querySelector('select');
    this.status = this.stage.querySelector('.artwork-status');
    this.chooser.addEventListener('change', () => this.chooser.value ? this.selectState(this.chooser.value) : this.deselect());
    this.stage.querySelector('.artwork-reset').addEventListener('click', () => {
      this.setRegionFilter('ALL');
      this.deselect();
    });
    this.image.addEventListener('error', () => {
      this.status.textContent = 'The illustration could not load. Choose 3D View to continue.';
    });
    Object.values(this.images).forEach(src => { const image = new Image(); image.src = src; });
    this.setMode('artwork');
  }

  loadStatesData(data) {
    this.data = data;
    this.states = data.states;
    this.populateChooser();
    this.renderMarkers();
  }

  populateChooser() {
    this.chooser.replaceChildren(new Option(this.region === 'ALL' ? 'All states' : this.region + ' states', ''));
    this.states.filter(state => this.region === 'ALL' || state.region === this.region)
      .forEach(state => this.chooser.add(new Option(state.name, state.code)));
    this.chooser.value = this.selectedState || '';
  }

  updateFilmedStates(records) {
    this.filmedStates = records;
    // Planned-only states must not acquire a "filmed" marker in the 3D view.
    this.completedStates = new Map([...records].filter(([, info]) => info.count > 0));
    this.engine?.updateFilmedStates(this.completedStates);
    this.renderMarkers();
  }

  renderMarkers() {
    if (!this.states) return;
    this.markers.replaceChildren();
    for (const state of this.states) {
      if (this.region !== 'ALL' && state.region !== this.region) continue;
      const info = this.filmedStates.get(state.code);
      const selected = this.selectedState === state.code;
      if (!selected && (!info || !this.options.showAllPins)) continue;
      const point = this.anchors[state.code];
      if (!point) continue;
      const completed = info?.count || 0;
      const planned = info?.interviews.filter(item => item.status === 'planned').length || 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'artwork-pin' + (selected ? ' is-selected' : '') + (completed ? ' is-filmed' : ' is-planned');
      if (selected && this.images[state.code]) button.classList.add('has-painted-label');
      button.style.left = (point[0] / 1254 * 100) + '%';
      button.style.top = (point[1] / 1254 * 100) + '%';
      button.setAttribute('aria-label', `${state.name}: ${completed} filmed, ${planned} planned`);
      button.setAttribute('aria-pressed', String(selected));
      button.title = `${state.name} · ${completed} filmed · ${planned} planned`;
      const label = document.createElement('span');
      label.className = 'artwork-pin-label';
      label.textContent = selected && !this.images[state.code] ? state.name : state.code;
      if (completed || planned) {
        const count = document.createElement('b');
        count.textContent = String(completed || planned);
        label.append(count);
      }
      button.append(label);
      button.addEventListener('click', () => this.selectState(state.code));
      this.markers.append(button);
    }
  }

  acceptSelection(state) {
    this.selectedState = state?.code || null;
    if (state && this.region !== 'ALL' && state.region !== this.region) {
      this.region = 'ALL';
      this.populateChooser();
      this.updateRegionButtons();
    }
    this.chooser.value = this.selectedState || '';
    this.image.src = this.images[this.selectedState] || this.images.overview;
    this.image.alt = state ? `Isometric US map — ${state.name} selected` : 'Isometric US map with Alaska and Hawaii insets';
    document.body.classList.toggle('map-has-selection', Boolean(state));
    this.renderMarkers();
    this.options.onSelectState?.(state);
  }

  selectState(code, animateCamera = false) {
    const state = this.states?.find(item => item.code === code);
    if (!state) return;
    if (this.mode === '3d') this.engine.selectState(code, animateCamera);
    else this.acceptSelection(state);
  }

  deselect() {
    if (this.mode === '3d') this.engine.deselect();
    else this.acceptSelection(null);
  }

  setMode(mode) {
    this.mode = mode;
    document.body.classList.toggle('map-artwork', mode === 'artwork');
    this.stage.hidden = mode !== 'artwork';
    // Visibility keeps the WebGL viewport dimensions stable while resizing.
    this.container.style.visibility = mode === 'artwork' ? 'hidden' : 'visible';
    this.container.style.pointerEvents = mode === 'artwork' ? 'none' : 'auto';
    const hint = document.querySelector('.bottom-hints span');
    hint.textContent = mode === 'artwork' ? 'Select a pin, search, or choose a state' : 'Click state to inspect interviews / Drag to orbit / Scroll to zoom';
    document.getElementById('hover-tooltip').style.display = 'none';
    document.querySelectorAll('[data-preset]').forEach(button => {
      const active = button.dataset.preset === (mode === 'artwork' ? 'artwork' : 'isometric');
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (this.engine) this.engine.controls.enabled = mode === '3d';
  }

  setCameraPreset(preset) {
    if (preset === 'artwork') { this.setMode('artwork'); return; }
    this.setMode('3d');
    try {
      if (!this.engine) {
        this.engine = new IsometricMap3D(this.container, {
          ...this.options,
          onSelectState: state => this.acceptSelection(state)
        });
        this.engine.loadStatesData(this.data);
        this.engine.updateFilmedStates(this.completedStates || new Map());
      }
      if (this.selectedState) this.engine.selectState(this.selectedState, false);
      else this.engine.deselect();
      this.engine.setCameraPreset(preset);
      document.querySelectorAll('[data-preset]').forEach(button => {
        button.classList.toggle('active', button.dataset.preset === preset);
        button.setAttribute('aria-pressed', String(button.dataset.preset === preset));
      });
    } catch (error) {
      console.error('3D view unavailable:', error);
      this.setMode('artwork');
      this.status.textContent = '3D view is unavailable on this device. You can continue with the illustrated map.';
    }
  }

  setShowAllPins(show) {
    this.options.showAllPins = show;
    this.engine?.setShowAllPins(show);
    this.renderMarkers();
  }

  setTheme(theme) {
    this.options.theme = theme;
    this.engine?.setTheme(theme);
  }

  setElevationHeight(height) {
    this.options.elevationHeight = height;
    this.engine?.setElevationHeight(height);
  }

  updateRegionButtons() {
    document.querySelectorAll('[data-region]').forEach(button => {
      button.classList.toggle('active', button.dataset.region === this.region);
      button.setAttribute('aria-pressed', String(button.dataset.region === this.region));
    });
  }

  setRegionFilter(region) {
    this.region = region;
    if (this.selectedState && region !== 'ALL' && this.states.find(state => state.code === this.selectedState)?.region !== region) this.deselect();
    this.populateChooser();
    this.renderMarkers();
    this.updateRegionButtons();
    if (this.mode === '3d') {
      if (region === 'ALL') this.engine.setCameraPreset('isometric');
      else {
        const state = this.states.find(state => state.region === region);
        if (state) this.selectState(state.code, true);
      }
    }
  }

  async exportPNG(options) {
    if (this.mode === '3d') { this.engine.exportPNG(options); return; }
    // The supplied illustration includes its background; transparent export is
    // offered only for the geometry-based 3D view.
    try {
      await this.image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = this.image.naturalWidth;
      canvas.height = this.image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(this.image, 0, 0);
      const scale = canvas.width / 1254;
      context.scale(scale, scale);
      for (const button of this.markers.children) {
        if (button.classList.contains('has-painted-label')) continue;
        const x = parseFloat(button.style.left) * 1254 / 100;
        const y = parseFloat(button.style.top) * 1254 / 100;
        const label = button.textContent;
        context.font = '600 17px sans-serif';
        const width = context.measureText(label).width + 24;
        context.fillStyle = button.classList.contains('is-filmed') ? '#087c80' : '#8b5b19';
        context.fillRect(x - 1, y - 40, 2, 40);
        context.fillRect(x - width / 2, y - 66, width, 30);
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.fillText(label, x, y - 44);
      }
      const link = document.createElement('a');
      link.download = `AiO-USA-${this.selectedState || 'overview'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      this.status.textContent = 'The image is not ready to export. Please try again.';
    }
  }
}
window.ProductionMapView = ProductionMapView;
