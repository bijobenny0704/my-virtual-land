'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

// --- CONFIGURATION ---
const GRID_SIZE = 10; // 10x10 Grid
const PLOT_SIZE = 1.0;
const GAP = 0.1; // Gap between plots

// --- COMPONENT: Single Land Plot ---
const LandPlot = ({ position, id, isSelected, onClick }) => {
  // State for hover effect
  const [hovered, setHover] = useState(false);
  const meshRef = useRef();

  // Animation: Gentle float when hovered
  useFrame((state) => {
    if (meshRef.current) {
      const targetY = hovered ? 0.2 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    }
  });

  // Color Logic
  const baseColor = "#1a1a1a"; // Dark grey (Unsold)
  const hoverColor = "#00f3ff"; // Neon Cyan (Hover)
  const selectedColor = "#bd00ff"; // Purple (Selected)

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation(); // Prevent clicking through to background
          onClick(id);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {/* The Land Block */}
        <boxGeometry args={[PLOT_SIZE, 0.2, PLOT_SIZE]} />
        <meshStandardMaterial
          color={isSelected ? selectedColor : hovered ? hoverColor : baseColor}
          metalness={0.6}
          roughness={0.2}
          emissive={isSelected ? selectedColor : hovered ? hoverColor : "#000"}
          emissiveIntensity={0.5}
        />
        
        {/* Glowing Borders (Tron Style) */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(PLOT_SIZE, 0.2, PLOT_SIZE)]} />
          <lineBasicMaterial color={isSelected ? "#fff" : "#333"} />
        </lineSegments>
      </mesh>

      {/* Show ID on Hover */}
      {hovered && (
        <Html distanceFactor={10}>
          <div style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #00f3ff', whiteSpace: 'nowrap' }}>
            Plot #{id}
          </div>
        </Html>
      )}
    </group>
  );
};

// --- COMPONENT: The Main Scene ---
export default function VirtualLandMap() {
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Generate Grid Data
  const plots = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let z = 0; z < GRID_SIZE; z++) {
      plots.push({
        id: `${x}-${z}`,
        position: [
          (x - GRID_SIZE / 2) * (PLOT_SIZE + GAP), 
          0, 
          (z - GRID_SIZE / 2) * (PLOT_SIZE + GAP)
        ]
      });
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, color: 'white', fontFamily: 'sans-serif' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Aetheria Map</h1>
        <p style={{ color: '#888' }}>Select a plot to view details.</p>
        
        {selectedPlot ? (
          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid #bd00ff', borderRadius: '8px' }}>
            <strong>Selected: Plot #{selectedPlot}</strong><br/>
            Price: 2.5 ETH<br/>
            Owner: Available<br/>
            <button style={{ marginTop: '10px', padding: '8px 16px', background: '#bd00ff', color: 'white', border: 'none', cursor: 'pointer' }}>
              BUY NOW
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '20px', color: '#555' }}>
            No plot selected
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#bd00ff" />

        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Render Grid */}
        <group>
          {plots.map((plot) => (
            <LandPlot 
              key={plot.id} 
              {...plot} 
              isSelected={selectedPlot === plot.id}
              onClick={setSelectedPlot}
            />
          ))}
        </group>

        {/* Camera Controls */}
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.2} // Prevent going under the ground
          minDistance={5}
          maxDistance={20}
        />
        
        {/* Optional: Floor Reflection for extra style */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#050505" mirror={1} roughness={0.1} metalness={0.8} />
        </mesh>
      </Canvas>
    </div>
  );
}