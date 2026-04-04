/**
 * @file VoiceControlPage.tsx
 * @description YYC³ 语音控制中心页面
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import React from 'react';
import { Mic, Music2, Brain, Settings } from 'lucide-react';
import { FamilyVoicePanel, DMusicVoiceControl } from './voice';

export const VoiceControlPage: React.FC = () => {
  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Mic className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-medium text-white/90">语音控制中心</h1>
            <p className="text-sm text-white/40">YYC³ Voice Control Center</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>AI Family 语音系统</span>
            </div>
            <FamilyVoicePanel />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
              <Music2 className="w-4 h-4 text-cyan-400" />
              <span>D-Music 语音控制</span>
            </div>
            <DMusicVoiceControl />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/60">使用说明</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-white/40">
            <div>
              <div className="text-white/60 mb-1">AI Family 语音系统</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>点击麦克风图标开始语音对话</li>
                <li>调整每位家人的音高、语速、音量</li>
                <li>点击播放按钮预览家人语音</li>
                <li>实时情感检测与可视化</li>
              </ul>
            </div>
            <div>
              <div className="text-white/60 mb-1">D-Music 语音控制</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>支持语音指令：播放、暂停、下一首...</li>
                <li>情感同步：根据语音情感推荐音乐</li>
                <li>点击情感标签快速切换推荐风格</li>
                <li>实时音频波形可视化</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControlPage;
