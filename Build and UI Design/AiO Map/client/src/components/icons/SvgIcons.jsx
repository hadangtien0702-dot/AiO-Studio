/**
 * AiO Studio — SVG Icon Library
 * Strictly NO emojis. Pure inline SVGs (RULE 01, RULE 02).
 * Standard: viewBox="0 0 24 24", stroke="currentColor", stroke-width="1.9"
 */

import React from 'react';

export const BrandLogo = () => (
  <svg viewBox="0 0 355.74 357.22" style={{ width: 16, height: 16 }}>
    <path fill="#ffffff" d="M98.67,175.64h39.87v30.14c0,25.83-20.97,46.8-46.8,46.8h-39.87v-30.14c0-25.83,20.97-46.8,46.8-46.8Z" />
    <path fill="#ffffff" d="M303.87,253.2h-34.63c-63.04-1.4-65.42,3.33-89.41-26.51l-76.01-94.57c-23.99-29.85-18.59-71.89,10.61-97.47l13.51-10.86,175.94,229.41Z" />
  </svg>
);

export const SearchIcon = ({ className = "ic search-icon" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const CloseIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IsoIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const OrbitIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3a15.3 15.3 0 0 0 4 9 15.3 15.3 0 0 0-4 9 15.3 15.3 0 0 0-4-9 15.3 15.3 0 0 0 4-9z" />
  </svg>
);

export const TopViewIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

export const ResetIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

export const PinIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const ListIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

export const PlusIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const SunIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const MoonIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const EditIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const TrashIcon = ({ className = "ic ic-sm" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const VideoCameraIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export const DownloadIcon = ({ className = "ic" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
