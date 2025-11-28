import { GoogleGenAI, LiveSession, FunctionDeclaration, Type, LiveServerMessage, Modality } from "@google/genai";
import { HandGesture } from "../types";

// Tool definition for the model to control the app
const controlGestureFunction: FunctionDeclaration = {
  name: 'setHandGesture',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates the application state based on the user\'s hand gesture seen in the video.',
    properties: {
      gesture: {
        type: Type.STRING,
        enum: ['OPEN', 'CLOSED'],
        description: 'OPEN if the hand fingers are spread out or expanding. CLOSED if the hand is a fist or pinching.',
      },
    },
    required: ['gesture'],
  },
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<LiveSession> | null = null;
  private videoInterval: number | null = null;
  
  // Callbacks to update React state
  private onGestureChange: (gesture: HandGesture) => void;
  private onStatusChange: (isConnected: boolean) => void;

  constructor(
    apiKey: string, 
    onGestureChange: (gesture: HandGesture) => void,
    onStatusChange: (isConnected: boolean) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onGestureChange = onGestureChange;
    this.onStatusChange = onStatusChange;
  }

  public async connect(videoElement: HTMLVideoElement) {
    if (this.sessionPromise) return;

    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
    
    this.sessionPromise = this.ai.live.connect({
      model,
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Connected");
          this.onStatusChange(true);
          this.startVideoStream(videoElement);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'setHandGesture') {
                const gestureStr = (fc.args as any).gesture;
                const gesture = gestureStr === 'OPEN' ? HandGesture.OPEN : HandGesture.CLOSED;
                this.onGestureChange(gesture);
                
                // Respond to tool call
                this.sessionPromise?.then((session) => {
                   session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "ok" }
                    }
                   });
                });
              }
            }
          }
        },
        onclose: () => {
          console.log("Gemini Live Closed");
          this.onStatusChange(false);
          this.stopVideoStream();
          this.sessionPromise = null;
        },
        onerror: (err) => {
          console.error("Gemini Live Error", err);
          this.onStatusChange(false);
          this.stopVideoStream();
          this.sessionPromise = null;
        }
      },
      config: {
        responseModalities: [Modality.AUDIO], // We must accept audio, even if we just want tool calls
        tools: [{ functionDeclarations: [controlGestureFunction] }],
        systemInstruction: `
          You are a real-time vision controller for a particle system.
          Continuously analyze the video input.
          If you see a user's hand that is OPEN (fingers spread), call setHandGesture(gesture='OPEN').
          If you see a user's hand that is CLOSED (fist or pinched), call setHandGesture(gesture='CLOSED').
          Be highly responsive. If the hand is out of frame or unclear, default to CLOSED.
        `,
      }
    });
  }

  public async disconnect() {
    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      session.close();
      this.sessionPromise = null;
    }
    this.stopVideoStream();
    this.onStatusChange(false);
  }

  private startVideoStream(videoEl: HTMLVideoElement) {
    if (this.videoInterval) clearInterval(this.videoInterval);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const JPEG_QUALITY = 0.5;
    const FRAME_RATE = 2; // Send 2 frames per second to stay within limits/latency balance for this model

    this.videoInterval = window.setInterval(() => {
      if (!ctx || !videoEl.videoWidth) return;

      canvas.width = videoEl.videoWidth * 0.5; // Downscale for speed
      canvas.height = videoEl.videoHeight * 0.5;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const base64Data = await this.blobToBase64(blob);
            this.sessionPromise?.then(session => {
                session.sendRealtimeInput({
                    media: { data: base64Data, mimeType: 'image/jpeg' }
                });
            });
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    }, 1000 / FRAME_RATE);
  }

  private stopVideoStream() {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}