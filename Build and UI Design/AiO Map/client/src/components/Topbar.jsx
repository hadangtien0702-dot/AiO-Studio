/**
 * AiO Studio — Topbar Component
 * 44px Studio Console Standard (MASTER.md / tokens.css)
 * Strictly NO emojis. Pure inline SVGs.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BrandLogo,
  SearchIcon,
  CloseIcon,
  IsoIcon,
  OrbitIcon,
  TopViewIcon,
  ResetIcon,
  PinIcon,
  ListIcon,
  PlusIcon,
  SunIcon,
  MoonIcon
} from './icons/SvgIcons';

export default function Topbar({
  overviewStats,
  statesList,
  interviews,
  viewPreset,
  onSetPreset,
  onResetView,
  showPins,
  onTogglePins,
  onOpenDrawer,
  onOpenAddModal,
  theme,
  onToggleTheme,
  onSelectState
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input');
        input?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();

    const matchedStates = statesList
      .filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q)
      .slice(0, 5);

    const matchedClients = interviews
      .filter(i => i.client_name.toLowerCase().includes(q) || (i.city && i.city.toLowerCase().includes(q)))
      .slice(0, 4);

    return { matchedStates, matchedClients };
  }, [searchTerm, statesList, interviews]);

  return (
    <header className="topbar">
      {/* Left: Brand & Live Production Coverage */}
      <div className="topbar-left">
        <div className="app-brand" title="AiO Studio — US Client Map">
          <div className="brand-icon-box">
            <BrandLogo />
          </div>
          <div className="brand-text-col">
            <span className="brand-title">AiO Studio</span>
            <span className="brand-subtitle">US Client Map</span>
          </div>
        </div>

        <div className="stats-coverage-pill" title="Live Video Production Coverage">
          <div className="stats-dot-live" />
          <div>
            <span className="stats-val">{overviewStats?.filmed_shoots ?? 0}</span> Filmed
          </div>
          <div className="stats-divider" />
          <div>
            <span className="stats-val">{overviewStats?.covered_states ?? 0}</span> States
          </div>
        </div>
      </div>

      {/* Center: Search & Fixed 2.5D Angles */}
      <div className="topbar-center">
        <div className="search-wrapper" ref={searchRef}>
          <div className="search-input-box">
            <SearchIcon />
            <input
              type="text"
              className="search-input"
              placeholder="Search state or client... (Ctrl+K)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              spellCheck="false"
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchOpen(false);
                }}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          {isSearchOpen && (searchResults.matchedStates?.length > 0 || searchResults.matchedClients?.length > 0) && (
            <div className="search-dropdown">
              {searchResults.matchedClients.map(client => (
                <div
                  key={client.id}
                  className="search-item"
                  onClick={() => {
                    onSelectState(client.state_code);
                    setIsSearchOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span>
                    Client: <strong>{client.client_name}</strong>{' '}
                    <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>
                      ({client.city}, {client.state_code})
                    </span>
                  </span>
                  <span className="search-item-code">{client.state_code}</span>
                </div>
              ))}

              {searchResults.matchedStates.map(state => (
                <div
                  key={state.code}
                  className="search-item"
                  onClick={() => {
                    onSelectState(state.code);
                    setIsSearchOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span>
                    {state.name}{' '}
                    <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>
                      ({state.capital})
                    </span>
                  </span>
                  <div>
                    {state.filmed_count > 0 && (
                      <span className="search-item-filmed">{state.filmed_count} Filmed</span>
                    )}
                    <span className="search-item-code">{state.code}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Segmented Group */}
        <div className="seg-view-group">
          <button
            className={`seg-btn ${viewPreset === 'isometric' ? 'active' : ''}`}
            onClick={() => onSetPreset('isometric')}
            title="Fixed 2.5D Isometric Cut (Goc nghieng co dinh)"
          >
            <IsoIcon />
            <span>2.5D Iso</span>
          </button>
          <button
            className={`seg-btn ${viewPreset === 'free3d' ? 'active' : ''}`}
            onClick={() => onSetPreset('free3d')}
            title="Free 3D Orbit (Xoay 3D tu do)"
          >
            <OrbitIcon />
            <span>3D Orbit</span>
          </button>
          <button
            className={`seg-btn ${viewPreset === 'topdown' ? 'active' : ''}`}
            onClick={() => onSetPreset('topdown')}
            title="Top-Down 2D View"
          >
            <TopViewIcon />
            <span>Top 2D</span>
          </button>
          <button
            className="seg-btn"
            onClick={onResetView}
            title="Reset View Angle"
          >
            <ResetIcon />
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="topbar-right">
        <button
          className={`btn-clean ${showPins ? 'active' : ''}`}
          onClick={onTogglePins}
          title="Toggle 3D Pins on Filmed States"
        >
          <PinIcon />
          <span>Pins</span>
        </button>

        <button
          className="btn-clean"
          onClick={onOpenDrawer}
          title="Open Full Client Interview Log"
        >
          <ListIcon />
          <span>Interviews</span>
        </button>

        <button
          className="btn-primary-add"
          onClick={onOpenAddModal}
          title="Record New Client Interview Shoot"
        >
          <PlusIcon />
          <span>+ Add Shoot</span>
        </button>

        <button
          className="btn-icon-sq"
          onClick={onToggleTheme}
          title="Toggle Clay Studio Light / Studio Dark Console"
        >
          {theme === 'clay' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
