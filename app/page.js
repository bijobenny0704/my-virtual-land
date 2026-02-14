'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- CONFIGURATION ---
const GRID_SIZE = 12; // Larger world
const PLOT_SIZE = 1.0;
const GAP = 0.15;

// --- COMPONENT: Holographic Building ---
// This creates a random skyscraper on the land
const Building = ({ height, color }) => {
  return (
    <group position={[0, height / 2, 0]}>
      {/* Main Tower */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, height, 0.7]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.8} 
          roughness={0.1} 
          metalness={0.9} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      {/* Glowing Top Line */}
      <mesh position={[0, height / 2 + 0.05, 0]}>
        <boxGeometry args={[0.75, 0.1, 0.75]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

// --- COMPONENT: Single Land Plot ---
const LandPlot = ({ position, id, type, height, onClick, isSelected }) => {
  const [hovered, setHover] = useState(false);
  const meshRef = useRef();

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.2, 0.1);
    } else if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
    }
  });

  // Determine Colors based on Type
  let baseColor = "#050505"; // Empty Land (Black)
  let glowColor = "#000"; 
  
  if (type === 'residential') {
    baseColor = "#001a33"; // Deep Blue
    glowColor = "#00aaff"; // Cyan Glow
  } else if (type === 'commercial') {
    baseColor = "#1a0033"; // Deep Purple
    glowColor = "#bd00ff"; // Purple Glow
  } else if (isSelected) {
    baseColor = "#330000";
    glowColor = "#ff0000";
  }

  // Hover Effect Override
  if (hovered) glowColor = "#ffffff"; 

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(id); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {/* The Base Plot */}
        <boxGeometry args={[PLOT_SIZE, 0.1, PLOT_SIZE]} />
        <meshStandardMaterial 
          color={baseColor} 
          emissive={glowColor} 
          emissiveIntensity={hovered ? 0.5 : 2}
          roughness={0.2}
          metalness={0.8}
        />
        
        {/* Glowing Edge Lines (Tron Style) */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(PLOT_SIZE, 0.1, PLOT_SIZE)]} />
          <lineBasicMaterial color={type === 'empty' ? "#333" : glowColor} opacity={0.5} transparent />
        </lineSegments>

        {/* Render Building if not empty */}
        {type !== 'empty' && (
          <Building height={height} color={glowColor} />
        )}
      </mesh>

      {/* Info Tag */}
      {hovered && (
        <Html distanceFactor={12} position={[0, height + 1, 0]}>
          <div style={{ 
            background: 'rgba(0,0,0,0.9)', 
            border: `1px solid ${glowColor}`, 
            color: glowColor, 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'Orbitron, sans-serif',
            boxShadow: `0 0 10px ${glowColor}`
          }}>
            <strong>{type.toUpperCase()} UNIT</strong><br/>
            Plot #{id}
          </div>
        </Html>
      )}
    </group>
  );
};

// --- MAIN SCENE ---
export default function VirtualCity() {
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Generate City Data (Only once)
  const cityData = useMemo(() => {
    const plots = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        // Randomly decide if this plot has a building
        const rand = Math.random();
        let type = 'empty';
        let height = 0;

        if (rand > 0.85) {
          type = 'commercial'; // Rare Skyscrapers
          height = Math.random() * 2 + 1.5; // Tall
        } else if (rand > 0.6) {
          type = 'residential'; // Common Buildings
          height = Math.random() * 0.8 + 0.5; // Short
        }

        plots.push({
          id: `${x}-${z}`,
          position: [(x - GRID_SIZE / 2) * (PLOT_SIZE + GAP), 0, (z - GRID_SIZE / 2) * (PLOT_SIZE + GAP)],
          type,
          height
        });
      }
    }
    return plots;
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 30, left: 30, zIndex: 10, pointerEvents: 'none' }}>
        <h1 style={{ color: '#fff', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '2.5rem', textShadow: '0 0 20px #00aaff' }}>
          Neon<span style={{color: '#bd00ff'}}>City</span>
        </h1>
      </div>

      <Canvas>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={45} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00aaff" />
        <pointLight position={[-10, 5, -10]} intensity={1.5} color="#bd00ff" />
        
        {/* Environment Effects */}
        <fog attach="fog" args={['#050505', 5, 30]} /> {/* Fade into darkness */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
        
        {/* The City Grid */}
        <group>
          {cityData.map((plot) => (
            <LandPlot 
              key={plot.id} 
              {...plot} 
              isSelected={selectedPlot === plot.id}
              onClick={setSelectedPlot}
            />
          ))}
        </group>

        {/* Shiny Floor Reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial 
            color="#000" 
            mirror={1} 
            blur={[500, 100]} 
            mixBlur={12} 
            mixStrength={1.5} 
            roughness={0.1} 
            metalness={1} 
          />
        </mesh>

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={5}
          maxDistance={30}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />

        {/* POST PROCESSING: The Glow Effect */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}