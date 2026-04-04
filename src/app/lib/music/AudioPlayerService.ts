/**
 * @file 音频播放核心服务
 * @description 基于 Web Audio API 的现代化音频播放引擎
 * @author YYC³ Team
 * @version 1.0.0
 */

import type { MusicSong, MusicPlayerState } from './types';

type RepeatMode = 'off' | 'all' | 'one';

interface AudioPlayerEvents {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onError: (error: Error) => void;
  onVolumeChange: (volume: number) => void;
  onLoaded: (song: MusicSong) => void;
}

interface AudioAnalyzerData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}

interface EqualizerPreset {
  name: string;
  gains: number[];
}

const DEFAULT_EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: 'flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'bass-boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'treble-boost', gains: [0, 0, 0, 0, 0, 2, 4, 5, 6, 6] },
  { name: 'vocal', gains: [-2, -1, 0, 3, 4, 4, 3, 0, -1, -2] },
  { name: 'electronic', gains: [4, 3, 0, -2, -1, 0, 2, 3, 4, 4] },
  { name: 'classical', gains: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4] },
];

const FREQUENCY_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

class AudioPlayerService {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private equalizerNodes: BiquadFilterNode[] = [];
  private sourceNode: MediaElementAudioSourceNode | null = null;

  private currentSong: MusicSong | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.7;
  private muted: boolean = false;
  private repeat: RepeatMode = 'off';
  private shuffle: boolean = false;
  private queue: MusicSong[] = [];
  private queueIndex: number = 0;

  private eventListeners: Partial<AudioPlayerEvents> = {};
  private animationFrameId: number | null = null;
  private _equalizerPreset: string = 'flat';

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio(): void {
    if (typeof window === 'undefined') {return;}

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.eventListeners.onPlay?.();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.eventListeners.onPause?.();
    });

    this.audioElement.addEventListener('ended', () => {
      this.handleSongEnded();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.eventListeners.onTimeUpdate?.(
          this.audioElement.currentTime,
          this.audioElement.duration || 0
        );
      }
    });

    this.audioElement.addEventListener('error', (_e) => {
      const error = this.audioElement?.error;
      const errorDetails = error ? {
        code: error.code,
        message: error.message,
        MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
        MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
        MEDIA_ERR_DECODE: error.MEDIA_ERR_DECODE,
        MEDIA_ERR_SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED,
      } : null;
      console.error('🔴 Audio error:', errorDetails, 'Source:', this.audioElement?.src);
      this.eventListeners.onError?.(
        new Error(error?.message || 'Audio playback error')
      );
    });

    this.audioElement.addEventListener('canplaythrough', () => {
      console.log('✅ Audio can play through:', this.currentSong?.title);
    });

    this.audioElement.addEventListener('waiting', () => {
      console.log('⏳ Audio waiting for data...');
    });

    this.audioElement.addEventListener('stalled', () => {
      console.log('⚠️ Audio stalled');
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.currentSong) {
        this.eventListeners.onLoaded?.(this.currentSong);
      }
    });

    this.audioElement.addEventListener('volumechange', () => {
      this.eventListeners.onVolumeChange?.(this.volume);
    });
  }

  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext) {return;}

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;

      this.equalizerNodes = FREQUENCY_BANDS.map((freq) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

      if (this.audioElement) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

        let lastNode: AudioNode = this.sourceNode;
        for (const eqNode of this.equalizerNodes) {
          lastNode.connect(eqNode);
          lastNode = eqNode;
        }
        lastNode.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  private handleSongEnded(): void {
    if (this.repeat === 'one') {
      this.seekTo(0);
      this.play();
    } else {
      this.eventListeners.onEnded?.();
    }
  }

  async loadSong(song: MusicSong): Promise<void> {
    if (!this.audioElement) {return;}

    this.currentSong = song;

    const audioUrl = this.getAudioUrl(song);
    console.log('🎵 Loading song:', song.title, 'Audio URL:', audioUrl);
    
    if (!audioUrl) {
      console.error('❌ No audio source for song:', song.title);
      this.eventListeners.onError?.(new Error(`No audio source for song: ${song.title}`));
      return;
    }

    this.audioElement.src = audioUrl;
    this.audioElement.load();

    await this.initializeAudioContext();
  }

  private getAudioUrl(song: MusicSong): string | null {
    if (song.audioUrl) {
      console.log('✅ Using song.audioUrl:', song.audioUrl);
      return song.audioUrl;
    }

    if (song.youtubeId) {
      console.log('📺 Using YouTube ID:', song.youtubeId);
      return this.getYoutubeAudioUrl(song.youtubeId);
    }

    console.log('⚠️ Falling back to demo audio for song:', song.id);
    return this.getDemoAudioUrl(song);
  }

  private getYoutubeAudioUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  private getDemoAudioUrl(song: MusicSong): string {
    const demoUrls: Record<string, string> = {
      'song-1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      'song-2': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      'song-3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      'song-4': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      'song-5': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      'song-6': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      'song-7': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
      'song-8': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
      'song-9': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
      'song-10': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
      'song-11': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
      'song-12': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    };

    return demoUrls[song.id] || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  }

  async play(): Promise<void> {
    if (!this.audioElement) {return;}

    try {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      await this.audioElement.play();
    } catch (error) {
      console.error('Play error:', error);
      this.eventListeners.onError?.(error as Error);
    }
  }

  pause(): void {
    this.audioElement?.pause();
  }

  async playSong(song: MusicSong, index?: number): Promise<void> {
    await this.loadSong(song);
    if (index !== undefined) {
      this.queueIndex = index;
    }
    await this.play();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.volume;
    }
    if (this.audioElement) {
      this.audioElement.volume = this.muted ? 0 : this.volume;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.setVolume(this.volume);
    return this.muted;
  }

  seekTo(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, time);
    }
  }

  seekToPercent(percent: number): void {
    if (this.audioElement && this.audioElement.duration) {
      this.audioElement.currentTime = (percent / 100) * this.audioElement.duration;
    }
  }

  setRepeat(mode: RepeatMode): void {
    this.repeat = mode;
  }

  toggleRepeat(): RepeatMode {
    this.repeat = this.repeat === 'off' ? 'all' : this.repeat === 'all' ? 'one' : 'off';
    return this.repeat;
  }

  toggleShuffle(): boolean {
    this.shuffle = !this.shuffle;
    return this.shuffle;
  }

  setQueue(songs: MusicSong[], startIndex: number = 0): void {
    this.queue = songs;
    this.queueIndex = startIndex;
  }

  async next(): Promise<MusicSong | null> {
    if (this.queue.length === 0) {return null;}

    if (this.shuffle) {
      this.queueIndex = Math.floor(Math.random() * this.queue.length);
    } else {
      this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    }

    const nextSong = this.queue[this.queueIndex];
    if (nextSong) {
      await this.playSong(nextSong, this.queueIndex);
    }
    return nextSong || null;
  }

  async previous(): Promise<MusicSong | null> {
    if (this.queue.length === 0) {return null;}

    if (this.audioElement && this.audioElement.currentTime > 3) {
      this.seekTo(0);
      return this.currentSong;
    }

    this.queueIndex = this.queueIndex === 0 ? this.queue.length - 1 : this.queueIndex - 1;

    const prevSong = this.queue[this.queueIndex];
    if (prevSong) {
      await this.playSong(prevSong, this.queueIndex);
    }
    return prevSong || null;
  }

  getAnalyzerData(): AudioAnalyzerData | null {
    if (!this.analyser) {return null;}

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);

    return { frequencyData, timeDomainData };
  }

  startVisualization(callback: (data: AudioAnalyzerData) => void): void {
    if (!this.analyser) {return;}

    const animate = () => {
      const data = this.getAnalyzerData();
      if (data) {
        callback(data);
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  stopVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setEqualizerPreset(presetName: string): void {
    const preset = DEFAULT_EQUALIZER_PRESETS.find((p) => p.name === presetName);
    if (!preset) {return;}

    this._equalizerPreset = presetName;
    preset.gains.forEach((gain, index) => {
      if (this.equalizerNodes[index]) {
        this.equalizerNodes[index].gain.value = gain;
      }
    });
  }

  setEqualizerBand(bandIndex: number, gain: number): void {
    if (this.equalizerNodes[bandIndex]) {
      this.equalizerNodes[bandIndex].gain.value = Math.max(-12, Math.min(12, gain));
    }
  }

  getEqualizerPresets(): EqualizerPreset[] {
    return DEFAULT_EQUALIZER_PRESETS;
  }

  getCurrentEqualizerPreset(): string {
    return this._equalizerPreset;
  }

  getCurrentState(): Partial<MusicPlayerState> {
    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      volume: this.volume,
      progress: this.audioElement?.currentTime || 0,
      duration: this.audioElement?.duration || 0,
      repeat: this.repeat,
      shuffle: this.shuffle,
      queue: this.queue,
      queueIndex: this.queueIndex,
    };
  }

  getCurrentSong(): MusicSong | null {
    return this.currentSong;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getQueue(): MusicSong[] {
    return [...this.queue];
  }

  on<K extends keyof AudioPlayerEvents>(event: K, callback: AudioPlayerEvents[K]): void {
    this.eventListeners[event] = callback;
  }

  off<K extends keyof AudioPlayerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  destroy(): void {
    this.stopVisualization();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.equalizerNodes = [];
    this.sourceNode = null;
    this.gainNode = null;
    this.analyser = null;
    this.eventListeners = {};
  }
}

export const audioPlayerService = new AudioPlayerService();
export { AudioPlayerService, type AudioPlayerEvents, type AudioAnalyzerData, type EqualizerPreset };
