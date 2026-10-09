/**
 * @file NAS 音乐库 API 客户端
 * @description 对接自建的 music-api（NAS 容器，读流复制备库 + 写转发主库）
 *              开发态经 Vite 代理 /api/music → http://100.65.172.88:3113；
 *              生产构建用 VITE_MUSIC_API_BASE 指到 Tailscale 地址（缺省回退相对路径）
 * @author YYC³ Team
 * @version 1.0.0
 */

import type { MusicSong } from './types';

/** music-api 返回的专辑结构 */
export interface MusicApiAlbum {
  id: string;
  title: string;
  artist: string;
  trackCount: number;
  duration: number;
  cover: string;
}

/** music-api 返回的曲目结构 */
export interface MusicApiTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileSize: string;
  format: string;
  playCount: number;
  cover: string;
  tags: string[] | null;
}

export interface MusicApiHealth {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  mediaReady: boolean;
  uptime: number;
}

const DEFAULT_BASE = '/api/music';

function resolveBase(): string {
  const fromEnv = import.meta.env.VITE_MUSIC_API_BASE as string | undefined;
  return (fromEnv && fromEnv.trim().length > 0 ? fromEnv.trim() : DEFAULT_BASE).replace(/\/$/, '');
}

async function requestJson<T>(path: string, init?: Parameters<typeof fetch>[1]): Promise<T> {
  const res = await fetch(`${resolveBase()}${path}`, {
    headers: { Accept: 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`music-api ${res.status}: ${path}`);
  }
  return (await res.json()) as T;
}

/** 曲目流式播放地址（audio 元素直接可用，支持 Range 206 边下边播） */
export function musicStreamUrl(trackId: string): string {
  return `${resolveBase()}/stream/${encodeURIComponent(trackId)}`;
}

export async function fetchMusicHealth(): Promise<MusicApiHealth> {
  return requestJson<MusicApiHealth>('/healthz');
}

export async function fetchMusicAlbums(): Promise<MusicApiAlbum[]> {
  const body = await requestJson<{ data: MusicApiAlbum[] }>('/albums');
  return body.data;
}

export async function fetchMusicTracks(params: { album?: string; q?: string } = {}): Promise<MusicApiTrack[]> {
  const search = new URLSearchParams();
  if (params.album) {
    search.set('album', params.album);
  }
  if (params.q) {
    search.set('q', params.q);
  }
  const qs = search.toString();
  const body = await requestJson<{ data: MusicApiTrack[] }>(`/tracks${qs ? `?${qs}` : ''}`);
  return body.data;
}

/** 上报播放计数（写转发主库，主库离线时服务端返回 503，此处静默降级） */
export async function reportTrackPlayed(trackId: string): Promise<number | null> {
  try {
    const body = await requestJson<{ data: { playCount: number } }>(
      `/tracks/${encodeURIComponent(trackId)}/play`,
      { method: 'POST' }
    );
    return body.data.playCount;
  } catch (error) {
    console.warn('[MusicApiService] reportTrackPlayed degraded:', error);
    return null;
  }
}

/** music-api 曲目 → 音乐空间统一歌曲模型 */
export function mapTrackToSong(track: MusicApiTrack): MusicSong {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    albumCover: track.cover || '/images/default-cover.jpg',
    duration: track.duration,
    audioUrl: musicStreamUrl(track.id),
    genre: track.format,
    isOriginal: true,
    copyright: 'YYC³ 私有曲库',
  };
}
