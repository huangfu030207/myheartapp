export enum ParticleShape {
  HEART = 'HEART',
  FIREWORK = 'FIREWORK'
}

export enum HandGesture {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  UNKNOWN = 'UNKNOWN'
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  speed: number;
}

export interface GeminiState {
  isConnected: boolean;
  isStreaming: boolean;
  lastGesture: HandGesture;
}
