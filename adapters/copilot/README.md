# GitHub Copilot 适配器

> DevFlow 对 GitHub Copilot 的适配说明

## 安装

1. 将 `copilot-instructions.md` 内容复制到项目 `.github/copilot-instructions.md`
2. 将 `rules/` 目录下对应语言规则添加到 `.github/` 目录

## 零运行时模式 (Level 0)

Copilot 适配器仅支持 Markdown 模式:
- hooks/markdown-hooks.yaml 中的 Hook 定义转化为 Copilot 指令
- Gate 检查由 AI 按 Markdown 清单执行
- 无 JS Hook 运行时支撑

## 使用说明

- 在 VS Code 中安装 GitHub Copilot 扩展
- 项目级 `.github/copilot-instructions.md` 自动生效
- DevFlow 的 CONSTITUTION 和 RULES 会被 Copilot 读取
