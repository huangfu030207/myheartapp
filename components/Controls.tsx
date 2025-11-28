import React from 'react';
import { ParticleShape, HandGesture } from '../types';

interface ControlsProps {
  currentShape: ParticleShape;
  setShape: (s: ParticleShape) => void;
  gesture: HandGesture;
  isConnected: boolean;
  onConnect: () => void;
  toggleFullscreen: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  currentShape, 
  setShape, 
  gesture, 
  isConnected,
  onConnect,
  toggleFullscreen
}) => {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl pointer-events-auto flex flex-col gap-4 w-11/12 max-w-md">
        
        {/* Header / Status */}
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <h1 className="text-white font-bold text-lg">Gemini Particles</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">{isConnected ? 'AI Active' : 'Offline'}</span>
          </div>
        </div>

        {/* Gesture Feedback */}
        <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
          <span className="text-gray-400 text-sm">Detected Gesture:</span>
          <span className={`font-mono font-bold ${gesture === HandGesture.OPEN ? 'text-yellow-400' : 'text-blue-400'}`}>
            {gesture}
          </span>
        </div>

        {/* Shape Selectors */}
        <div className="flex gap-2">
          <button
            onClick={() => setShape(ParticleShape.HEART)}
            className={`flex-1 py-3 rounded-xl transition-all duration-300 font-medium ${
              currentShape === ParticleShape.HEART 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Heart 🩷
          </button>
          <button
            onClick={() => setShape(ParticleShape.FIREWORK)}
            className={`flex-1 py-3 rounded-xl transition-all duration-300 font-medium ${
              currentShape === ParticleShape.FIREWORK 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Fireworks 🎆
          </button>
        </div>

        {/* System Controls */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
           {!isConnected && (
             <button 
              onClick={onConnect}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Start Camera & AI
            </button>
           )}
           <button 
             onClick={toggleFullscreen}
             className="px-4 bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 rounded-lg transition-colors"
           >
             ⛶
           </button>
        </div>
      </div>
    </div>
  );
};
