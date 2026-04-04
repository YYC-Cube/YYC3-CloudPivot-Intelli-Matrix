/**
 * @file VoiceCreator.ts
 * @description YYC³ 语音创作工具
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';
import type {
  LyricsTemplate,
  LyricsGenerationOptions,
  GeneratedLyrics,
  VoiceCreationSession,
} from './types';
import { LYRICS_TEMPLATES, EMOTION_KEYWORDS } from './types';

export class VoiceCreator {
  private sessions: Map<string, VoiceCreationSession> = new Map();
  private currentSession: VoiceCreationSession | null = null;

  createSession(type: VoiceCreationSession['type'] = 'lyrics'): VoiceCreationSession {
    const session: VoiceCreationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'idle',
      createdAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;
    return session;
  }

  getSession(sessionId: string): VoiceCreationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getCurrentSession(): VoiceCreationSession | null {
    return this.currentSession;
  }

  getTemplates(): LyricsTemplate[] {
    return LYRICS_TEMPLATES;
  }

  getTemplatesByGenre(genre: LyricsTemplate['genre']): LyricsTemplate[] {
    return LYRICS_TEMPLATES.filter((t) => t.genre === genre);
  }

  getTemplatesByEmotion(emotion: EmotionType): LyricsTemplate[] {
    return LYRICS_TEMPLATES.filter((t) => t.emotion === emotion);
  }

  generateLyrics(options: LyricsGenerationOptions): GeneratedLyrics {
    const emotion = options.emotion || 'neutral';
    const genre = options.genre || 'pop';
    const language = options.language || 'zh';

    const keywords = EMOTION_KEYWORDS[emotion];
    const theme = options.theme || keywords[0];

    const lyrics: GeneratedLyrics = {
      id: `lyrics-${Date.now()}`,
      title: this.generateTitle(theme, emotion, language),
      content: {
        verse: [],
        chorus: options.includeChorus ? [] : undefined,
      },
      emotion,
      genre,
      createdAt: Date.now(),
    };

    for (let i = 0; i < options.verses; i++) {
      lyrics.content.verse.push(this.generateVerse(theme, emotion, language, i + 1));
    }

    if (options.includeChorus) {
      lyrics.content.chorus = [this.generateChorus(theme, emotion, language)];
    }

    if (genre === 'ballad' || genre === 'pop') {
      lyrics.content.bridge = [this.generateBridge(theme, emotion, language)];
    }

    return lyrics;
  }

  private generateTitle(theme: string, emotion: EmotionType, language: string): string {
    const titles: Record<EmotionType, { zh: string[]; en: string[] }> = {
      happy: {
        zh: ['阳光下的', '甜蜜时光', '幸福旋律', '快乐节拍'],
        en: ['Sunshine', 'Sweet Time', 'Happy Melody', 'Joyful Beat'],
      },
      sad: {
        zh: ['雨夜', '离别之歌', '孤独的', '回忆'],
        en: ['Rainy Night', 'Farewell', 'Lonely', 'Memories'],
      },
      angry: {
        zh: ['燃烧', '反抗', '破晓', '冲击'],
        en: ['Burning', 'Rebellion', 'Dawn', 'Impact'],
      },
      fear: {
        zh: ['深渊', '黑暗中', '迷失', '警告'],
        en: ['Abyss', 'In Darkness', 'Lost', 'Warning'],
      },
      surprise: {
        zh: ['奇迹', '意外', '震撼', '发现'],
        en: ['Miracle', 'Unexpected', 'Shocking', 'Discovery'],
      },
      disgust: {
        zh: ['面具', '真相', '揭露', '虚伪'],
        en: ['Mask', 'Truth', 'Reveal', 'Fake'],
      },
      neutral: {
        zh: ['远方', '旅程', '时光', '故事'],
        en: ['Distance', 'Journey', 'Time', 'Story'],
      },
    };

    const emotionTitles = titles[emotion];
    const titleList = language === 'zh' ? emotionTitles.zh : emotionTitles.en;
    const baseTitle = titleList[Math.floor(Math.random() * titleList.length)];

    return language === 'zh' ? `${baseTitle}${theme}` : `${baseTitle} ${theme}`;
  }

  private generateVerse(theme: string, emotion: EmotionType, language: string, verseNum: number): string {
    const keywords = EMOTION_KEYWORDS[emotion];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    if (language === 'zh') {
      const verseTemplates = [
        `第${verseNum}段：${theme}的${keyword}，在心中轻轻回响`,
        `${theme}如${keyword}般，照亮了前行的路`,
        `当${keyword}遇见${theme}，故事便开始了`,
        `${theme}中的${keyword}，是最美的风景`,
      ];
      return verseTemplates[Math.floor(Math.random() * verseTemplates.length)];
    }

    const verseTemplatesEn = [
      `Verse ${verseNum}: ${theme}'s ${keyword}, echoing in the heart`,
      `${theme} like ${keyword}, lighting up the path ahead`,
      `When ${keyword} meets ${theme}, the story begins`,
      `The ${keyword} in ${theme}, the most beautiful scenery`,
    ];
    return verseTemplatesEn[Math.floor(Math.random() * verseTemplatesEn.length)];
  }

  private generateChorus(theme: string, emotion: EmotionType, language: string): string {
    const keywords = EMOTION_KEYWORDS[emotion];
    const keyword1 = keywords[Math.floor(Math.random() * keywords.length)];
    const keyword2 = keywords[Math.floor(Math.random() * keywords.length)];

    if (language === 'zh') {
      return `副歌：${theme} ${keyword1} ${keyword2}\n让我们一起唱响这首歌\n${theme}永远在心中`;
    }

    return `Chorus: ${theme} ${keyword1} ${keyword2}\nLet's sing this song together\n${theme} forever in our hearts`;
  }

  private generateBridge(theme: string, emotion: EmotionType, language: string): string {
    const keywords = EMOTION_KEYWORDS[emotion];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];

    if (language === 'zh') {
      return `桥段：当${keyword}来临，${theme}会带我们走向远方`;
    }

    return `Bridge: When ${keyword} comes, ${theme} will lead us far away`;
  }

  analyzeTextEmotion(text: string): EmotionType {
    let maxScore = 0;
    let detectedEmotion: EmotionType = 'neutral';

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        detectedEmotion = emotion as EmotionType;
      }
    }

    return detectedEmotion;
  }

  suggestTemplate(text: string): LyricsTemplate {
    const emotion = this.analyzeTextEmotion(text);
    const templates = this.getTemplatesByEmotion(emotion);
    return templates[0] || LYRICS_TEMPLATES[0];
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      if (this.currentSession?.id === sessionId) {
        this.currentSession = null;
      }
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }
  }

  clearSessions(): void {
    this.sessions.clear();
    this.currentSession = null;
  }
}

export default VoiceCreator;
