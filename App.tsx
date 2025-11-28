import React, { useEffect, useRef, useState } from 'react';
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
  const [isConfigured, setIsConfigured] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const geminiService = useRef<GeminiLiveService | null>(null);

  // Initialize service
  useEffect(() => {
    // Check for API Key provided by Vite env vars
    const apiKey = process.env.API_KEY; 
    
    if (!apiKey || apiKey.includes('placeholder')) {
      setIsConfigured(false);
      return;
    }

    geminiService.current = new GeminiLiveService(
      apiKey,
      (g) => setGesture(g),
      (connected) => setIsConnected(connected)
    );
    
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

  if (!isConfigured) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-500">Configuration Missing</h1>
        <p className="max-w-md text-gray-300 mb-6">
          The Gemini API Key is missing. 
        </p>
        <div className="bg-gray-900 p-4 rounded-lg text-left text-sm font-mono border border-gray-800">
          <p className="mb-2 text-gray-400">If deploying to Vercel/Netlify:</p>
          <p className="text-green-400">Add Environment Variable: <br/>VITE_API_KEY = your_key_here</p>
          <div className="h-4"></div>
          <p className="mb-2 text-gray-400">If running locally:</p>
          <p className="text-green-400">Create a .env file with: <br/>VITE_API_KEY=your_key_here</p>
        </div>
      </div>
    );
  }

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