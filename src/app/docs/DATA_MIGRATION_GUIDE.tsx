/**
 * 数据管理迁移指南
 * ==================
 *
 * 本指南说明如何将现有页面从分散的数据管理迁移到统一数据管理方案
 *
 * ## 问题背景
 *
 * 当前项目存在以下问题：
 * 1. 每个页面都有自己的状态管理，数据分散
 * 2. 同一数据在不同页面可能不一致
 * 3. 数据变更无法实时同步到其他页面
 * 4. localStorage key 不统一，难以维护
 *
 * ## 解决方案
 *
 * 采用统一数据管理架构：
 * 1. GlobalStoreRegistry - 全局状态注册表
 * 2. UnifiedStores - 统一数据存储
 * 3. GlobalStoreContext - 全局数据访问上下文
 * 4. BroadcastChannel - 跨标签页同步
 *
 * ## 迁移步骤
 *
 * ### 步骤1: 在App.tsx中包裹Provider
 *
 * ```tsx
 * // App.tsx
 * import { GlobalStoreProvider } from "./contexts/GlobalStoreContext";
 *
 * function App() {
 *   return (
 *     <GlobalStoreProvider>
 *       <Router>...</Router>
 *     </GlobalStoreProvider>
 *   );
 * }
 * ```
 *
 * ### 步骤2: 迁移现有Hook
 *
 * #### 迁移前 (分散管理):
 *
 * ```tsx
 * // useModelProvider.ts (旧)
 * const STORAGE_KEY = "yyc3_configured_models";
 *
 * export function useModelProvider() {
 *   const [configuredModels, setConfiguredModels] = useState<ConfiguredModel[]>(() => {
 *     const saved = localStorage.getItem(STORAGE_KEY);
 *     return saved ? JSON.parse(saved) : [];
 *   });
 *
 *   const addModel = (providerId: string, model: string, apiKey: string) => {
 *     const newModel = { id: generateId(), providerId, model, apiKey, ... };
 *     setConfiguredModels(prev => [...prev, newModel]);
 *     localStorage.setItem(STORAGE_KEY, JSON.stringify([...configuredModels, newModel]));
 *   };
 *
 *   // ... 其他方法
 * }
 * ```
 *
 * #### 迁移后 (统一管理):
 *
 * ```tsx
 * // useModelProvider.ts (新)
 * import { useGlobalStore } from "../contexts/GlobalStoreContext";
 *
 * export function useModelProvider() {
 *   const {
 *     modelProviders,
 *     addModelProvider,
 *     updateModelProvider,
 *     removeModelProvider,
 *   } = useGlobalStore();
 *
 *   // 数据自动同步，无需手动管理localStorage
 *   // 跨标签页自动同步
 *
 *   return {
 *     configuredModels: modelProviders,
 *     addModel: addModelProvider,
 *     updateModel: updateModelProvider,
 *     removeModel: removeModelProvider,
 *   };
 * }
 * ```
 *
 * ### 步骤3: 迁移UI组件
 *
 * #### 迁移前:
 *
 * ```tsx
 * // ModelProviderPanel.tsx (旧)
 * function ModelProviderPanel() {
 *   const { configuredModels, addModel, removeModel } = useModelProvider();
 *   const { ollamaInstances, addInstance } = useOllamaConfig();
 *   const { dbConnections, addConnection } = useLocalDatabase();
 *
 *   // 每个Hook独立管理，数据不同步
 * }
 * ```
 *
 * #### 迁移后:
 *
 * ```tsx
 * // ModelProviderPanel.tsx (新)
 * import { useGlobalStore, useModelProviders, useOllamaInstances, useDBConnections } from "../contexts/GlobalStoreContext";
 *
 * function ModelProviderPanel() {
 *   // 方式1: 使用便捷选择器Hook
 *   const { modelProviders, addModelProvider, updateModelProvider, removeModelProvider } = useModelProviders();
 *   const { ollamaInstances, addOllamaInstance } = useOllamaInstances();
 *   const { dbConnections, addDBConnection } = useDBConnections();
 *
 *   // 方式2: 使用全局Store (获取所有数据)
 *   const globalStore = useGlobalStore();
 *
 *   // 所有数据自动同步，跨标签页实时更新
 * }
 * ```
 *
 * ## 数据存储Key映射
 *
 * | 旧Key | 新Key | 说明 |
 * |-------|-------|------|
 * | yyc3_configured_models | yyc3_model_providers | 模型配置 |
 * | yyc3_ollama_config | yyc3_ollama_instances | Ollama实例 |
 * | yyc3_db_connections | yyc3_db_connections | 数据库连接 |
 * | yyc3_wifi_networks | yyc3_wifi_networks | WiFi网络 |
 * | yyc3_users | yyc3_users | 用户列表 |
 * | yyc3_nodes | yyc3_nodes | 节点数据 |
 *
 * ## 自动迁移
 *
 * 系统会在首次加载时自动迁移旧数据到新存储：
 *
 * ```tsx
 * // unified-stores.ts
 * export function migrateFromLocalStorage(): void {
 *   // 自动检测并迁移旧数据
 *   // 迁移完成后删除旧key
 * }
 * ```
 *
 * ## 数据同步机制
 *
 * ### 同标签页同步
 *
 * ```tsx
 * // 任何数据变更都会触发订阅回调
 * globalStoreRegistry.subscribe('modelProviders', (event) => {
 *   console.log('数据变更:', event);
 * });
 * ```
 *
 * ### 跨标签页同步
 *
 * ```tsx
 * // 使用BroadcastChannel自动同步
 * // 标签页A修改数据 -> 标签页B自动更新
 * addModelProvider(newModel);
 * // 所有打开的标签页都会收到更新
 * ```
 *
 * ## 最佳实践
 *
 * 1. **统一使用GlobalStoreContext**
 *    不要直接操作localStorage，统一通过Context访问数据
 *
 * 2. **使用便捷选择器Hook**
 *    ```tsx
 *    const { modelProviders } = useModelProviders();
 *    // 而不是
 *    const { modelProviders } = useGlobalStore();
 *    ```
 *
 * 3. **数据变更通知**
 *    ```tsx
 *    // 添加操作历史记录
 *    addOperationHistory('添加模型', model.name, 'admin', 'success');
 *    ```
 *
 * 4. **数据导入导出**
 *    ```tsx
 *    // 导出所有数据
 *    const data = exportAllData();
 *
 *    // 导入数据
 *    importAllData(data);
 *    ```
 *
 * ## 迁移检查清单
 *
 * - [ ] App.tsx 添加 GlobalStoreProvider
 * - [ ] 迁移 useModelProvider
 * - [ ] 迁移 useOllamaConfig
 * - [ ] 迁移 useLocalDatabase
 * - [ ] 迁移 useNetworkConfig
 * - [ ] 迁移 useAlertRules
 * - [ ] 迁移 usePatrol
 * - [ ] 更新UI组件使用新的Hook
 * - [ ] 删除旧的localStorage操作代码
 * - [ ] 测试跨标签页同步
 * - [ ] 测试数据持久化
 */

// ============================================================
// 示例：迁移后的ModelProviderPanel组件
// ============================================================

import { useModelProviders, useOllamaInstances, useDBConnections } from "../contexts/GlobalStoreContext";

/**
 * 示例组件：展示如何使用统一数据管理
 */
export function ExampleUnifiedPanel() {
  // 使用便捷选择器Hook获取数据
  const {
    modelProviders,
    addModelProvider,
    updateModelProvider,
    removeModelProvider,
  } = useModelProviders();

  const { ollamaInstances } = useOllamaInstances();

  const { dbConnections } = useDBConnections();

  // 添加模型示例
  const handleAddModel = () => {
    addModelProvider({
      providerId: "openai",
      providerLabel: "OpenAI",
      model: "gpt-4o",
      apiKey: "sk-test",
      baseUrl: "https://api.openai.com/v1",
      createdAt: Date.now(),
      lastUsed: null,
      status: "unchecked",
    });
    // 数据自动同步到所有页面和标签页
  };

  // 更新模型示例
  const handleUpdateModel = (id: string) => {
    updateModelProvider(id, {
      status: "active",
      lastUsed: Date.now(),
    });
    // 所有使用此数据的组件都会自动更新
  };

  // 删除模型示例
  const handleRemoveModel = (id: string) => {
    removeModelProvider(id);
    // 自动记录操作历史
  };

  return (
    <div>
      <h2>模型管理</h2>
      <button onClick={handleAddModel}>添加模型</button>

      <ul>
        {modelProviders.map((model) => (
          <li key={model.id}>
            {model.model} - {model.status}
            <button onClick={() => handleUpdateModel(model.id)}>更新</button>
            <button onClick={() => handleRemoveModel(model.id)}>删除</button>
          </li>
        ))}
      </ul>

      <h2>Ollama实例</h2>
      <ul>
        {ollamaInstances.map((instance) => (
          <li key={instance.id}>
            {instance.name} - {instance.status}
          </li>
        ))}
      </ul>

      <h2>数据库连接</h2>
      <ul>
        {dbConnections.map((conn) => (
          <li key={conn.id}>
            {conn.name} - {conn.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExampleUnifiedPanel;
