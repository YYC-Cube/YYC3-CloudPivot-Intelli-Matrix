// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  musicStreamUrl,
  fetchMusicHealth,
  fetchMusicAlbums,
  fetchMusicTracks,
  reportTrackPlayed,
  mapTrackToSong,
  type MusicApiTrack,
} from '../lib/music/MusicApiService';

const TRACK: MusicApiTrack = {
  id: 'f7b168c1-60a8-4d3b-962d-ac3d6372504e',
  title: '时光',
  artist: '沫言 & 沫语',
  album: '沫语·沫言',
  duration: 189,
  fileSize: '4361421',
  format: 'mp3',
  playCount: 3,
  cover: '/images/default-cover.jpg',
  tags: null,
};

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

describe('MusicApiService', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('musicStreamUrl 生成流式地址并对 id 做编码', () => {
    const url = musicStreamUrl('abc/123');
    expect(url).toBe('/api/music/stream/abc%2F123');
  });

  it('fetchMusicHealth 解析健康状态', async () => {
    mockFetchOnce({ status: 'ok', db: 'up', mediaReady: true, uptime: 15 });
    const health = await fetchMusicHealth();
    expect(health.db).toBe('up');
    expect(health.mediaReady).toBe(true);
  });

  it('fetchMusicAlbums 返回 data 数组', async () => {
    mockFetchOnce({ data: [{ id: '1', title: '沫语·沫言', artist: '沫言 & 沫语', trackCount: 3, duration: 577, cover: '' }] });
    const albums = await fetchMusicAlbums();
    expect(albums).toHaveLength(1);
    expect(albums[0].title).toBe('沫语·沫言');
  });

  it('fetchMusicTracks 带 album 参数并做 URL 编码', async () => {
    mockFetchOnce({ data: [TRACK] });
    await fetchMusicTracks({ album: '沫语·沫言' });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('album=');
    expect(calledUrl).toContain(encodeURIComponent('沫语·沫言'));
  });

  it('fetchMusicTracks 带 q 搜索参数', async () => {
    mockFetchOnce({ data: [TRACK] });
    const tracks = await fetchMusicTracks({ q: '时光' });
    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=');
    expect(calledUrl).toContain(encodeURIComponent('时光'));
    expect(tracks[0].id).toBe(TRACK.id);
  });

  it('reportTrackPlayed POST 成功返回 playCount', async () => {
    mockFetchOnce({ data: { playCount: 4 } });
    const count = await reportTrackPlayed(TRACK.id);
    expect(count).toBe(4);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, { method?: string }];
    expect(url).toContain(`/tracks/${TRACK.id}/play`);
    expect(init.method).toBe('POST');
  });

  it('reportTrackPlayed 服务端 503 时静默降级返回 null', async () => {
    mockFetchOnce({}, false, 503);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const count = await reportTrackPlayed(TRACK.id);
    expect(count).toBeNull();
    warnSpy.mockRestore();
  });

  it('mapTrackToSong 映射为 MusicSong 且 audioUrl 指向流接口', () => {
    const song = mapTrackToSong(TRACK);
    expect(song.id).toBe(TRACK.id);
    expect(song.title).toBe('时光');
    expect(song.artist).toBe('沫言 & 沫语');
    expect(song.album).toBe('沫语·沫言');
    expect(song.duration).toBe(189);
    expect(song.audioUrl).toBe(`/api/music/stream/${TRACK.id}`);
    expect(song.isOriginal).toBe(true);
  });
});
