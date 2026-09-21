/**
 * AiO Studio — InterviewModal Component
 * Add / Edit client shoot dialog
 * Strictly NO emojis. Pure inline SVGs.
 */

import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/SvgIcons';

export default function InterviewModal({
  isOpen,
  onClose,
  initialData,
  defaultStateCode,
  statesList,
  onSave
}) {
  const [formData, setFormData] = useState({
    state_code: 'CA',
    client_name: '',
    role: '',
    company: '',
    city: '',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    video_link: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        state_code: initialData.state_code || 'CA',
        client_name: initialData.client_name || '',
        role: initialData.role || '',
        company: initialData.company || '',
        city: initialData.city || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        status: initialData.status || 'completed',
        video_link: initialData.video_link || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        state_code: defaultStateCode || 'CA',
        client_name: '',
        role: '',
        company: '',
        city: '',
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        video_link: '',
        notes: ''
      });
    }
  }, [initialData, defaultStateCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.client_name.trim()) {
      alert('Please enter a client name.');
      return;
    }
    onSave(formData, initialData?.id);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">
            {initialData ? 'Edit Client Shoot' : 'Record Client Interview'}
          </span>
          <button className="btn-close-panel" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State</label>
                <select
                  className="form-select"
                  value={formData.state_code}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                >
                  {statesList.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="completed">Filmed</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Client Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. David Miller"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role / Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. VP of Production"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Studio / Company</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Silicon Media Labs"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Los Angeles"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Shoot Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Premiere Sequence ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. PR-SEQ-LA01"
                value={formData.video_link}
                onChange={(e) => setFormData({ ...formData, video_link: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Production Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Key interview takeaways, gear used, color finish notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-add">
              {initialData ? 'Save Changes' : 'Record Shoot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
