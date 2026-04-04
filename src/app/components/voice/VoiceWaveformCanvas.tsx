/**
 * @file VoiceWaveformCanvas.tsx
 * @description YYC³ 语音波形可视化 React 组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { VoiceWaveform } from '../../lib/voice/visualization/VoiceWaveform';
import type { WaveformConfig } from '../../lib/voice/visualization/types';

export interface VoiceWaveformCanvasProps {
  isListening: boolean;
  audioStream?: MediaStream | null;
  width?: number;
  height?: number;
  className?: string;
  config?: Partial<WaveformConfig>;
  onStartListening?: () => void;
  onStopListening?: () => void;
}

export const VoiceWaveformCanvas: React.FC<VoiceWaveformCanvasProps> = ({
  isListening,
  audioStream,
  width = 200,
  height = 80,
  className = '',
  config,
  onStartListening,
  onStopListening,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<VoiceWaveform | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) {return;}

    if (!waveformRef.current) {
      waveformRef.current = new VoiceWaveform({
        width,
        height,
        color: '#00d4ff',
        ...config,
      });
      waveformRef.current.attach(canvasRef.current);
    }

    return () => {
      if (waveformRef.current) {
        waveformRef.current.stop();
        waveformRef.current.disconnectAudioStream();
        waveformRef.current = null;
      }
    };
  }, [width, height, config]);

  const connectStream = useCallback(async () => {
    if (!waveformRef.current || !audioStream) {return;}

    try {
      await waveformRef.current.connectAudioStream(audioStream);
      setIsConnected(true);
      waveformRef.current.start();
    } catch (error) {
      console.error('[VoiceWaveformCanvas] Failed to connect audio stream:', error);
    }
  }, [audioStream]);

  const disconnectStream = useCallback(() => {
    if (!waveformRef.current) {return;}
    waveformRef.current.stop();
    waveformRef.current.disconnectAudioStream();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (isListening && audioStream && !isConnected) {
      connectStream();
    } else if (!isListening && isConnected) {
      disconnectStream();
    }
  }, [isListening, audioStream, isConnected, connectStream, disconnectStream]);

  const handleClick = useCallback(() => {
    if (isListening) {
      onStopListening?.();
    } else {
      onStartListening?.();
    }
  }, [isListening, onStartListening, onStopListening]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width, height }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          background: 'rgba(6,14,31,0.6)',
          cursor: 'pointer',
        }}
      />
      {!isConnected && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          {isListening ? (
            <Mic className="w-6 h-6 text-cyan-400 animate-pulse" />
          ) : (
            <MicOff className="w-6 h-6 text-white/30" />
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceWaveformCanvas;
