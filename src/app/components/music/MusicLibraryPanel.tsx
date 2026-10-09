/**
 * @file NAS 曲库面板
 * @description 对接 music-api 的曲库浏览：专辑网格 + 曲目列表 + 播放上报
 * @author YYC³ Team
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, RefreshCw, Search, Disc3, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import type { MusicSong } from '../../lib/music/types';
import {
  fetchMusicAlbums,
  fetchMusicTracks,
  fetchMusicHealth,
  mapTrackToSong,
  reportTrackPlayed,
  type MusicApiAlbum,
  type MusicApiTrack,
} from '../../lib/music/MusicApiService';

interface MusicLibraryPanelProps {
  /** 播放曲目：全量入队、从 index 起播，并上报 play_count */
  onSongsPlay: (songs: MusicSong[], startIndex: number, playedTrackId: string) => void;
}

type ConnState = 'loading' | 'online' | 'degraded' | 'offline';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const MusicLibraryPanel: React.FC<MusicLibraryPanelProps> = ({ onSongsPlay }) => {
  const [connState, setConnState] = useState<ConnState>('loading');
  const [albums, setAlbums] = useState<MusicApiAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MusicApiTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicApiTrack[] | null>(null);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlbums = useCallback(async () => {
    setConnState('loading');
    setError(null);
    try {
      const [health, albumList] = await Promise.all([fetchMusicHealth(), fetchMusicAlbums()]);
      setAlbums(albumList);
      setConnState(health.status === 'ok' && health.db === 'up' ? 'online' : 'degraded');
    } catch (e) {
      setConnState('offline');
      setError(e instanceof Error ? e.message : 'music-api 不可达');
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const openAlbum = useCallback(async (albumTitle: string) => {
    setSelectedAlbum(albumTitle);
    setSearchResults(null);
    setSearchQuery('');
    setLoadingTracks(true);
    try {
      setTracks(await fetchMusicTracks({ album: albumTitle }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '曲目加载失败');
    } finally {
      setLoadingTracks(false);
    }
  }, []);

  const runSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      return;
    }
    setSelectedAlbum(null);
    setLoadingTracks(true);
    try {
      setSearchResults(await fetchMusicTracks({ q }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '搜索失败');
    } finally {
      setLoadingTracks(false);
    }
  }, [searchQuery]);

  const playTrack = useCallback(
    (list: MusicApiTrack[], index: number) => {
      const songs = list.map(mapTrackToSong);
      const played = list[index];
      onSongsPlay(songs, index, played.id);
      void reportTrackPlayed(played.id);
    },
    [onSongsPlay]
  );

  const activeList = searchResults ?? (selectedAlbum ? tracks : null);
  const listTitle = searchResults
    ? `搜索「${searchQuery.trim()}」· ${searchResults.length} 首`
    : selectedAlbum;

  return (
    <div className="space-y-4">
      {/* 状态栏 */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
        {connState === 'online' && (
          <>
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400">NAS 曲库已连接（music-api 正常）</span>
          </>
        )}
        {connState === 'degraded' && (
          <>
            <Wifi className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">曲库可用，写功能降级（主库离线）</span>
          </>
        )}
        {connState === 'offline' && (
          <>
            <WifiOff className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">music-api 不可达，请确认 Tailscale 与 NAS 容器</span>
          </>
        )}
        {connState === 'loading' && (
          <>
            <RefreshCw className="w-4 h-4 text-white/40 animate-spin" />
            <span className="text-sm text-white/40">正在连接 NAS 曲库…</span>
          </>
        )}
        <button
          onClick={loadAlbums}
          className="ml-auto p-2 rounded-lg bg-white/5 text-white/50 hover:text-cyan-400 hover:bg-white/10 transition-colors"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 ${connState === 'loading' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 搜索 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="搜索曲库中的歌曲、歌手、专辑..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          onClick={runSearch}
          className="px-6 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 transition-colors"
        >
          搜索
        </button>
      </div>

      {/* 专辑网格 */}
      {!selectedAlbum && !searchResults && albums.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => openAlbum(album.title)}
              className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all text-left"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-white/5 flex items-center justify-center">
                <Disc3 className="w-16 h-16 text-white/20 group-hover:text-cyan-500/60 transition-colors" />
              </div>
              <p className="text-white/90 text-sm truncate">{album.title}</p>
              <p className="text-white/40 text-xs truncate">
                {album.artist} · {album.trackCount} 首
              </p>
            </button>
          ))}
        </div>
      )}

      {/* 曲目列表 */}
      {activeList && (
        <motion.div
          key={listTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-white/70 text-sm">{listTitle}</h3>
            <button
              onClick={() => {
                setSelectedAlbum(null);
                setSearchResults(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              ← 返回专辑
            </button>
          </div>
          {loadingTracks ? (
            <div className="py-10 text-center text-white/30 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2" />
              加载中…
            </div>
          ) : activeList.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">暂无曲目</div>
          ) : (
            activeList.map((track, index) => (
              <button
                key={track.id}
                onClick={() => playTrack(activeList, index)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all text-left"
              >
                <span className="text-white/30 text-sm w-6 text-right">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm truncate">{track.title}</p>
                  <p className="text-white/40 text-xs truncate">
                    {track.artist} · {track.album} · {track.format.toUpperCase()}
                  </p>
                </div>
                <span className="text-white/30 text-xs">{track.playCount} 次播放</span>
                <span className="text-white/30 text-xs tabular-nums">{formatTime(track.duration)}</span>
                <Play className="w-4 h-4 text-cyan-400 shrink-0" />
              </button>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MusicLibraryPanel;
