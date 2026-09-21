/**
 * AiO Studio — MapViewport Component
 * Integrates Three.js 2.5D Isometric Engine with React lifecycle
 * Strictly NO emojis.
 */

import React, { useEffect, useRef } from 'react';
import { Map3DEngine } from '../services/mapEngine';

export default function MapViewport({
  statesData,
  filmedStatesMap,
  selectedStateCode,
  onSelectState,
  onHoverState,
  viewPreset,
  showPins,
  theme,
  engineRef
}) {
  const containerRef = useRef(null);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new Map3DEngine(containerRef.current, {
      scale: 0.52,
      baseDepth: 9,
      elevationHeight: 3.5,
      highlightColor: '#00adb5',
      clayColor: '#f8fafc',
      theme: theme,
      showAllPins: showPins,
      onSelectState: (state) => {
        onSelectState(state ? state.code : null);
      },
      onHoverState: onHoverState
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Load States Geo Data into 3D Mesh
  useEffect(() => {
    if (engineRef.current && statesData) {
      engineRef.current.loadStatesData(statesData);
    }
  }, [statesData]);

  // Update Filmed States Map
  useEffect(() => {
    if (engineRef.current && filmedStatesMap) {
      engineRef.current.updateFilmedStates(filmedStatesMap);
    }
  }, [filmedStatesMap]);

  // Sync Selected State
  useEffect(() => {
    if (engineRef.current) {
      if (selectedStateCode) {
        engineRef.current.selectState(selectedStateCode);
      } else {
        engineRef.current.deselect();
      }
    }
  }, [selectedStateCode, statesData]);

  // Sync View Preset
  useEffect(() => {
    if (engineRef.current && viewPreset) {
      engineRef.current.setCameraPreset(viewPreset);
    }
  }, [viewPreset]);

  // Sync Show Pins
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setShowAllPins(showPins);
    }
  }, [showPins]);

  // Sync Theme
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(theme);
    }
  }, [theme]);

  return <div className="viewport-3d-container" ref={containerRef} />;
}
