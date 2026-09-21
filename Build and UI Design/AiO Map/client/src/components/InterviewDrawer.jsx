/**
 * AiO Studio — InterviewDrawer Component
 * Full nation-wide production log drawer
 * Strictly NO emojis. Pure inline SVGs.
 */

import React, { useState } from 'react';
import { CloseIcon, SearchIcon, PlusIcon } from './icons/SvgIcons';

export default function InterviewDrawer({
  isOpen,
  onClose,
  interviews,
  onSelectState,
  onOpenAddModal
}) {
  const [filter, setFilter] = useState('all'); // all | completed | planned
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = interviews.filter(item => {
    if (filter === 'completed' && item.status !== 'completed') return false;
    if (filter === 'planned' && item.status !== 'planned') return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match = (
        item.client_name.toLowerCase().includes(q) ||
        item.state_code.toLowerCase().includes(q) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.company && item.company.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    return true;
  });

  const countAll = interviews.length;
  const countCompleted = interviews.filter(i => i.status === 'completed').length;
  const countPlanned = interviews.filter(i => i.status === 'planned').length;

  return (
    <aside className="interview-drawer-panel">
      {/* Header */}
      <div className="drawer-header">
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-1)' }}>Production Log</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{interviews.length} Client Interviews Tracked</span>
        </div>
        <button className="btn-close-panel" onClick={onClose} aria-label="Close Drawer">
          <CloseIcon />
        </button>
      </div>

      {/* Search in Drawer */}
      <div style={{ padding: '8px 16px', background: 'var(--bg-2)', borderBottom: '1px solid var(--panel-border)' }}>
        <div className="search-input-box">
          <SearchIcon />
          <input
            type="text"
            className="search-input"
            style={{ height: '28px' }}
            placeholder="Filter interviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="drawer-filter-bar">
        <button
          className={`drawer-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({countAll})
        </button>
        <button
          className={`drawer-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Filmed ({countCompleted})
        </button>
        <button
          className={`drawer-filter-btn ${filter === 'planned' ? 'active' : ''}`}
          onClick={() => setFilter('planned')}
        >
          Planned ({countPlanned})
        </button>
      </div>

      {/* Body List */}
      <div className="drawer-list-body">
        {filtered.length === 0 ? (
          <div className="empty-state-box" style={{ marginTop: '20px' }}>
            <div className="empty-title">No matching interviews</div>
            <div className="empty-desc">Try clearing search or record a new client shoot.</div>
            <button
              className="btn-primary-add"
              style={{ marginTop: '8px' }}
              onClick={() => onOpenAddModal()}
            >
              <PlusIcon className="ic ic-sm" />
              <span>+ Add Shoot</span>
            </button>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="shoot-item-card"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onSelectState(item.state_code);
                onClose();
              }}
            >
              <div className="shoot-card-top">
                <span className="client-name-bold">{item.client_name}</span>
                <span className={`status-tag ${item.status === 'completed' ? 'completed' : 'planned'}`}>
                  {item.status === 'completed' ? 'Filmed' : 'Planned'}
                </span>
              </div>

              {(item.role || item.company) && (
                <div className="client-role-company">
                  {[item.role, item.company].filter(Boolean).join(' · ')}
                </div>
              )}

              <div className="shoot-card-bottom">
                <span>{item.state_code} ({item.city || 'On-location'})</span>
                <span>{item.date || ''}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
