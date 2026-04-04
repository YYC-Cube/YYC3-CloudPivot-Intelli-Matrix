/**
 * @file EmotionVisualizer.ts
 * @description YYC³ 情感可视化组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType, EmotionAnalysisResult } from '../core/types';
import type { EmotionVisualizerConfig, EmotionHistoryEntry } from './types';
import { EMOTION_VISUALIZER_COLORS, DEFAULT_EMOTION_VISUALIZER_CONFIG } from './types';

export class EmotionVisualizer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: EmotionVisualizerConfig;
  private history: EmotionHistoryEntry[] = [];
  private currentEmotion: EmotionType = 'neutral';
  private currentConfidence: number = 0;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private transitionProgress: number = 1;
  private previousEmotion: EmotionType = 'neutral';

  constructor(config?: Partial<EmotionVisualizerConfig>) {
    this.config = { ...DEFAULT_EMOTION_VISUALIZER_CONFIG, ...config };
  }

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (this.config.responsive) {
      this.resize();
      window.addEventListener('resize', this.resize);
    }
  }

  detach(): void {
    if (this.config.responsive) {
      window.removeEventListener('resize', this.resize);
    }
    this.stop();
    this.canvas = null;
    this.ctx = null;
  }

  private resize = (): void => {
    if (!this.canvas) {return;}

    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;

    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  };

  start(): void {
    if (this.isRunning) {return;}
    this.isRunning = true;
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateEmotion(result: EmotionAnalysisResult): void {
    this.previousEmotion = this.currentEmotion;
    this.currentEmotion = result.type;
    this.currentConfidence = result.confidence;
    this.transitionProgress = 0;

    this.history.push({
      emotion: result.type,
      confidence: result.confidence,
      timestamp: Date.now(),
      audioFeatures: result.audioFeatures,
    });

    if (this.history.length > this.config.historyLength) {
      this.history = this.history.slice(-this.config.historyLength);
    }
  }

  private animate = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) {return;}

    this.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private render(): void {
    if (!this.ctx || !this.canvas) {return;}

    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.clearRect(0, 0, width, height);

    this.transitionProgress = Math.min(1, this.transitionProgress + 0.05);

    this.drawEmotionCircle(width, height);
    this.drawEmotionRings(width, height);

    if (this.config.showLabels) {
      this.drawLabels(width, height);
    }

    if (this.config.showHistory && this.history.length > 1) {
      this.drawHistory(width, height);
    }
  }

  private drawEmotionCircle(width: number, height: number): void {
    if (!this.ctx) {return;}

    const centerX = width / 2;
    const centerY = height / 2 - 30;
    const baseRadius = Math.min(width, height) * 0.25;
    const radius = baseRadius * (0.8 + this.currentConfidence * 0.4);

    const colors = EMOTION_VISUALIZER_COLORS[this.currentEmotion];
    const prevColors = EMOTION_VISUALIZER_COLORS[this.previousEmotion];

    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

    const currentPrimary = this.lerpColor(prevColors.primary, colors.primary, this.transitionProgress);
    const currentSecondary = this.lerpColor(prevColors.secondary, colors.secondary, this.transitionProgress);
    const currentGlow = this.lerpColor(prevColors.glow, colors.glow, this.transitionProgress);

    gradient.addColorStop(0, currentPrimary);
    gradient.addColorStop(0.5, currentSecondary);
    gradient.addColorStop(1, 'transparent');

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.shadowColor = currentGlow;
    this.ctx.shadowBlur = 30;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    this.ctx.strokeStyle = currentPrimary;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  private drawEmotionRings(width: number, height: number): void {
    if (!this.ctx) {return;}

    const centerX = width / 2;
    const centerY = height / 2 - 30;
    const baseRadius = Math.min(width, height) * 0.25;
    const colors = EMOTION_VISUALIZER_COLORS[this.currentEmotion];

    for (let i = 1; i <= 3; i++) {
      const ringRadius = baseRadius * (1.2 + i * 0.15);
      const alpha = 0.3 - i * 0.08;

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.hexToRgba(colors.primary, alpha);
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  private drawLabels(width: number, height: number): void {
    if (!this.ctx) {return;}

    const centerX = width / 2;
    const centerY = height / 2 - 30;
    const colors = EMOTION_VISUALIZER_COLORS[this.currentEmotion];

    this.ctx.font = 'bold 24px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = colors.primary;
    this.ctx.fillText(this.getEmotionLabel(this.currentEmotion), centerX, centerY);

    this.ctx.font = '14px system-ui';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillText(`${Math.round(this.currentConfidence * 100)}%`, centerX, centerY + 25);
  }

  private drawHistory(width: number, height: number): void {
    if (!this.ctx || this.history.length < 2) {return;}

    const padding = 40;
    const graphHeight = 60;
    const graphY = height - graphHeight - padding;
    const graphWidth = width - padding * 2;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, graphY);
    this.ctx.lineTo(width - padding, graphY);
    this.ctx.stroke();

    const stepX = graphWidth / (this.history.length - 1);

    this.ctx.beginPath();
    this.ctx.moveTo(padding, graphY + graphHeight - this.history[0].confidence * graphHeight);

    for (let i = 1; i < this.history.length; i++) {
      const x = padding + i * stepX;
      const y = graphY + graphHeight - this.history[i].confidence * graphHeight;
      this.ctx.lineTo(x, y);
    }

    const colors = EMOTION_VISUALIZER_COLORS[this.currentEmotion];
    this.ctx.strokeStyle = colors.primary;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private getEmotionLabel(emotion: EmotionType): string {
    const labels: Record<EmotionType, string> = {
      happy: '开心',
      sad: '悲伤',
      angry: '愤怒',
      fear: '恐惧',
      surprise: '惊讶',
      disgust: '厌恶',
      neutral: '平静',
    };
    return labels[emotion];
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) {return color2;}

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const rgb = this.hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
  }

  getHistory(): EmotionHistoryEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  getCurrentEmotion(): { emotion: EmotionType; confidence: number } {
    return { emotion: this.currentEmotion, confidence: this.currentConfidence };
  }
}

export default EmotionVisualizer;
