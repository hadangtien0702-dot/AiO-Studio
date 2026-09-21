/**
 * AiO Studio — 3D Isometric USA Map & Client Interview Tracker
 * Main React Application
 * Strictly NO emojis. Pure inline SVGs.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapViewport from './components/MapViewport';
import StateInspector from './components/StateInspector';
import InterviewDrawer from './components/InterviewDrawer';
import InterviewModal from './components/InterviewModal';
import RegionPills from './components/RegionPills';
import { PlusIcon, ListIcon, ResetIcon, SunIcon, MoonIcon } from './components/icons/SvgIcons';
import * as api from './services/api';

export default function App() {
  const [theme, setTheme] = useState('clay');
  const [viewPreset, setViewPreset] = useState('isometric');
  const [showPins, setShowPins] = useState(true);
  const [activeRegion, setActiveRegion] = useState('all');

  const [statesData, setStatesData] = useState(null);
  const [statesList, setStatesList] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);

  const [selectedStateCode, setSelectedStateCode] = useState('CA');
  const [stateDetail, setStateDetail] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [modalDefaultState, setModalDefaultState] = useState('CA');

  const engineRef = useRef(null);

  // Load initial backend data
  const refreshAllData = useCallback(async () => {
    try {
      const [stats, states, shootList, rawGeo] = await Promise.all([
        api.getOverviewStats(),
        api.getStatesList(),
        api.getInterviews(),
        api.getStatesData()
      ]);
      setOverviewStats(stats);
      setStatesList(states);
      setInterviews(shootList);
      setStatesData(rawGeo);
    } catch (err) {
      console.error('[AiO Map] Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Sync theme with body class
  useEffect(() => {
    if (theme === 'clay') {
      document.body.classList.remove('theme-console');
      document.body.classList.add('theme-clay');
    } else {
      document.body.classList.remove('theme-clay');
      document.body.classList.add('theme-console');
    }
  }, [theme]);

  // Compute filmed states map for 3D engine: code -> { count, latestClient }
  const filmedStatesMap = React.useMemo(() => {
    const map = new Map();
    statesList.forEach(s => {
      if (s.is_filmed) {
        map.set(s.code, {
          count: s.filmed_count,
          latestClient: s.latest_client
        });
      }
    });
    return map;
  }, [statesList]);

  // Select State & Load Detail
  const handleSelectState = async (code) => {
    setSelectedStateCode(code);
    if (code) {
      try {
        const detail = await api.getStateDetail(code);
        setStateDetail(detail);
      } catch (err) {
        console.error('Failed to load state detail:', err);
      }
    } else {
      setStateDetail(null);
    }
  };

  // Hover state tooltip
  const handleHoverState = (state, filmedInfo) => {
    if (state) {
      const count = filmedInfo ? filmedInfo.count : 0;
      const countText = count > 0 ? ` · ${count} Shoots Filmed` : '';
      setTooltip(prev => ({
        ...prev,
        visible: true,
        text: `${state.name} (${state.code})${countText}`
      }));
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  // Mouse move for tooltip tracking
  const handleMouseMove = (e) => {
    if (tooltip.visible) {
      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    }
  };

  // Reset Camera View
  const handleResetView = () => {
    setViewPreset('isometric');
    if (engineRef.current) {
      engineRef.current.resetCamera();
    }
  };

  // Region Pill selection
  const handleSelectRegion = (regId) => {
    setActiveRegion(regId);
    if (regId === 'all') {
      handleSelectState(null);
    } else {
      const firstInRegion = statesList.find(s => s.region === regId);
      if (firstInRegion) {
        handleSelectState(firstInRegion.code);
      }
    }
  };

  // Add / Edit Modal handlers
  const handleOpenAddModal = (stateCode = null) => {
    setModalInitialData(null);
    setModalDefaultState(stateCode || selectedStateCode || 'CA');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shootItem) => {
    setModalInitialData(shootItem);
    setModalDefaultState(shootItem.state_code);
    setIsModalOpen(true);
  };

  const handleSaveShoot = async (formData, shootId) => {
    try {
      if (shootId) {
        await api.updateInterview(shootId, formData);
      } else {
        await api.createInterview(formData);
      }
      setIsModalOpen(false);
      await refreshAllData();
      if (formData.state_code) {
        handleSelectState(formData.state_code);
      }
    } catch (err) {
      alert('Failed to save interview: ' + err.message);
    }
  };

  const handleDeleteShoot = async (shootItem) => {
    if (confirm(`Delete interview with "${shootItem.client_name}"?`)) {
      try {
        await api.deleteInterview(shootItem.id);
        await refreshAllData();
        if (selectedStateCode) {
          handleSelectState(selectedStateCode);
        }
      } catch (err) {
        alert('Failed to delete interview: ' + err.message);
      }
    }
  };

  return (
    <div className="app-layout" onMouseMove={handleMouseMove}>
      {/* 3D WebGL Canvas Layer */}
      <MapViewport
        statesData={statesData}
        filmedStatesMap={filmedStatesMap}
        selectedStateCode={selectedStateCode}
        onSelectState={handleSelectState}
        onHoverState={handleHoverState}
        viewPreset={viewPreset}
        showPins={showPins}
        theme={theme}
        engineRef={engineRef}
      />

      {/* Floating Editorial Header (Matching Reference Photo 1:1) */}
      <div className="journey-header">
        <span className="journey-eyebrow">YOUR PRODUCTION JOURNEY</span>
        <h1 className="journey-title">Across the United States.</h1>
        <p className="journey-subtitle">People met. Stories filmed. Places to go.</p>
      </div>

      {/* State Explorer & Quick Actions (Matching Reference Photo 1:1) */}
      <div className="journey-top-right">
        <div className="state-explorer-card">
          <label className="explorer-label" htmlFor="state-select">Explore a state</label>
          <div className="explorer-select-box">
            <select
              id="state-select"
              className="explorer-select"
              value={selectedStateCode || ''}
              onChange={(e) => handleSelectState(e.target.value)}
            >
              <option value="" disabled>Select a state...</option>
              {statesList.map(s => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="select-chevron">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* Video Production Tools */}
        <div className="journey-quick-actions">
          <button
            className="btn-quick-action btn-accent"
            onClick={() => handleOpenAddModal(selectedStateCode)}
            title="Record new client shoot"
          >
            <PlusIcon className="ic ic-sm" />
            <span>Add Shoot</span>
          </button>
          <button
            className="btn-quick-action"
            onClick={() => setIsDrawerOpen(true)}
            title="View full production log"
          >
            <ListIcon className="ic ic-sm" />
            <span>Shoots ({overviewStats?.total_shoots ?? 0})</span>
          </button>
          <button
            className="btn-quick-action btn-icon-only"
            onClick={handleResetView}
            title="Reset 2.5D Isometric Camera"
          >
            <ResetIcon className="ic ic-sm" />
          </button>
          <button
            className="btn-quick-action btn-icon-only"
            onClick={() => setTheme(theme === 'clay' ? 'console' : 'clay')}
            title="Toggle clay/console theme"
          >
            {theme === 'clay' ? <MoonIcon className="ic ic-sm" /> : <SunIcon className="ic ic-sm" />}
          </button>
        </div>
      </div>

      {/* Right: State Inspector Panel */}
      <StateInspector
        stateDetail={stateDetail}
        onClose={() => setStateDetail(null)}
        onOpenAddModal={handleOpenAddModal}
        onOpenEditModal={handleOpenEditModal}
        onDeleteShoot={handleDeleteShoot}
      />

      {/* Left: Nation-wide Production Log Drawer */}
      <InterviewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        interviews={interviews}
        onSelectState={handleSelectState}
        onOpenAddModal={() => handleOpenAddModal()}
      />

      {/* Bottom Region Pills */}
      <RegionPills
        activeRegion={activeRegion}
        onSelectRegion={handleSelectRegion}
      />

      {/* Add / Edit Shoot Modal Form */}
      <InterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={modalInitialData}
        defaultStateCode={modalDefaultState}
        statesList={statesList}
        onSave={handleSaveShoot}
      />

      {/* Hover Tooltip */}
      {tooltip.visible && (
        <div
          className="hover-tooltip"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
