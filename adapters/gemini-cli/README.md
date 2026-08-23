# Gemini CLI 适配器

> ForgeOS 对 Gemini CLI 的适配说明

## 安装

1. 将 `GEMINI.md` 内容复制到项目根目录的 `GEMINI.md`
2. Gemini CLI 会自动读取项目根目录的 GEMINI.md

## 零运行时模式 (Level 0)

Gemini CLI 适配器仅支持 Markdown 模式:
- GEMINI.md 包含 ForgeOS 宪法和规则摘要
- Phase 流程由 AI 按 GEMINI.md 指令执行
- 无 JS Hook 运行时支撑

## 使用说明

- 安装 Gemini CLI
- 在项目根目录放置 GEMINI.md
- 使用 `/forgeos` 命令触发流程
