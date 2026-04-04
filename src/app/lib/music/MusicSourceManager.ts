/**
 * @file 音乐源管理器
 * @description 统一管理多种音乐来源：在线API、本地文件、AI生成
 * @author YYC³ Team
 * @version 1.0.0
 */

import type { MusicSong } from './types';

type MusicSourceType = 'local' | 'online' | 'ai-generated' | 'streaming';

interface MusicSource {
  id: string;
  name: string;
  type: MusicSourceType;
  enabled: boolean;
  priority: number;
  icon: string;
}

interface OnlineMusicProvider {
  name: string;
  apiEndpoint: string;
  requiresAuth: boolean;
  searchEnabled: boolean;
  streamEnabled: boolean;
}

interface LocalMusicFile {
  id: string;
  file: File;
  name: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl?: string;
  audioUrl: string;
}

const ONLINE_PROVIDERS: OnlineMusicProvider[] = [
  {
    name: 'NeteaseCloud',
    apiEndpoint: 'https://music.163.com/api',
    requiresAuth: true,
    searchEnabled: true,
    streamEnabled: true,
  },
  {
    name: 'QQMusic',
    apiEndpoint: 'https://c.y.qq.com/v8/fcg-bin',
    requiresAuth: true,
    searchEnabled: true,
    streamEnabled: false,
  },
  {
    name: 'KuGou',
    apiEndpoint: 'https://mobileservice.kugou.com/api/v3',
    requiresAuth: false,
    searchEnabled: true,
    streamEnabled: true,
  },
  {
    name: 'YouTube',
    apiEndpoint: 'https://www.youtube.com/api',
    requiresAuth: true,
    searchEnabled: true,
    streamEnabled: true,
  },
  {
    name: 'SoundCloud',
    apiEndpoint: 'https://api.soundcloud.com',
    requiresAuth: true,
    searchEnabled: true,
    streamEnabled: true,
  },
  {
    name: 'Spotify',
    apiEndpoint: 'https://api.spotify.com/v1',
    requiresAuth: true,
    searchEnabled: true,
    streamEnabled: true,
  },
];

const DEFAULT_SOURCES: MusicSource[] = [
  { id: 'local', name: '本地音乐', type: 'local', enabled: true, priority: 1, icon: '📁' },
  { id: 'online', name: '在线搜索', type: 'online', enabled: true, priority: 2, icon: '🌐' },
  { id: 'ai', name: 'AI创作', type: 'ai-generated', enabled: true, priority: 3, icon: '🤖' },
  { id: 'streaming', name: '流媒体', type: 'streaming', enabled: false, priority: 4, icon: '📡' },
];

class MusicSourceManager {
  private sources: MusicSource[] = DEFAULT_SOURCES;
  private localFiles: Map<string, LocalMusicFile> = new Map();

  constructor() {
    this.loadLocalFilesFromStorage();
  }

  getSources(): MusicSource[] {
    return [...this.sources];
  }

  getOnlineProviders(): OnlineMusicProvider[] {
    return ONLINE_PROVIDERS;
  }

  enableSource(sourceId: string): void {
    const source = this.sources.find((s) => s.id === sourceId);
    if (source) {
      source.enabled = true;
    }
  }

  disableSource(sourceId: string): void {
    const source = this.sources.find((s) => s.id === sourceId);
    if (source) {
      source.enabled = false;
    }
  }

  async uploadLocalFile(file: File): Promise<LocalMusicFile> {
    const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const metadata = await this.extractMetadata(file);

    const localFile: LocalMusicFile = {
      id,
      file,
      name: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: metadata.artist || '未知艺术家',
      album: metadata.album || '本地音乐',
      duration: metadata.duration || 0,
      coverUrl: metadata.cover,
      audioUrl: URL.createObjectURL(file),
    };

    this.localFiles.set(id, localFile);
    this.saveLocalFilesToStorage();

    return localFile;
  }

  private async extractMetadata(file: File): Promise<{
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    cover?: string;
  }> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);

      audio.onloadedmetadata = () => {
        resolve({
          duration: audio.duration,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
        URL.revokeObjectURL(audio.src);
      };

      audio.onerror = () => {
        resolve({
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      };
    });
  }

  getLocalFiles(): LocalMusicFile[] {
    return Array.from(this.localFiles.values());
  }

  getLocalFile(id: string): LocalMusicFile | undefined {
    return this.localFiles.get(id);
  }

  deleteLocalFile(id: string): void {
    const file = this.localFiles.get(id);
    if (file) {
      URL.revokeObjectURL(file.audioUrl);
      this.localFiles.delete(id);
      this.saveLocalFilesToStorage();
    }
  }

  private saveLocalFilesToStorage(): void {
    try {
      const fileIds = Array.from(this.localFiles.keys());
      localStorage.setItem('yyc3_music_local_files', JSON.stringify(fileIds));
    } catch (error) {
      console.error('Failed to save local files to storage:', error);
    }
  }

  private loadLocalFilesFromStorage(): void {
    try {
      const stored = localStorage.getItem('yyc3_music_local_files');
      if (stored) {
        JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load local files from storage:', error);
    }
  }

  async searchOnline(query: string, provider?: string): Promise<MusicSong[]> {
    const results: MusicSong[] = [];

    if (!provider || provider === 'demo') {
      const demoResults = await this.searchDemoApi(query);
      results.push(...demoResults);
    }

    return results;
  }

  private async searchDemoApi(query: string): Promise<MusicSong[]> {
    const demoSongs: MusicSong[] = [
      {
        id: 'demo-1',
        title: `${query} - Demo Track 1`,
        artist: 'YYC³ Demo',
        album: 'Demo Collection',
        albumCover: 'https://via.placeholder.com/300',
        duration: 180,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        genre: 'Demo',
        bpm: 120,
        energy: 'medium',
        mood: 'happy',
      },
      {
        id: 'demo-2',
        title: `${query} - Demo Track 2`,
        artist: 'YYC³ Demo',
        album: 'Demo Collection',
        albumCover: 'https://via.placeholder.com/300',
        duration: 210,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        genre: 'Demo',
        bpm: 100,
        energy: 'low',
        mood: 'calm',
      },
    ];

    return demoSongs;
  }

  async searchFreeMusicArchive(query: string): Promise<MusicSong[]> {
    try {
      const response = await fetch(
        `https://freemusicarchive.org/api/trackSearch?q=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) {
        throw new Error('FMA API request failed');
      }

      return [];
    } catch (error) {
      console.error('Free Music Archive search failed:', error);
      return [];
    }
  }

  async searchJamendo(query: string): Promise<MusicSong[]> {
    try {
      const clientId = 'your-jamendo-client-id';
      const response = await fetch(
        `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&search=${encodeURIComponent(query)}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Jamendo API request failed');
      }

      const data = await response.json();

      return data.results?.map((track: any) => ({
        id: `jamendo-${track.id}`,
        title: track.name,
        artist: track.artist_name,
        album: track.album_name,
        albumCover: track.album_image,
        duration: track.duration,
        audioUrl: track.audio,
        genre: track.musicinfo?.tags?.genres?.[0],
        mood: this.mapJamendoMood(track.musicinfo?.vocalinstrumental),
      })) || [];
    } catch (error) {
      console.error('Jamendo search failed:', error);
      return [];
    }
  }

  private mapJamendoMood(type: string): MusicSong['mood'] {
    const moodMap: Record<string, MusicSong['mood']> = {
      instrumental: 'calm',
      vocal: 'romantic',
    };
    return moodMap[type] || 'calm';
  }

  localFileToSong(localFile: LocalMusicFile): MusicSong {
    return {
      id: localFile.id,
      title: localFile.name,
      artist: localFile.artist,
      album: localFile.album,
      albumCover: localFile.coverUrl || 'https://via.placeholder.com/300',
      duration: localFile.duration,
      audioUrl: localFile.audioUrl,
      genre: 'Local',
      mood: 'calm',
    };
  }

  getAllAvailableSongs(): MusicSong[] {
    const songs: MusicSong[] = [];

    for (const localFile of this.localFiles.values()) {
      songs.push(this.localFileToSong(localFile));
    }

    return songs;
  }

  async generateAIMusic(params: {
    prompt: string;
    style?: string;
    duration?: number;
    mood?: string;
  }): Promise<MusicSong | null> {
    try {
      console.log('AI Music Generation params:', params);

      const aiSong: MusicSong = {
        id: `ai-${Date.now()}`,
        title: `AI Generated: ${params.prompt.slice(0, 30)}...`,
        artist: 'YYC³ AI Composer',
        album: 'AI Creations',
        albumCover: 'https://via.placeholder.com/300?text=AI+Music',
        duration: params.duration || 60,
        audioUrl: '',
        genre: params.style || 'Electronic',
        mood: (params.mood as MusicSong['mood']) || 'calm',
      };

      return aiSong;
    } catch (error) {
      console.error('AI music generation failed:', error);
      return null;
    }
  }

  getStreamingUrl(songId: string, provider: string): string | null {
    console.log(`Getting streaming URL for ${songId} from ${provider}`);
    return null;
  }

  clearAllLocalFiles(): void {
    for (const file of this.localFiles.values()) {
      URL.revokeObjectURL(file.audioUrl);
    }
    this.localFiles.clear();
    this.saveLocalFilesToStorage();
  }

  getStorageUsage(): { count: number; estimatedSize: string } {
    const count = this.localFiles.size;
    const estimatedSize = `${count} files`;
    return { count, estimatedSize };
  }
}

export const musicSourceManager = new MusicSourceManager();
export {
  MusicSourceManager,
  type MusicSource,
  type MusicSourceType,
  type OnlineMusicProvider,
  type LocalMusicFile,
};
