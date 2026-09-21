/**
 * AiO Studio — RegionPills Component
 * Bottom-centered region filter pills
 * Strictly NO emojis. Pure inline SVGs.
 */

import React from 'react';

const REGIONS = [
  { id: 'all', label: 'All 51 States' },
  { id: 'West', label: 'West' },
  { id: 'Midwest', label: 'Midwest' },
  { id: 'South', label: 'South' },
  { id: 'Northeast', label: 'Northeast' }
];

export default function RegionPills({ activeRegion, onSelectRegion }) {
  return (
    <nav className="bottom-pills-bar" aria-label="Region filters">
      {REGIONS.map(reg => (
        <button
          key={reg.id}
          className={`region-pill ${activeRegion === reg.id ? 'active' : ''}`}
          onClick={() => onSelectRegion(reg.id)}
        >
          {reg.label}
        </button>
      ))}
    </nav>
  );
}
