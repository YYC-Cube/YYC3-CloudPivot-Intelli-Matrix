/**
 * @file ModelSelector.tsx
 * @description 通用模型选择器组件
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import { Cpu } from "lucide-react";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  isLocal?: boolean;
}

export interface SharedModelSelectorProps {
  models: ModelInfo[];
  selectedId: string;
  loading?: boolean;
  onSelect: (id: string) => void;
  title?: string;
}

export function ModelSelector({
  models,
  selectedId,
  loading,
  onSelect,
  title = "模型选择",
}: SharedModelSelectorProps) {
  return (
    <div>
      <h4 className="text-[#e0f0ff] mb-2 flex items-center gap-2 text-sm font-medium">
        <Cpu className="w-4 h-4 text-[#00d4ff]" />
        {title}
      </h4>
      {loading && (
        <p className="text-[rgba(0,212,255,0.35)] mb-2 text-xs">正在检测模型...</p>
      )}
      {models.length > 0 ? (
        <div className="space-y-1">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2 text-xs ${
                selectedId === model.id
                  ? "bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff]"
                  : "bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)] text-[rgba(0,212,255,0.5)] hover:border-[rgba(0,180,255,0.2)]"
              }`}
            >
              {model.isLocal && (
                <span className="text-[#00ff88] shrink-0 text-xs">本地</span>
              )}
              <span className="truncate flex-1">{model.name}</span>
              <span className="text-[rgba(0,212,255,0.25)] shrink-0 text-xs">
                {model.provider}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[rgba(0,212,255,0.25)] text-center py-3 text-xs">
          暂无可用模型
        </p>
      )}
    </div>
  );
}
