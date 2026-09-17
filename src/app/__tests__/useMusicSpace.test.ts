/**
 * useMusicSpace.test.ts
 * ====================
 * 音乐空间 Hook 三方集成单测（W2 P1）
 *
 * 测试策略：
 * - vi.mock 三方服务（audioPlayerService / emotionMusicService / useVoiceService），
 *   hook 内部逻辑（状态机、语音命令解析、情感映射、队列联动）全部真实执行
 * - 覆盖：初始化推荐、播放控制、音量/静音/随机/循环、seek、搜索与推荐透传、
 *   语音命令（具名意图优先 + 泛化兜底）、播放事件联动、可视化订阅生命周期
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { MusicEmotionProfile, MusicSong } from '../lib/music/types';

/* ------------------------------------------------------------------ */
/* 三方 mock（vi.mock 自动提升，工厂自包含）                              */
/* ------------------------------------------------------------------ */

vi.mock('../lib/music/AudioPlayerService', () => ({
  audioPlayerService: {
    on: vi.fn(),
    off: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    playSong: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleShuffle: vi.fn(),
    toggleRepeat: vi.fn(),
    seekTo: vi.fn(),
    seekToPercent: vi.fn(),
    setQueue: vi.fn(),
    setEqualizerPreset: vi.fn(),
    startVisualization: vi.fn(),
    stopVisualization: vi.fn(),
    getCurrentState: vi.fn(),
  },
}));

vi.mock('../lib/music/EmotionMusicService', () => ({
  emotionMusicService: {
    recommendByEmotion: vi.fn(),
    recommendByMood: vi.fn(),
    recommendByActivity: vi.fn(),
    searchSongs: vi.fn(),
    markAsPlayed: vi.fn(),
  },
}));

vi.mock('../hooks/useVoiceService', () => ({
  useVoiceService: vi.fn(),
}));

import { useMusicSpace } from '../hooks/useMusicSpace';
import { useVoiceService } from '../hooks/useVoiceService';
import { audioPlayerService } from '../lib/music/AudioPlayerService';
import { emotionMusicService } from '../lib/music/EmotionMusicService';

/** mock 导出被真实类型遮蔽，统一用宽松别名操作 */
const player = audioPlayerService as unknown as Record<string, Mock>;
const ems = emotionMusicService as unknown as Record<string, Mock>;
const voiceMock = useVoiceService as unknown as Mock;

/* ------------------------------------------------------------------ */
/* 夹具                                                                 */
/* ------------------------------------------------------------------ */

function makeSong(overrides: Partial<MusicSong> = {}): MusicSong {
  return {
    id: 'song-1',
    title: '测试歌曲',
    artist: '测试歌手',
    album: '测试专辑',
    albumCover: '/cover.png',
    duration: 180,
    mood: 'calm',
    energy: 'medium',
    ...overrides,
  };
}

const SONG_A = makeSong({ id: 'song-a', title: '歌A', artist: '歌手A' });
const SONG_B = makeSong({ id: 'song-b', title: '歌B', artist: '歌手B' });

function makeProfile(): MusicEmotionProfile {
  return {
    happy: 0.2,
    sad: 0.1,
    energetic: 0.2,
    calm: 0.3,
    romantic: 0.1,
    melancholy: 0.05,
    upbeat: 0.05,
    peaceful: 0.1,
  };
}

/** 捕获 useVoiceService 收到的 options（onTranscript / onEmotionDetected 由此驱动） */
let capturedVoiceOpts: {
  onTranscript?: (text: string) => void;
  onEmotionDetected?: (emotion: { type: string; confidence: number }) => void;
};

/** 跨渲染稳定的 voice 服务方法实例（hook 重渲染会重复调用 mock，需同一实例才能断言） */
let voiceFns: { startListening: Mock; stopListening: Mock };

function stubVoice() {
  voiceFns = { startListening: vi.fn(), stopListening: vi.fn() };
  voiceMock.mockImplementation((opts?: Record<string, unknown>) => {
    capturedVoiceOpts = opts as typeof capturedVoiceOpts;
    return {
      isInitialized: false,
      isListening: false,
      isSpeaking: false,
      currentEmotion: null,
      transcript: '',
      interimTranscript: '',
      error: null,
      ...voiceFns,
      speak: vi.fn().mockResolvedValue(undefined),
      stopSpeaking: vi.fn(),
      analyzeEmotion: vi.fn(),
      reset: vi.fn(),
    };
  });
}

/* ------------------------------------------------------------------ */
/* 测试                                                                 */
/* ------------------------------------------------------------------ */

describe('useMusicSpace', () => {
  beforeEach(() => {
    // vitest v4: clearAllMocks 会重置实现，逐项恢复默认行为
    vi.clearAllMocks();
    capturedVoiceOpts = {};

    player.play.mockResolvedValue(undefined);
    player.playSong.mockResolvedValue(undefined);
    player.next.mockResolvedValue(null);
    player.previous.mockResolvedValue(null);
    player.toggleMute.mockReturnValue(false);
    player.toggleShuffle.mockReturnValue(false);
    player.toggleRepeat.mockReturnValue('all');
    player.getCurrentState.mockReturnValue({});

    ems.searchSongs.mockReturnValue([]);
    ems.recommendByMood.mockReturnValue([]);
    ems.recommendByActivity.mockReturnValue([]);
    ems.recommendByEmotion.mockReturnValue({
      songs: [SONG_A, SONG_B],
      reason: '测试推荐',
      emotionProfile: makeProfile(),
      timestamp: new Date(),
    });

    stubVoice();
  });

  /* ---------- 初始化 ---------- */

  it('挂载即生成初始推荐并写入队列', () => {
    const onEmotionDetected = vi.fn();
    const { result } = renderHook(() => useMusicSpace({ onEmotionDetected }));

    expect(ems.recommendByEmotion).toHaveBeenCalledTimes(1);
    expect(ems.recommendByEmotion).toHaveBeenCalledWith(
      expect.objectContaining({ happy: 0.2, calm: 0.3 }),
      expect.objectContaining({ excludeRecent: true, limit: 10 })
    );
    expect(result.current.recommendation?.reason).toBe('测试推荐');
    expect(result.current.playerState.queue).toEqual([SONG_A, SONG_B]);
    expect(player.setQueue).toHaveBeenCalledWith([SONG_A, SONG_B]);
    expect(onEmotionDetected).toHaveBeenCalledWith(expect.objectContaining({ happy: 0.2 }));
  });

  it('订阅 6 类播放事件并启动可视化', () => {
    renderHook(() => useMusicSpace());

    const events = player.on.mock.calls.map((c) => c[0]);
    expect(events).toEqual(
      expect.arrayContaining(['onPlay', 'onPause', 'onTimeUpdate', 'onEnded', 'onLoaded', 'onError'])
    );
    expect(player.startVisualization).toHaveBeenCalledTimes(1);
    expect(player.stopVisualization).not.toHaveBeenCalled();
  });

  it('卸载时停止可视化订阅', () => {
    const { unmount } = renderHook(() => useMusicSpace());
    expect(player.stopVisualization).not.toHaveBeenCalled();
    unmount();
    expect(player.stopVisualization).toHaveBeenCalledTimes(1);
  });

  /* ---------- 播放控制 ---------- */

  it('playSong: 服务转发 + 已播标记 + 状态更新', async () => {
    const { result } = renderHook(() => useMusicSpace());

    await act(async () => {
      await result.current.playSong(SONG_A, 3);
    });

    expect(player.playSong).toHaveBeenCalledWith(SONG_A, 3);
    expect(ems.markAsPlayed).toHaveBeenCalledWith('song-a');
    expect(result.current.playerState.currentSong?.id).toBe('song-a');
    expect(result.current.playerState.isPlaying).toBe(true);
    expect(result.current.playerState.queueIndex).toBe(3);
  });

  it('pauseSong / resumeSong / seekTo / seekToPercent 透传', async () => {
    const { result } = renderHook(() => useMusicSpace());

    act(() => result.current.pauseSong());
    expect(player.pause).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.resumeSong();
    });
    expect(player.play).toHaveBeenCalledTimes(1);

    act(() => result.current.seekTo(42));
    expect(player.seekTo).toHaveBeenCalledWith(42);

    act(() => result.current.seekToPercent(25));
    expect(player.seekToPercent).toHaveBeenCalledWith(25);
  });

  it('nextSong: 有下一首 → 状态与标记联动', async () => {
    player.next.mockResolvedValue(SONG_B);
    player.getCurrentState.mockReturnValue({ queueIndex: 1 });
    const onSongChange = vi.fn();
    const { result } = renderHook(() => useMusicSpace({ onSongChange }));

    await act(async () => {
      await result.current.nextSong();
    });

    expect(result.current.playerState.currentSong?.id).toBe('song-b');
    expect(result.current.playerState.queueIndex).toBe(1);
    expect(ems.markAsPlayed).toHaveBeenCalledWith('song-b');
    expect(onSongChange).toHaveBeenCalledWith(SONG_B);
  });

  it('nextSong: 无下一首 → 状态保持', async () => {
    const { result } = renderHook(() => useMusicSpace());

    await act(async () => {
      await result.current.nextSong();
    });

    expect(result.current.playerState.currentSong).toBeNull();
  });

  it('previousSong: 返回上一首 → 状态联动且不标记已播', async () => {
    player.previous.mockResolvedValue(SONG_A);
    player.getCurrentState.mockReturnValue({ queueIndex: 0 });
    const { result } = renderHook(() => useMusicSpace());

    await act(async () => {
      await result.current.previousSong();
    });

    expect(result.current.playerState.currentSong?.id).toBe('song-a');
    expect(ems.markAsPlayed).not.toHaveBeenCalled();
  });

  /* ---------- 音量 / 模式 ---------- */

  it('setVolume 钳制 [0,1] 并转发服务', () => {
    const { result } = renderHook(() => useMusicSpace());

    act(() => result.current.setVolume(1.5));
    expect(result.current.playerState.volume).toBe(1);

    act(() => result.current.setVolume(-0.5));
    expect(result.current.playerState.volume).toBe(0);

    act(() => result.current.setVolume(0.5));
    expect(result.current.playerState.volume).toBe(0.5);
    expect(player.setVolume).toHaveBeenLastCalledWith(0.5);
  });

  it('toggleMute 透传返回值', () => {
    player.toggleMute.mockReturnValueOnce(true);
    const { result } = renderHook(() => useMusicSpace());

    let muted: boolean | undefined;
    act(() => {
      muted = result.current.toggleMute();
    });
    expect(muted).toBe(true);
  });

  it('toggleShuffle / toggleRepeat 状态联动', () => {
    player.toggleShuffle.mockReturnValue(true);
    player.toggleRepeat.mockReturnValue('one');
    const { result } = renderHook(() => useMusicSpace());

    act(() => result.current.toggleShuffle());
    expect(result.current.playerState.shuffle).toBe(true);

    act(() => result.current.toggleRepeat());
    expect(result.current.playerState.repeat).toBe('one');
  });

  it('loadPlaylist 更新队列并转发 setQueue', () => {
    const { result } = renderHook(() => useMusicSpace());

    act(() => result.current.loadPlaylist([SONG_B], 1));

    expect(player.setQueue).toHaveBeenCalledWith([SONG_B], 1);
    expect(result.current.playerState.queue).toEqual([SONG_B]);
    expect(result.current.playerState.queueIndex).toBe(1);
  });

  it('setEqualizerPreset 透传', () => {
    const { result } = renderHook(() => useMusicSpace());

    act(() => result.current.setEqualizerPreset('bass'));
    expect(player.setEqualizerPreset).toHaveBeenCalledWith('bass');
  });

  /* ---------- 语音命令 ---------- */

  it('语音: 暂停/下一首/上一首 直达播放控制', () => {
    renderHook(() => useMusicSpace());

    act(() => capturedVoiceOpts.onTranscript?.('请暂停音乐'));
    expect(player.pause).toHaveBeenCalledTimes(1);

    act(() => capturedVoiceOpts.onTranscript?.('下一首'));
    expect(player.next).toHaveBeenCalledTimes(1);

    act(() => capturedVoiceOpts.onTranscript?.('返回上一首'));
    expect(player.previous).toHaveBeenCalledTimes(1);
  });

  it('语音: 大声/小声 相对当前音量 ±0.2', () => {
    const { result } = renderHook(() => useMusicSpace());

    act(() => capturedVoiceOpts.onTranscript?.('大声'));
    expect(result.current.playerState.volume).toBeCloseTo(0.9);

    // 状态更新后重渲染，capturedVoiceOpts 已是携带最新音量的闭包
    act(() => capturedVoiceOpts.onTranscript?.('小声'));
    expect(result.current.playerState.volume).toBeCloseTo(0.7);
  });

  it('语音: 播放XX的歌 → 歌手搜索命中并播放（早退无双触发）', async () => {
    ems.searchSongs.mockReturnValue([SONG_A]);
    renderHook(() => useMusicSpace());

    await act(async () => {
      capturedVoiceOpts.onTranscript?.('播放歌手甲的歌');
    });

    expect(ems.searchSongs).toHaveBeenCalledWith('歌手甲');
    expect(player.playSong).toHaveBeenCalledWith(SONG_A, undefined);
    expect(ems.markAsPlayed).toHaveBeenCalledWith('song-a');
    expect(player.play).not.toHaveBeenCalled();
  });

  it('语音: 歌手搜索无结果 → 回落泛化播放', () => {
    ems.searchSongs.mockReturnValue([]);
    renderHook(() => useMusicSpace());

    act(() => capturedVoiceOpts.onTranscript?.('播放歌手甲的歌'));

    expect(player.play).toHaveBeenCalledTimes(1);
    expect(player.playSong).not.toHaveBeenCalled();
  });

  it('语音: 我想听安静的音乐 → calm 推荐并播放', async () => {
    ems.recommendByMood.mockReturnValue([SONG_B]);
    renderHook(() => useMusicSpace());

    await act(async () => {
      capturedVoiceOpts.onTranscript?.('我想听安静的音乐');
    });

    expect(ems.recommendByMood).toHaveBeenCalledWith('calm');
    expect(player.playSong).toHaveBeenCalledWith(SONG_B, undefined);
    expect(ems.markAsPlayed).toHaveBeenCalledWith('song-b');
  });

  it('语音: 无匹配命令 → 静默', () => {
    renderHook(() => useMusicSpace());

    act(() => capturedVoiceOpts.onTranscript?.('今天天气不错'));

    expect(player.play).not.toHaveBeenCalled();
    expect(player.pause).not.toHaveBeenCalled();
    expect(player.next).not.toHaveBeenCalled();
    expect(player.previous).not.toHaveBeenCalled();
    expect(player.playSong).not.toHaveBeenCalled();
  });

  /* ---------- 语音控制开关 ---------- */

  it('startVoiceControl / stopVoiceControl 切换监听态', () => {
    const { result } = renderHook(() => useMusicSpace());
    expect(result.current.isListening).toBe(false);

    act(() => result.current.startVoiceControl());
    expect(result.current.isListening).toBe(true);
    expect(voiceFns.startListening).toHaveBeenCalledTimes(1);

    act(() => result.current.stopVoiceControl());
    expect(result.current.isListening).toBe(false);
    expect(voiceFns.stopListening).toHaveBeenCalledTimes(1);
  });

  /* ---------- 情感映射 ---------- */

  it('情感回调: 6 类情绪映射执行归一化且不抛错', () => {
    renderHook(() => useMusicSpace());

    const cases = [
      { type: 'happy', confidence: 1 },
      { type: 'angry', confidence: 0.8 },
      { type: 'fearful', confidence: 0.6 },
      { type: 'surprised', confidence: 0.4 },
      { type: 'neutral', confidence: 0.2 },
      { type: 'mystery', confidence: 0.5 }, // 未知类型 → calm 兜底
    ];

    for (const c of cases) {
      expect(() =>
        act(() =>
          capturedVoiceOpts.onEmotionDetected?.({
            ...c,
            audioFeatures: { pitch: 0, energy: 0, variation: 0 },
          } as never)
        )
      ).not.toThrow();
    }
  });

  /* ---------- 播放事件联动 ---------- */

  it('播放事件: onPlay/onPause/onTimeUpdate/onLoaded/onError 驱动状态', () => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    player.on.mockImplementation((event: unknown, cb: unknown) => {
      handlers.set(event as string, cb as (...args: unknown[]) => void);
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    const onSongChange = vi.fn();
    const { result } = renderHook(() => useMusicSpace({ onSongChange }));

    act(() => handlers.get('onPlay')?.());
    expect(result.current.playerState.isPlaying).toBe(true);

    act(() => handlers.get('onPause')?.());
    expect(result.current.playerState.isPlaying).toBe(false);

    act(() => handlers.get('onTimeUpdate')?.(30, 200));
    expect(result.current.playerState.progress).toBe(30);
    expect(result.current.playerState.duration).toBe(200);

    act(() => handlers.get('onLoaded')?.(SONG_A));
    expect(result.current.playerState.currentSong?.id).toBe('song-a');
    expect(onSongChange).toHaveBeenCalledWith(SONG_A);

    expect(() => handlers.get('onError')?.(new Error('boom'))).not.toThrow();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('onEnded: repeat=off → nextSong；repeat=one → 重播（repeatRef 实时读取）', async () => {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    player.on.mockImplementation((event: unknown, cb: unknown) => {
      handlers.set(event as string, cb as (...args: unknown[]) => unknown);
    });
    player.toggleRepeat.mockReturnValue('one');
    const { result } = renderHook(() => useMusicSpace());

    // 默认 repeat='off' → 推进下一首
    const onEnded = handlers.get('onEnded');
    await act(async () => {
      await onEnded?.();
    });
    expect(player.next).toHaveBeenCalledTimes(1);

    // 切 repeat='one' → 同一闭包经 repeatRef 读到最新值，单曲循环生效
    act(() => result.current.toggleRepeat());
    expect(result.current.playerState.repeat).toBe('one');

    await act(async () => {
      await onEnded?.();
    });
    expect(player.next).toHaveBeenCalledTimes(1); // 未再推进
    expect(player.play).toHaveBeenCalledTimes(1); // 单曲重播
  });

  /* ---------- 推荐透传 ---------- */

  it('searchSongs / recommendByMood / recommendByActivity 透传', () => {
    ems.searchSongs.mockReturnValue([SONG_A]);
    ems.recommendByMood.mockReturnValue([SONG_B]);
    ems.recommendByActivity.mockReturnValue([SONG_A, SONG_B]);

    const { result } = renderHook(() => useMusicSpace());

    expect(result.current.searchSongs('关键词')).toEqual([SONG_A]);
    expect(ems.searchSongs).toHaveBeenCalledWith('关键词');
    expect(result.current.recommendByMood('happy')).toEqual([SONG_B]);
    expect(result.current.recommendByActivity('focus')).toEqual([SONG_A, SONG_B]);
  });
});
