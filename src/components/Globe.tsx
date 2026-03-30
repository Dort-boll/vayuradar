import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { VayuEvent } from '../types';

const AttackArc = ({ event, simulationMode }: { event: VayuEvent, simulationMode?: boolean }) => {
  if (!event.target) return null;

  const points = useMemo(() => {
    const start = new THREE.Vector3().setFromSphericalCoords(
      2,
      (90 - event.source.lat) * (Math.PI / 180),
      (event.source.lon + 180) * (Math.PI / 180)
    );
    const end = new THREE.Vector3().setFromSphericalCoords(
      2,
      (90 - event.target!.lat) * (Math.PI / 180),
      (event.target!.lon + 180) * (Math.PI / 180)
    );

    const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(simulationMode ? 3.5 : 2.5);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(simulationMode ? 100 : 50);
  }, [event, simulationMode]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: simulationMode ? "#ff0000" : (event.severity > 7 ? "#ff4444" : "#00d4ff"),
      opacity: simulationMode ? 0.8 : 0.6,
      transparent: true,
      linewidth: simulationMode ? 2 : 1
    }))} />
  );
};

const DeceptionArc = ({ event }: { event: VayuEvent }) => {
  if (!event.target) return null;

  const points = useMemo(() => {
    const start = new THREE.Vector3().setFromSphericalCoords(
      2,
      (90 - event.source.lat) * (Math.PI / 180),
      (event.source.lon + 180) * (Math.PI / 180)
    );
    const end = new THREE.Vector3().setFromSphericalCoords(
      2,
      (90 - event.target!.lat) * (Math.PI / 180),
      (event.target!.lon + 180) * (Math.PI / 180)
    );

    const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(2.8);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(60);
  }, [event]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: "#d946ef", // Neon Magenta
      opacity: 0.8,
      transparent: true,
      linewidth: 2
    }))} />
  );
};

const OSINTArc = ({ event }: { event: VayuEvent }) => {
  if (!event.target) return null;

  const points = useMemo(() => {
    const start = new THREE.Vector3().setFromSphericalCoords(
      2,
      (90 - event.source.lat) * (Math.PI / 180),
      (event.source.lon + 180) * (Math.PI / 180)
    );
    const end = new THREE.Vector3().setFromSphericalCoords(
      2,
      (90 - event.target!.lat) * (Math.PI / 180),
      (event.target!.lon + 180) * (Math.PI / 180)
    );

    const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(2.3);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(40);
  }, [event]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: "#f97316", // Orange 500
      opacity: 0.7,
      transparent: true,
      linewidth: 1
    }))} />
  );
};

const HoneypotNode = ({ event }: { event: VayuEvent }) => {
  const pos = useMemo(() => {
    return new THREE.Vector3().setFromSphericalCoords(
      2.05,
      (90 - event.target!.lat) * (Math.PI / 180),
      (event.target!.lon + 180) * (Math.PI / 180)
    );
  }, [event]);

  return (
    <group position={pos}>
      <Sphere args={[0.03, 16, 16]}>
        <meshBasicMaterial color="#d946ef" />
      </Sphere>
      <Sphere args={[0.06, 16, 16]}>
        <meshBasicMaterial color="#d946ef" transparent opacity={0.2} />
      </Sphere>
    </group>
  );
};

const Earth = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Atmosphere Glow */}
        <Sphere ref={atmosphereRef} args={[2.5, 64, 64]}>
          <meshStandardMaterial
            color="#00d4ff"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
          />
        </Sphere>
        
        {/* Wireframe Grid */}
        <Sphere ref={meshRef} args={[2.02, 64, 64]}>
          <meshStandardMaterial
            color="#00d4ff"
            wireframe
            transparent
            opacity={0.15}
          />
        </Sphere>

        {/* Main Body */}
        <Sphere args={[2, 64, 64]}>
          <meshStandardMaterial
            color="#0a192f"
            transparent
            opacity={0.4}
          />
        </Sphere>
        <Sphere args={[1.98, 64, 64]}>
          <meshStandardMaterial color="#020617" />
        </Sphere>
      </Float>
    </group>
  );
};

interface GlobeProps {
  events: VayuEvent[];
  simulationMode?: boolean;
}

export const Globe: React.FC<GlobeProps> = ({ events, simulationMode }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars 
          radius={100} 
          depth={50} 
          count={isMobile ? 1500 : 5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1} 
        />
        
        <Earth />
        
        {/* Standard Attacks */}
        {events.filter(e => e.category === 'attack').map(event => (
          <AttackArc key={event.id} event={event} simulationMode={simulationMode} />
        ))}

        {/* Deception Layer */}
        {events.filter(e => e.category === 'deception').map(event => (
          <React.Fragment key={event.id}>
            <DeceptionArc event={event} />
            <HoneypotNode event={event} />
          </React.Fragment>
        ))}

        {/* OSINT Intelligence */}
        {events.filter(e => e.category === 'osint').map(event => (
          <OSINTArc key={event.id} event={event} />
        ))}

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={3} 
          maxDistance={10}
          autoRotate={!simulationMode}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};
