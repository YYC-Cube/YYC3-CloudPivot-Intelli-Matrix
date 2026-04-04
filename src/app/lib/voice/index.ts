/**
 * @file index.ts
 * @description YYC³ 统一语音服务模块导出
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

// Core
export * from './core';

// Adapters
export { WakeWordDetector, CommandRouter, FamilyVoiceAdapter, MusicVoiceAdapter } from './adapters';
export type { WakeWordResult, CommandMatch, VoiceAdapterConfig, ConversationMessage } from './adapters';

// Profiles
export { getFamilyVoiceProfile, getFamilyVoiceProfiles, DEFAULT_FAMILY_PROFILE } from './profiles';
export { getMusicVoiceProfile, getMusicVoiceProfiles, DEFAULT_MUSIC_PROFILE, MUSIC_VOICE_COMMANDS } from './profiles';
export type { FamilyVoiceProfile, MusicVoiceProfile } from './profiles';

// Visualization
export { EmotionVisualizer, VoiceWaveform } from './visualization';
export type { VisualizationConfig, EmotionHistoryEntry, VisualizationState } from './visualization';
export { EMOTION_VISUALIZER_COLORS, DEFAULT_WAVEFORM_CONFIG, DEFAULT_EMOTION_VISUALIZER_CONFIG } from './visualization';

// Creation
export { VoiceCreator } from './creation';
export type { LyricsTemplate, LyricsGenerationOptions, GeneratedLyrics, VoiceCreationSession } from './creation';
export { LYRICS_TEMPLATES, EMOTION_KEYWORDS } from './creation';

// Emotion
export { MusicEmotionAnalyzer } from './emotion';
export type { MusicFeatures, MusicEmotionResult, PlaylistAnalysis, MusicEmotionMapping } from './emotion';
export { MUSIC_EMOTION_MAPPINGS } from './emotion';

// Integration
export { DMusicIntegration } from './integration';
export type {
  DMusicEmotion,
  DMusicTrack,
  DMusicPlayerState,
  DMusicPlayerActions,
  DMusicIntegrationConfig,
  DMusicVoiceCommand,
} from './integration';
export { EMOTION_TO_DMUSIC, DMUSIC_VOICE_COMMANDS_ZH, DMUSIC_VOICE_COMMANDS_EN, DMUSIC_EMOTION_PALETTES } from './integration';
