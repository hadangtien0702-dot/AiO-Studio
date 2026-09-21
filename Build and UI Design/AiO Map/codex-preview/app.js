/**
 * AiO Isometric USA Map - Application Controller
 * Client Interview & Production Journey Management
 * Strictly NO emojis. Pure inline SVGs.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('viewport-3d');
  const tooltip = document.getElementById('hover-tooltip');

  // Initialize Interview Manager
  const interviewManager = new InterviewManager();
  window.interviewManager = interviewManager;

  // DOM Elements - Search
  const searchInput = document.getElementById('state-search');
  const searchDropdown = document.getElementById('search-dropdown');
  const searchClearBtn = document.getElementById('search-clear');

  // DOM Elements - State Card
  const stateCard = document.getElementById('state-info-panel');
  const cardBadge = document.getElementById('card-fips-badge');
  const cardName = document.getElementById('card-state-name');
  const cardSub = document.getElementById('card-state-sub');
  const cardCapital = document.getElementById('card-capital');
  const cardRegion = document.getElementById('card-region');
  const cardCloseBtn = document.getElementById('card-close');
  const stateInterviewsCount = document.getElementById('state-interviews-count');
  const stateInterviewsList = document.getElementById('state-interviews-list');
  const btnAddInState = document.getElementById('btn-add-in-state');

  // DOM Elements - Topbar Stats & Controls
  const topFilmedCount = document.getElementById('top-filmed-count');
  const topStatesCount = document.getElementById('top-states-count');
  const btnTopAddInterview = document.getElementById('btn-top-add-interview');
  const btnDrawerToggle = document.getElementById('btn-drawer-toggle');
  const btnToggleAllPins = document.getElementById('btn-toggle-all-pins');

  // DOM Elements - Camera Presets & Theme
  const presetBtns = document.querySelectorAll('[data-preset]');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeSunIcon = document.getElementById('icon-theme-sun');
  const themeMoonIcon = document.getElementById('icon-theme-moon');

  // DOM Elements - Export
  const exportBtn = document.getElementById('export-btn');
  const exportDropdown = document.getElementById('export-dropdown');
  const exportPngBtn = document.getElementById('export-png');
  const exportTransBtn = document.getElementById('export-transparent');
  const exportDataJsonBtn = document.getElementById('export-data-json');

  // DOM Elements - Drawer
  const drawer = document.getElementById('all-interviews-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerSearchInput = document.getElementById('drawer-search-input');
  const drawerFilterPills = document.querySelectorAll('.drawer-filter-pill');
  const drawerList = document.getElementById('drawer-interviews-list');
  const drawerCountAll = document.getElementById('drawer-count-all');
  const drawerCountCompleted = document.getElementById('drawer-count-completed');
  const drawerCountPlanned = document.getElementById('drawer-count-planned');

  // DOM Elements - Modal Form
  const modal = document.getElementById('modal-interview');
  const modalTitle = document.getElementById('modal-title');
  const modalCloseBtn = document.getElementById('modal-btn-close');
  const modalCancelBtn = document.getElementById('modal-btn-cancel');
  const form = document.getElementById('form-interview');
  const formId = document.getElementById('form-interview-id');
  const formState = document.getElementById('form-state');
  const formClient = document.getElementById('form-client-name');
  const formRole = document.getElementById('form-role');
  const formCompany = document.getElementById('form-company');
  const formCity = document.getElementById('form-city');
  const formDate = document.getElementById('form-date');
  const formStatus = document.getElementById('form-status');
  const formVideoLink = document.getElementById('form-video-link');
  const formNotes = document.getElementById('form-notes');
  const statusToggleBtns = document.querySelectorAll('.status-toggle-btn');

  // DOM Elements - Elevation & Regions
  const elevationSlider = document.getElementById('elevation-slider');
  const elevationVal = document.getElementById('elevation-val');
  const regionPills = document.querySelectorAll('.region-pill');

  let currentTheme = 'clay';
  let statesList = [];
  let map3d = null;
  let drawerFilter = 'all';

  // 1. Initialize 3D Map
  try {
    console.log('[AiO Map] Initializing IsometricMap3D...');
    map3d = new ProductionMapView(container, {
      scale: 0.54,
      baseDepth: 8,
      elevationHeight: 14,
      highlightColor: '#00b4b6',
      clayColor: '#eff2f5',
      theme: currentTheme,
      showAllPins: true,
      onSelectState: (state) => {
        if (state) {
          showStateCard(state);
        } else {
          hideStateCard();
        }
      },
      onHoverState: (state, filmedInfo) => {
        if (state) {
          const count = filmedInfo ? filmedInfo.count : 0;
          const countText = count > 0 ? ` [${count} Filmed]` : '';
          tooltip.textContent = `${state.name} (${state.code})${countText}`;
          tooltip.style.display = 'block';
        } else {
          tooltip.style.display = 'none';
        }
      }
    });
    console.log('[AiO Map] IsometricMap3D initialized successfully.');
  } catch (err) {
    console.error('[AiO Map] Failed to init IsometricMap3D:', err);
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'IsometricMap3D.init', msg: err.message, stack: err.stack })
    }).catch(function(){});
  }

  // Tooltip tracking
  window.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = `${e.clientX}px`;
      tooltip.style.top = `${e.clientY}px`;
    }
  });

  // 2. Load States Data
  try {
    if (window.US_STATES_DATA) {
      console.log('[AiO Map] Loading states from window.US_STATES_DATA...');
      statesList = window.US_STATES_DATA.states;
      map3d.loadStatesData(window.US_STATES_DATA);
      populateStateSelect();
      syncInterviewsToMap();
      console.log('[AiO Map] States and interviews loaded successfully.');
    } else {
      console.log('[AiO Map] window.US_STATES_DATA missing, fetching data/us-states.json...');
      fetch('data/us-states.json')
        .then(res => res.json())
        .then(data => {
          statesList = data.states;
          map3d.loadStatesData(data);
          populateStateSelect();
          syncInterviewsToMap();
          console.log('[AiO Map] States fetched and loaded successfully.');
        })
        .catch(err => {
          console.error('[AiO Map] Failed to load data/us-states.json:', err);
          fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'fetch.states', msg: err.message, stack: err.stack })
          }).catch(function(){});
        });
    }
  } catch (err) {
    console.error('[AiO Map] Error during data load:', err);
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'loadStatesData', msg: err.message, stack: err.stack })
    }).catch(function(){});
  }

  function populateStateSelect() {
    formState.innerHTML = '';
    statesList.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.code;
      opt.textContent = `${s.name} (${s.code})`;
      formState.appendChild(opt);
    });
  }

  // 3. Synchronize Interviews with 3D Map & UI
  function syncInterviewsToMap() {
    const all = interviewManager.getAll();
    const stats = interviewManager.getStats();

    // Update topbar badges
    topFilmedCount.textContent = stats.completed;
    topStatesCount.textContent = new Set(all.filter(item => item.status === 'completed').map(item => item.stateCode)).size;

    // Calculate map by state
    const filmedMap = new Map();
    all.forEach(item => {
      if (!filmedMap.has(item.stateCode)) {
        filmedMap.set(item.stateCode, {
          count: 0,
          latestClient: '',
          interviews: []
        });
      }
      const data = filmedMap.get(item.stateCode);
      if (item.status === 'completed') data.count++;
      if (!data.latestClient) data.latestClient = item.clientName;
      data.interviews.push(item);
    });

    map3d.updateFilmedStates(filmedMap);

    // If a state is selected, refresh its interviews card
    if (map3d.selectedState) {
      const stateObj = statesList.find(s => s.code === map3d.selectedState);
      if (stateObj) renderStateInterviews(stateObj);
    }

    // Refresh Drawer list
    renderDrawerList();
  }

  // 4. Render State Card & Interviews List
  function showStateCard(state) {
    cardBadge.textContent = state.code;
    cardName.textContent = state.name;
    cardSub.textContent = `FIPS: ${state.fips}`;
    cardCapital.textContent = state.capital;
    cardRegion.textContent = state.region || 'United States';

    renderStateInterviews(state);
    stateCard.classList.add('visible');

    searchInput.value = state.name;
    searchClearBtn.style.display = 'block';
  }

  function hideStateCard() {
    stateCard.classList.remove('visible');
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
  }

  function renderStateInterviews(state) {
    const list = interviewManager.getByState(state.code);
    stateInterviewsCount.textContent = list.length;
    stateInterviewsList.innerHTML = '';

    if (list.length === 0) {
      stateInterviewsList.innerHTML = `
        <div class="interviews-empty">
          <svg class="ic dim" style="width:24px;height:24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span class="empty-text">No client interviews logged in ${state.name} yet.</span>
          <button id="empty-add-btn" class="btn-add-here" style="font-size:12px;margin-top:4px;">
            <span>+ Add First Interview</span>
          </button>
        </div>
      `;
      const emptyAdd = document.getElementById('empty-add-btn');
      if (emptyAdd) emptyAdd.addEventListener('click', () => openAddModal(state.code));
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'interview-card-item';
      const roleCompany = [item.role, item.company].filter(Boolean).join(' @ ');
      const statusClass = item.status === 'completed' ? 'completed' : 'planned';
      const statusLabel = item.status === 'completed' ? 'Filmed' : 'Planned';

      card.innerHTML = `
        <div class="item-top-row">
          <span class="item-client-name">${item.clientName}</span>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        ${roleCompany ? `<div class="item-role-company">${roleCompany}</div>` : ''}
        <div class="item-meta-row">
          <div class="item-location">
            <svg class="ic ic-sm dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${item.city || state.name} | ${item.date || 'No date'}</span>
          </div>
          <div class="item-actions-row">
            <button class="btn-item-action edit" data-id="${item.id}" title="Edit interview">
              <svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-item-action delete" data-id="${item.id}" title="Delete interview">
              <svg class="ic ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        ${item.videoLink ? `
          <div style="font-size:10px;font-weight:700;color:var(--acc);margin-top:2px;">
            Seq: ${item.videoLink}
          </div>
        ` : ''}
        ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
      `;

      // Event listeners for Edit & Delete
      const editBtn = card.querySelector('.btn-item-action.edit');
      const deleteBtn = card.querySelector('.btn-item-action.delete');

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(item);
      });

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Remove interview with "${item.clientName}"?`)) {
          interviewManager.delete(item.id);
          syncInterviewsToMap();
        }
      });

      stateInterviewsList.appendChild(card);
    });
  }

  if (cardCloseBtn) cardCloseBtn.addEventListener('click', () => map3d.deselect());
  if (btnAddInState) {
    btnAddInState.addEventListener('click', () => {
      openAddModal(map3d.selectedState);
    });
  }

  // 5. Modal Form Logic (Add / Edit)
  function openAddModal(defaultStateCode = '') {
    modalTitle.textContent = 'Add Client Interview';
    formId.value = '';
    formState.value = defaultStateCode || (statesList[0] ? statesList[0].code : 'CA');
    formClient.value = '';
    formRole.value = '';
    formCompany.value = '';
    const defState = statesList.find(s => s.code === formState.value);
    formCity.value = defState ? defState.capital : '';
    formDate.value = new Date().toISOString().split('T')[0];
    setStatusToggle('completed');
    formVideoLink.value = '';
    formNotes.value = '';

    modal.classList.add('active');
    setTimeout(() => formClient.focus(), 100);
  }

  function openEditModal(item) {
    modalTitle.textContent = 'Edit Client Interview';
    formId.value = item.id;
    formState.value = item.stateCode;
    formClient.value = item.clientName;
    formRole.value = item.role || '';
    formCompany.value = item.company || '';
    formCity.value = item.city || '';
    formDate.value = item.date || '';
    setStatusToggle(item.status || 'completed');
    formVideoLink.value = item.videoLink || '';
    formNotes.value = item.notes || '';

    modal.classList.add('active');
    setTimeout(() => formClient.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  function setStatusToggle(status) {
    formStatus.value = status;
    statusToggleBtns.forEach(btn => {
      const s = btn.getAttribute('data-status');
      if (s === status) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  statusToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setStatusToggle(btn.getAttribute('data-status'));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      stateCode: formState.value,
      clientName: formClient.value.trim(),
      role: formRole.value.trim(),
      company: formCompany.value.trim(),
      city: formCity.value.trim(),
      date: formDate.value,
      status: formStatus.value,
      videoLink: formVideoLink.value.trim(),
      notes: formNotes.value.trim()
    };

    if (formId.value) {
      interviewManager.update(formId.value, data);
    } else {
      interviewManager.add(data);
    }

    closeModal();
    syncInterviewsToMap();

    // Select the state on the 3D map so editor sees it immediately
    map3d.selectState(data.stateCode, true);
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (btnTopAddInterview) {
    btnTopAddInterview.addEventListener('click', () => {
      openAddModal(map3d.selectedState);
    });
  }

  // 6. All Interviews Drawer
  function renderDrawerList() {
    const all = interviewManager.getAll();
    const stats = interviewManager.getStats();

    drawerCountAll.textContent = stats.total;
    drawerCountCompleted.textContent = stats.completed;
    drawerCountPlanned.textContent = stats.planned;

    const query = (drawerSearchInput.value || '').trim().toLowerCase();

    const filtered = all.filter(item => {
      if (drawerFilter !== 'all' && item.status !== drawerFilter) return false;
      if (!query) return true;
      const stateObj = statesList.find(s => s.code === item.stateCode);
      const stateName = stateObj ? stateObj.name.toLowerCase() : '';
      return item.clientName.toLowerCase().includes(query) ||
             item.city.toLowerCase().includes(query) ||
             (item.company || '').toLowerCase().includes(query) ||
             stateName.includes(query) ||
             item.stateCode.toLowerCase().includes(query);
    });

    drawerList.innerHTML = '';

    if (filtered.length === 0) {
      drawerList.innerHTML = `
        <div class="interviews-empty">
          <span class="empty-text">No interviews match your filter.</span>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const stateObj = statesList.find(s => s.code === item.stateCode);
      const stateTitle = stateObj ? stateObj.name : item.stateCode;
      const card = document.createElement('div');
      card.className = 'drawer-item-card';
      const statusLabel = item.status === 'completed' ? 'Filmed' : 'Planned';
      const statusClass = item.status === 'completed' ? 'completed' : 'planned';

      card.innerHTML = `
        <div class="item-top-row">
          <span class="item-client-name">${item.clientName}</span>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="item-role-company">${[item.role, item.company].filter(Boolean).join(' @ ')}</div>
        <div class="item-meta-row">
          <span>${stateTitle} (${item.city || stateTitle})</span>
          <span>${item.date || ''}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        map3d.selectState(item.stateCode, true);
        drawer.classList.remove('visible');
        btnDrawerToggle.classList.remove('active');
      });

      drawerList.appendChild(card);
    });
  }

  if (btnDrawerToggle) {
    btnDrawerToggle.addEventListener('click', () => {
      const isVisible = drawer.classList.contains('visible');
      if (isVisible) {
        drawer.classList.remove('visible');
        btnDrawerToggle.classList.remove('active');
      } else {
        drawer.classList.add('visible');
        btnDrawerToggle.classList.add('active');
        renderDrawerList();
      }
    });
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      drawer.classList.remove('visible');
      btnDrawerToggle.classList.remove('active');
    });
  }

  drawerSearchInput.addEventListener('input', () => renderDrawerList());

  drawerFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      drawerFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      drawerFilter = pill.getAttribute('data-filter');
      renderDrawerList();
    });
  });

  // 7. Toggle All Pins
  if (btnToggleAllPins) {
    btnToggleAllPins.addEventListener('click', () => {
      const nextState = !map3d.options.showAllPins;
      map3d.setShowAllPins(nextState);
      if (nextState) {
        btnToggleAllPins.classList.add('active');
      } else {
        btnToggleAllPins.classList.remove('active');
      }
    });
  }

  // 8. Search Autocomplete (States & Clients)
  function renderSearchResults(query = '') {
    const q = query.trim().toLowerCase();
    searchDropdown.innerHTML = '';

    if (!q) {
      searchDropdown.style.display = 'none';
      return;
    }

    // Match states
    const matchedStates = statesList.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.capital.toLowerCase().includes(q)
    );

    // Match clients
    const allInterviews = interviewManager.getAll();
    const matchedClients = allInterviews.filter(i =>
      i.clientName.toLowerCase().includes(q) || (i.company || '').toLowerCase().includes(q) || i.city.toLowerCase().includes(q)
    );

    if (matchedStates.length === 0 && matchedClients.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'search-item';
      emptyDiv.style.cursor = 'default';
      emptyDiv.style.color = 'var(--t3)';
      emptyDiv.textContent = 'No matching state or client';
      searchDropdown.appendChild(emptyDiv);
      searchDropdown.style.display = 'block';
      return;
    }

    // Render client matches first
    matchedClients.slice(0, 4).forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `
        <span>Client: <strong>${item.clientName}</strong> <span style="color:var(--t3);font-size:11px">(${item.city}, ${item.stateCode})</span></span>
        <span class="search-item-code">${item.stateCode}</span>
      `;
      div.addEventListener('click', () => {
        map3d.selectState(item.stateCode, true);
        searchDropdown.style.display = 'none';
      });
      searchDropdown.appendChild(div);
    });

    // Render state matches
    matchedStates.slice(0, 5).forEach(s => {
      const filmedInfo = interviewManager.getByState(s.code);
      const filmedCount = filmedInfo.filter(item => item.status === 'completed').length;
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `
        <span>${s.name} <span style="color:var(--t3);font-size:11px">(${filmedCount > 0 ? filmedCount + ' filmed' : s.capital})</span></span>
        <span class="search-item-code">${s.code}</span>
      `;
      div.addEventListener('click', () => {
        map3d.selectState(s.code, true);
        searchDropdown.style.display = 'none';
      });
      searchDropdown.appendChild(div);
    });

    searchDropdown.style.display = 'block';
  }

  searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
    searchClearBtn.style.display = e.target.value ? 'block' : 'none';
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) renderSearchResults(searchInput.value);
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchDropdown.style.display = 'none';
    map3d.deselect();
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.style.display = 'none';
    }
    if (!exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
      exportDropdown.style.display = 'none';
    }
  });

  // 9. Camera Presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');
      map3d.setCameraPreset(preset);
    });
  });

  // 10. Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    if (currentTheme === 'clay') {
      currentTheme = 'console';
      document.body.classList.add('theme-console');
      themeSunIcon.style.display = 'none';
      themeMoonIcon.style.display = 'block';
    } else {
      currentTheme = 'clay';
      document.body.classList.remove('theme-console');
      themeSunIcon.style.display = 'block';
      themeMoonIcon.style.display = 'none';
    }
    map3d.setTheme(currentTheme);
  });

  // 11. Export Menu
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdown.style.display = exportDropdown.style.display === 'block' ? 'none' : 'block';
  });

  exportPngBtn.addEventListener('click', () => {
    exportDropdown.style.display = 'none';
    map3d.exportPNG({ transparent: false, multiplier: 2 });
  });

  exportTransBtn.addEventListener('click', () => {
    exportDropdown.style.display = 'none';
    map3d.exportPNG({ transparent: true, multiplier: 2 });
  });

  exportDataJsonBtn.addEventListener('click', () => {
    exportDropdown.style.display = 'none';
    interviewManager.exportJSON();
  });

  // 12. Elevation Slider
  elevationSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    elevationVal.textContent = `${val}px`;
    map3d.setElevationHeight(val);
  });

  // 13. Region Filters
  regionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      regionPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const reg = pill.getAttribute('data-region');

      map3d.setRegionFilter(reg);
    });
  });

  // Default focus on California as showcase with filmed interviews
  setTimeout(() => {
    if (statesList.length > 0 && !map3d.selectedState) {
      map3d.selectState('CA', false);
    }
  }, 400);
});
