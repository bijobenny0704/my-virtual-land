'use client';

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Html, PerspectiveCamera } from '@react-three/drei';

// --- CONFIGURATION ---
const GRID_SIZE = 15; 
const PLOT_SIZE = 1.0;
const GAP = 0.05;

// --- COMPONENT: Natural Land Plot ---
const LandPlot = ({ position, id, type, onClick, isSelected }) => {
  const [hovered, setHover] = useState(false);

  // Natural Color Palette
  const colors = {
    grass: "#4d7c0f",    // Forest Green
    dirt: "#78350f",     // Earthy Brown
    water: "#0ea5e9",    // Sky Blue
    selected: "#facc15"  // Yellow highlight
  };

  const currentColor = isSelected ? colors.selected : hovered ? "#65a30d" : colors[type];

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(id); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[PLOT_SIZE, type === 'water' ? 0.05 : 0.2, PLOT_SIZE]} />
        <meshStandardMaterial 
          color={currentColor} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {hovered && (
        <Html distanceFactor={10} position={[0, 0.5, 0]}>
          <div style={{ 
            background: 'white', 
            color: '#333', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            {type.toUpperCase()} - Plot {id}
          </div>
        </Html>
      )}
    </group>
  );
};

// --- MAIN SCENE ---
export default function NaturalLandMap() {
  const [selectedPlot, setSelectedPlot] = useState(null);

  const landData = useMemo(() => {
    const plots = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        // Simple logic to create a "river" or "lake" feel
        let type = 'grass';
        if (x < 3 || z > 12) type = 'water';
        else if (Math.random() > 0.9) type = 'dirt';

        plots.push({
          id: `${x}-${z}`,
          position: [(x - GRID_SIZE / 2) * (PLOT_SIZE + GAP), 0, (z - GRID_SIZE / 2) * (PLOT_SIZE + GAP)],
          type
        });
      }
    }
    return plots;
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87ceeb' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <h1 style={{ margin: 0, color: '#1e3a8a', fontFamily: 'sans-serif' }}>Greenfield Reserve</h1>
        <p style={{ color: '#1e40af' }}>Select a plot to view land details.</p>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        
        {/* Natural Lighting */}
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* The Map */}
        <group>
          {landData.map((plot) => (
            <LandPlot 
              key={plot.id} 
              {...plot} 
              isSelected={selectedPlot === plot.id}
              onClick={setSelectedPlot}
            />
          ))}
        </group>

        <OrbitControls makeDefault minDistance={5} maxDistance={25} />
      </Canvas>
    </div>
  );
}