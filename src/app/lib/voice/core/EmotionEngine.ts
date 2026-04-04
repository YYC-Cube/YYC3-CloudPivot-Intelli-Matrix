/**
 * @file EmotionEngine.ts
 * @description YYC³ 情感分析引擎 - 音频特征提取与情感分类
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @status stable
 */

import type { EmotionType, EmotionAnalysisResult, AudioFeatures } from './types';

export class EmotionEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;

  private energyHistory: number[] = [];

  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') {return false;}

    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      return true;
    } catch (error) {
      console.error('[EmotionEngine] Failed to initialize:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.audioContext !== null && this.analyser !== null;
  }

  getAudioFeatures(): AudioFeatures | null {
    if (!this.analyser) {return null;}

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);

    const pitch = this.calculatePitch(frequencyData);
    const energy = this.calculateEnergy(timeDomainData);
    const variation = this.calculateVariation(energy);

    return {
      pitch,
      energy,
      variation,
      frequencyData: Array.from(frequencyData),
      timeDomainData: Array.from(timeDomainData),
    };
  }

  private calculatePitch(frequencyData: Uint8Array): number {
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < frequencyData.length / 2; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }

    const sampleRate = this.audioContext?.sampleRate || 44100;
    const fftSize = this.analyser?.fftSize || 2048;
    return (maxIndex * sampleRate) / fftSize;
  }

  private calculateEnergy(timeDomainData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const val = (timeDomainData[i] - 128) / 128;
      sum += val * val;
    }
    return Math.sqrt(sum / timeDomainData.length) * 100;
  }

  private calculateVariation(currentEnergy: number): number {
    this.energyHistory.push(currentEnergy);
    if (this.energyHistory.length > 10) {
      this.energyHistory.shift();
    }

    if (this.energyHistory.length < 2) {return 0;}

    let variation = 0;
    for (let i = 1; i < this.energyHistory.length; i++) {
      variation += Math.abs(this.energyHistory[i] - this.energyHistory[i - 1]);
    }
    return variation / (this.energyHistory.length - 1);
  }

  analyzeEmotion(features?: AudioFeatures): EmotionAnalysisResult {
    const audioFeatures = features || this.getAudioFeatures();

    if (!audioFeatures) {
      return {
        type: 'neutral',
        confidence: 0,
        audioFeatures: { pitch: 0, energy: 0, variation: 0 },
      };
    }

    const { pitch, energy, variation } = audioFeatures;
    const emotion = this.classifyEmotion(pitch, energy, variation);
    const confidence = this.calculateConfidence(pitch, energy, variation, emotion);

    return {
      type: emotion,
      confidence,
      audioFeatures: { pitch, energy, variation },
    };
  }

  private classifyEmotion(pitch: number, energy: number, variation: number): EmotionType {
    if (energy > 60 && pitch > 300 && variation > 15) {
      return 'happy';
    }

    if (energy < 30 && pitch < 200 && variation < 5) {
      return 'sad';
    }

    if (energy > 70 && pitch > 350 && variation > 20) {
      return 'angry';
    }

    if (energy > 50 && pitch > 400 && variation > 25) {
      return 'surprise';
    }

    if (energy > 40 && pitch < 150 && variation > 10) {
      return 'fear';
    }

    if (energy < 40 && pitch < 180 && variation < 8) {
      return 'disgust';
    }

    return 'neutral';
  }

  private calculateConfidence(
    pitch: number,
    energy: number,
    variation: number,
    emotion: EmotionType
  ): number {
    const thresholds: Record<EmotionType, { pitch: number[]; energy: number[]; variation: number[] }> = {
      happy: { pitch: [300, 500], energy: [60, 100], variation: [15, 30] },
      sad: { pitch: [100, 200], energy: [0, 30], variation: [0, 5] },
      angry: { pitch: [350, 600], energy: [70, 100], variation: [20, 40] },
      fear: { pitch: [100, 150], energy: [40, 60], variation: [10, 20] },
      surprise: { pitch: [400, 700], energy: [50, 80], variation: [25, 50] },
      disgust: { pitch: [100, 180], energy: [0, 40], variation: [0, 8] },
      neutral: { pitch: [200, 300], energy: [30, 50], variation: [5, 15] },
    };

    const threshold = thresholds[emotion];
    const pitchScore = this.scoreInRange(pitch, threshold.pitch);
    const energyScore = this.scoreInRange(energy, threshold.energy);
    const variationScore = this.scoreInRange(variation, threshold.variation);

    return (pitchScore + energyScore + variationScore) / 3;
  }

  private scoreInRange(value: number, range: number[]): number {
    if (value >= range[0] && value <= range[1]) {
      const mid = (range[0] + range[1]) / 2;
      const distance = Math.abs(value - mid);
      const maxDistance = (range[1] - range[0]) / 2;
      return 1 - distance / maxDistance;
    }
    return 0.3;
  }

  analyzeTextEmotion(text: string): EmotionType {
    const emotionKeywords: Record<EmotionType, string[]> = {
      happy: ['开心', '快乐', '高兴', '幸福', '哈哈', '嘻嘻', '太好了', '棒', 'happy', 'great', 'awesome'],
      sad: ['难过', '伤心', '悲伤', '哭', '眼泪', 'sad', 'cry', 'upset'],
      angry: ['生气', '愤怒', '烦', '讨厌', '气死', 'angry', 'hate', 'annoying'],
      fear: ['害怕', '恐惧', '担心', '紧张', 'afraid', 'scared', 'worried'],
      surprise: ['惊讶', '震惊', '没想到', '天哪', 'surprise', 'wow', 'amazing'],
      disgust: ['恶心', '讨厌', '反感', 'disgust', 'gross'],
      neutral: [],
    };

    const lowerText = text.toLowerCase();
    let maxScore = 0;
    let detectedEmotion: EmotionType = 'neutral';

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerText.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion as EmotionType;
      }
    }

    return detectedEmotion;
  }

  fuseEmotions(
    voiceEmotion: EmotionAnalysisResult,
    textEmotion: EmotionType,
    voiceWeight: number = 0.6
  ): EmotionAnalysisResult {
    if (textEmotion === 'neutral' || voiceEmotion.type === textEmotion) {
      return voiceEmotion;
    }

    const textWeight = 1 - voiceWeight;
    const textConfidence = 0.7;
    const fusedConfidence =
      voiceEmotion.confidence * voiceWeight + textConfidence * textWeight;

    const dominantEmotion =
      voiceEmotion.confidence > 0.5 ? voiceEmotion.type : textEmotion;

    return {
      type: dominantEmotion,
      confidence: fusedConfidence,
      audioFeatures: voiceEmotion.audioFeatures,
    };
  }

  destroy(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.energyHistory = [];
  }
}

export default EmotionEngine;
