'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, Html, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

// --- CONFIGURATION ---
const MAP_SIZE = 100; // Total map area
const LAND_COUNT = 100; // Number of plots

// --- HELPER: Random Name Generator ---
const generateLandName = (id) => {
  const names = ["Greenwood", "Sunnyvale", "Riverdale", "Highland", "Westside", "Oakwood", "Maple", "Cedar", "Pine", "Elm"];
  const types = ["District", "Estate", "Heights", "Park", "Grove", "Gardens"];
  return `${names[id % names.length]} ${types[id % types.length]} ${id}`;
};

// --- COMPONENT: Single Land Polygon ---
const LandPolygon = ({ shape, color, name, isSelected, onClick }) => {
  // Safety check: If shape is broken, don't render it
  if (!shape || shape.length < 3) return null;

  // Convert 2D points to 3D shape
  const threeShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(shape[0][0], shape[0][1]);
    for (let i = 1; i < shape.length; i++) {
      s.lineTo(shape[i][0], shape[i][1]);
    }
    s.closePath();
    return s;
  }, [shape]);

  // Create the geometry
  const geometry = useMemo(() => new THREE.ShapeGeometry(threeShape), [threeShape]);

  return (
    <group>
      {/* The Land Mass */}
      <mesh 
        geometry={geometry} 
        rotation={[-Math.PI / 2, 0, 0]} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial 
          color={isSelected ? "#4285F4" : color} // Google Blue for selection
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* The Border Line (Street Effect) */}
      <line rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={shape.length + 1}
            array={new Float32Array([...shape.flat(), ...shape[0]])} 
            itemSize={2}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#dadce0" linewidth={1} /> {/* Light Grey Border */}
      </line>

      {/* Label on Selection */}
      {isSelected && (
        <Html position={[shape[0][0], 2, shape[0][1]]} center zIndexRange={[100, 0]}>
          <div style={{ 
            background: 'white', 
            padding: '8px 12px', 
            borderRadius: '4px', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)', 
            fontFamily: 'Roboto, Arial, sans-serif',
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}>
            <strong style={{fontSize: '14px', color: '#202124'}}>{name}</strong>
            <div style={{fontSize: '12px', color: '#70757a'}}>4.8 ★★★★☆</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- MAIN APP ---
export default function GoogleMapClone() {
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(15); // Controls camera zoom

  // Generate Map Data (Voronoi)
  const lands = useMemo(() => {
    // 1. Generate Random Points
    const points = Array.from({ length: LAND_COUNT }, () => [
      (Math.random() - 0.5) * MAP_SIZE, 
      (Math.random() - 0.5) * MAP_SIZE
    ]);

    // 2. Create Shapes
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([-MAP_SIZE/2, -MAP_SIZE/2, MAP_SIZE/2, MAP_SIZE/2]);

    // 3. Convert to Data Objects
    return points.map((point, i) => {
      const polygon = voronoi.cellPolygon(i);
      
      // Google Maps Logic: Randomly assign Park (Green) vs City (Grey/White)
      const isPark = Math.random() > 0.85; 
      
      return {
        id: i,
        name: generateLandName(i),
        shape: polygon, // Can be null if out of bounds
        color: isPark ? "#C5E8C5" : "#F8F9FA" // Google Park Green vs Land White
      };
    });
  }, []); // Run once on load

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#AADAFF' }}> {/* Google Water Blue */}
      
      {/* Search Bar UI */}
      <div style={{ 
        position: 'absolute', top: 20, left: 20, zIndex: 10, 
        background: 'white', padding: '10px 15px', borderRadius: '8px', 
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <div style={{ width: '20px', height: '20px', background: '#aaa', borderRadius: '50%' }}></div>
        <span style={{ fontFamily: 'Arial', color: '#555' }}>Search Google Maps...</span>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        {/* Orthographic Camera = "Flat" Map View */}
        <OrthographicCamera makeDefault position={[0, 50, 0]} zoom={zoom} near={-100} far={200} />
        
        {/* Lighting (Bright Day) */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 20, 5]} intensity={0.5} />

        {/* Render Lands */}
        <group>
          {lands.map((land) => (
            <LandPolygon 
              key={land.id}
              {...land}
              isSelected={selectedId === land.id}
              onClick={() => setSelectedId(land.id)}
            />
          ))}
        </group>

        {/* Controls: Pan & Zoom like a Map */}
        <MapControls 
          enableRotate={false} // Lock rotation for 2D feel
          zoomSpeed={0.5}
          panSpeed={1}
          minZoom={10}
          maxZoom={50}
        />
      </Canvas>

      {/* Zoom Buttons UI */}
      <div style={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button onClick={() => setZoom(z => Math.min(z + 5, 50))} style={btnStyle}>+</button>
        <button onClick={() => setZoom(z => Math.max(z - 5, 10))} style={btnStyle}>-</button>
      </div>
    </div>
  );
}

const btnStyle = {
  width: '40px', height: '40px', background: 'white', border: 'none', 
  borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', 
  cursor: 'pointer', fontSize: '20px', color: '#666'
};