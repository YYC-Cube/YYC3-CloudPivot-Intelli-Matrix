/**
 * @file: eslint-plugin-yyc3-header.js
 * @description: YYC³ 代码标头 ESLint 插件 · 检查代码标头规范
 * @author: YanYuCloudCube Team
 * @version: v1.0.0
 * @created: 2026-03-05
 * @updated: 2026-03-05
 * @status: active
 * @tags: [eslint],[plugin],[header]
 *
 * @brief: YYC³ 代码标头 ESLint 插件
 *
 * @details:
 * - 检查代码文件是否包含标头
 * - 验证标头必填字段
 * - 验证标头格式
 * - 支持自动修复
 *
 * @dependencies: ESLint
 * @exports: YYC3HeaderPlugin
 * @notes: 需要在 .eslintrc.js 中配置插件
 */

const { name, version } = require("../package.json");

const REQUIRED_FIELDS = [
  "@file:",
  "@description:",
  "@author:",
  "@version:",
  "@created:",
  "@updated:",
  "@status:",
  "@tags:",
];

const AUTHOR_NAME = "YanYuCloudCube Team";
const STATUS_VALUES = ["active", "deprecated", "experimental", "internal"];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce YYC³ code header standards",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.getLines();

    return {
      Program(node) {
        const firstLine = lines[0] || "";

        // 检查是否有标头
        if (!firstLine.includes("/**")) {
          context.report({
            node,
            message: "Missing code header. Add YYC³ standard header.",
            fix(fixer) {
              return fixer.insertTextBeforeRange([0, 0], generateHeader(context.getFilename()));
            },
          });
          return;
        }

        // 检查前 30 行是否包含所有必填字段
        const headerLines = lines.slice(0, 30).join("\n");
        const missingFields = REQUIRED_FIELDS.filter(field => !headerLines.includes(field));

        if (missingFields.length > 0) {
          context.report({
            node,
            message: `Missing required header fields: ${missingFields.join(", ")}`,
          });
        }

        // 检查作者名称
        if (!headerLines.includes(`@author: ${AUTHOR_NAME}`)) {
          context.report({
            node,
            message: `Author should be "${AUTHOR_NAME}"`,
          });
        }

        // 检查版本号格式
        const versionMatch = headerLines.match(/@version:\s*(v\d+\.\d+\.\d+)/);
        if (!versionMatch) {
          context.report({
            node,
            message: "Version should follow semantic versioning (e.g., v1.0.0)",
          });
        }

        // 检查日期格式
        const dateMatches = headerLines.match(/@(created|updated):\s*(\d{4}-\d{2}-\d{2})/g);
        if (!dateMatches || dateMatches.length < 2) {
          context.report({
            node,
            message: "Dates should follow YYYY-MM-DD format",
          });
        }

        // 检查状态值
        const statusMatch = headerLines.match(/@status:\s*(\w+)/);
        if (!statusMatch || !STATUS_VALUES.includes(statusMatch[1])) {
          context.report({
            node,
            message: `Status should be one of: ${STATUS_VALUES.join(", ")}`,
          });
        }

        // 检查标签格式
        const tagsMatch = headerLines.match(/@tags:\s*\[[^\]]+\]/);
        if (!tagsMatch) {
          context.report({
            node,
            message: "Tags should be in format: [tag1],[tag2],[tag3]",
          });
        }
      },
    };
  },
};

function generateHeader(filePath) {
  const fileName = filePath.split("/").pop();
  const ext = fileName.split(".").pop();
  const today = new Date().toISOString().split("T")[0];

  const FILE_TYPE_TAGS = {
    ts: "[typescript],[hook]",
    tsx: "[typescript],[react],[component]",
    js: "[javascript]",
    jsx: "[javascript],[react]",
    css: "[css]",
    scss: "[scss]",
  };

  const defaultTags = FILE_TYPE_TAGS[ext] || "[tag1],[tag2],[tag3]";

  return `/**
 * @file: ${fileName}
 * @description: ${fileName} description
 * @author: YanYuCloudCube Team
 * @version: v1.0.0
 * @created: ${today}
 * @updated: ${today}
 * @status: active
 * @tags: ${defaultTags}
 *
 * @brief: Brief description
 *
 * @details:
 * - Detail 1
 * - Detail 2
 *
 * @dependencies: List dependencies
 * @exports: List exports
 * @notes: Important notes
 */

`;
}
