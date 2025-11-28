import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ParticleSystem } from './components/ParticleSystem';
import { Controls } from './components/Controls';
import { GeminiLiveService } from './services/geminiLiveService';
import { ParticleShape, HandGesture } from './types';

function App() {
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.HEART);
  const [gesture, setGesture] = useState<HandGesture>(HandGesture.CLOSED);
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const geminiService = useRef<GeminiLiveService | null>(null);

  // Initialize service
  useEffect(() => {
    // In HBuilder X / Local Vite dev, ensure you have a .env file with VITE_API_KEY=...
    // The vite.config.ts will map it to process.env.API_KEY
    const apiKey = process.env.API_KEY; 
    
    if (apiKey) {
      geminiService.current = new GeminiLiveService(
        apiKey,
        (g) => setGesture(g),
        (connected) => setIsConnected(connected)
      );
    } else {
      console.warn("API Key not found. Please check your .env file or configuration.");
    }
    
    return () => {
      geminiService.current?.disconnect();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user" 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Wait for video to actually start before connecting AI
        videoRef.current.onloadeddata = () => {
          geminiService.current?.connect(videoRef.current!);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please enable camera access to use gestures.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.log("Fullscreen request denied or not supported:", e);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      {/* Hidden Video Element for Gemini Processing */}
      <video 
        ref={videoRef} 
        className="absolute top-0 left-0 w-32 opacity-0 pointer-events-none z-0" 
        playsInline 
        muted 
      />

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 0, 25], fov: 60 }} className="z-0 touch-none">
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <ParticleSystem shape={shape} gesture={gesture} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>

      {/* UI Overlay */}
      <Controls 
        currentShape={shape} 
        setShape={setShape}
        gesture={gesture}
        isConnected={isConnected}
        onConnect={startCamera}
        toggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}

export default App;