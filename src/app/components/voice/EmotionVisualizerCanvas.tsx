/**
 * @file EmotionVisualizerCanvas.tsx
 * @description YYC³ 情感可视化 React 组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import React, { useEffect, useRef } from 'react';
import { EmotionVisualizer } from '../../lib/voice/visualization/EmotionVisualizer';
import type { EmotionAnalysisResult } from '../../lib/voice/core/types';
import type { EmotionVisualizerConfig } from '../../lib/voice/visualization/types';

export interface EmotionVisualizerCanvasProps {
  emotion: EmotionAnalysisResult | null;
  width?: number;
  height?: number;
  className?: string;
  config?: Partial<EmotionVisualizerConfig>;
}

export const EmotionVisualizerCanvas: React.FC<EmotionVisualizerCanvasProps> = ({
  emotion,
  width = 300,
  height = 300,
  className = '',
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<EmotionVisualizer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {return;}

    if (!visualizerRef.current) {
      visualizerRef.current = new EmotionVisualizer({
        width,
        height,
        ...config,
      });
      visualizerRef.current.attach(canvasRef.current);
      visualizerRef.current.start();
    }

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.stop();
        visualizerRef.current = null;
      }
    };
  }, [width, height, config]);

  useEffect(() => {
    if (visualizerRef.current && emotion) {
      visualizerRef.current.updateEmotion(emotion);
    }
  }, [emotion]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        width,
        height,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,14,31,0.8) 0%, rgba(6,14,31,1) 100%)',
      }}
    />
  );
};

export default EmotionVisualizerCanvas;
