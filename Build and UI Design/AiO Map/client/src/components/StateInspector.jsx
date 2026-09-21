/**
 * AiO Studio — StateInspector Component
 * Right-side drawer displaying active state shoots & client cards
 * Strictly NO emojis. Pure inline SVGs.
 */

import React from 'react';
import { CloseIcon, PlusIcon, EditIcon, TrashIcon, VideoCameraIcon } from './icons/SvgIcons';

export default function StateInspector({
  stateDetail,
  onClose,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteShoot
}) {
  if (!stateDetail) return null;

  const shoots = stateDetail.shoots || [];

  return (
    <aside className="state-inspector-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="state-badge-circle">{stateDetail.code}</div>
          <div>
            <h2 className="state-name-h2">{stateDetail.name}</h2>
            <span className="state-meta-sub">
              {stateDetail.capital ? `Capital: ${stateDetail.capital}` : 'United States'}
              {stateDetail.region ? ` · ${stateDetail.region}` : ''}
            </span>
          </div>
        </div>
        <button className="btn-close-panel" onClick={onClose} aria-label="Close Inspector">
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      <div className="panel-body">
        <div className="section-label">
          <span>Client Shoots ({shoots.length})</span>
          <button
            className="btn-clean"
            style={{ height: '22px', padding: '0 8px', fontSize: '11px' }}
            onClick={() => onOpenAddModal(stateDetail.code)}
          >
            <PlusIcon className="ic ic-sm" />
            <span>Add Shoot</span>
          </button>
        </div>

        {shoots.length === 0 ? (
          <div className="empty-state-box">
            <VideoCameraIcon className="ic ic-lg empty-icon" />
            <div className="empty-title">No client shoots in {stateDetail.name}</div>
            <div className="empty-desc">Record an interview to track on-location video production in this state.</div>
            <button
              className="btn-primary-add"
              style={{ marginTop: '8px' }}
              onClick={() => onOpenAddModal(stateDetail.code)}
            >
              <PlusIcon className="ic ic-sm" />
              <span>+ Record First Shoot</span>
            </button>
          </div>
        ) : (
          <div className="shoots-list">
            {shoots.map(item => (
              <div key={item.id} className="shoot-item-card">
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
                  <span>{item.city || stateDetail.name}{item.date ? ` · ${item.date}` : ''}</span>
                  <div className="shoot-actions-group">
                    <button
                      className="btn-action-icon"
                      onClick={() => onOpenEditModal(item)}
                      title="Edit interview"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="btn-action-icon danger"
                      onClick={() => onDeleteShoot(item)}
                      title="Delete interview"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                {item.video_link && (
                  <div>
                    <span className="sequence-badge">{item.video_link}</span>
                  </div>
                )}

                {item.notes && (
                  <div className="shoot-notes">{item.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
