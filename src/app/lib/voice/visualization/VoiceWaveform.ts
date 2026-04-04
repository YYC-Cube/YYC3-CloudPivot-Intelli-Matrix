/**
 * @file VoiceWaveform.ts
 * @description YYC³ 语音波形可视化组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { WaveformConfig } from './types';
import { DEFAULT_WAVEFORM_CONFIG } from './types';

export class VoiceWaveform {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: WaveformConfig;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private frequencyData: Uint8Array | null = null;

  constructor(config?: Partial<WaveformConfig>) {
    this.config = { ...DEFAULT_WAVEFORM_CONFIG, ...config };
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

  async connectAudioStream(stream: MediaStream): Promise<void> {
    try {
      this.mediaStream = stream;
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = this.config.smoothing;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (error) {
      console.error('[VoiceWaveform] Failed to connect audio stream:', error);
    }
  }

  disconnectAudioStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }
  }

  updateData(frequencyData: Uint8Array): void {
    this.frequencyData = frequencyData;
  }

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

  private animate = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) {return;}

    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
    }

    this.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private render(): void {
    if (!this.ctx || !this.canvas) {return;}

    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;

    this.ctx.clearRect(0, 0, width, height);

    if (!this.frequencyData || this.frequencyData.length === 0) {
      this.drawIdleWave(width, height);
      return;
    }

    this.drawBars(width, height);
  }

  private drawIdleWave(width: number, height: number): void {
    if (!this.ctx) {return;}

    const centerY = height / 2;
    const time = Date.now() / 1000;

    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY);

    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin(x * 0.02 + time * 2) * 5;
      this.ctx.lineTo(x, y);
    }

    this.ctx.strokeStyle = this.config.color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawBars(width: number, height: number): void {
    if (!this.ctx || !this.frequencyData) {return;}

    const { barCount, barWidth, barGap, mirror } = this.config;
    const totalWidth = barCount * (barWidth + barGap);
    const startX = (width - totalWidth) / 2;
    const centerY = height / 2;

    const step = Math.floor(this.frequencyData.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = this.frequencyData[i * step] || 0;
      const barHeight = (value / 255) * (height * 0.4);
      const x = startX + i * (barWidth + barGap);

      const gradient = this.ctx.createLinearGradient(x, centerY - barHeight, x, centerY + barHeight);
      gradient.addColorStop(0, this.config.color);
      gradient.addColorStop(0.5, this.adjustColorBrightness(this.config.color, 1.2));
      gradient.addColorStop(1, this.config.color);

      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = this.config.color;
      this.ctx.shadowBlur = 10;

      this.ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);

      if (mirror) {
        this.ctx.fillRect(x, centerY, barWidth, barHeight);
      }

      this.ctx.shadowBlur = 0;
    }
  }

  private adjustColorBrightness(hex: string, factor: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) {return hex;}

    const r = Math.min(255, Math.round(rgb.r * factor));
    const g = Math.min(255, Math.round(rgb.g * factor));
    const b = Math.min(255, Math.round(rgb.b * factor));

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

  getFrequencyData(): Uint8Array | null {
    return this.frequencyData;
  }

  getAverageLevel(): number {
    if (!this.frequencyData || this.frequencyData.length === 0) {return 0;}

    let sum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
    }
    return sum / this.frequencyData.length / 255;
  }
}

export default VoiceWaveform;
