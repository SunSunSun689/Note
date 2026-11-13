# Claude Code 与 Codex 的 Skill 调用方式

更新日期：2026-10-27

## 一句话结论

Claude Code 中可用 `/技能名` 手动调用 Skill；Codex 中明确可用 `$技能名` 手动指定 Skill。两者都可以根据任务内容自动选用合适的 Skill，但输入框的调用语法不同。

## 官方规则

| 工具 | 手动调用 | 说明 |
| --- | --- | --- |
| Claude Code | `/octoloop` | Skill 可以像内置命令一样用 `/` 调用；自定义 Skill 可放在 `.claude/skills/<name>/SKILL.md`。见 [Claude Code cheatsheet](https://support.claude.com/en/articles/14553413-claude-code-cheatsheet)。 |
| Codex | `$octoloop` | 在 Codex CLI 或 IDE 扩展中，可用 `$` 提及 Skill，或用 `/skills` 选择。见 [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills)。 |
| Codex 自定义提示词 | `/prompts:octoloop` | `~/.codex/prompts/octoloop.md` 对应带 `prompts:` 前缀的命令；这是已标为弃用的兼容机制。见 [OpenAI Custom Prompts](https://learn.chatgpt.com/docs/custom-prompts)。 |

## 本机观察

- Claude Code 已安装 `~/.claude/skills/octoloop/SKILL.md`，用户在 Claude 输入 `/octoloop` 能看到提示。
- Codex 已安装 `~/.codex/skills/octoloop/SKILL.md`，用户在 Codex 输入 `$octoloop` 能看到提示，但输入 `/octoloop` 没有看到同名提示。
- 已另建 `~/.codex/prompts/octoloop.md`，对应的自定义提示词名称是 `/prompts:octoloop`；尚未在用户界面确认刷新后的显示结果。

## 使用判断

Codex 中找不到 `/octoloop`，不能据此判断 Skill 未安装；先输入 `$octoloop`，或在 CLI 中使用 `/skills`。OpenAI 的[桌面端斜杠命令文档](https://learn.chatgpt.com/docs/reference/slash-commands)说明已启用的 Skill 也可能出现在 `/` 列表中，但具体可见项取决于界面和环境。本机已确认的是 `$octoloop` 可用。

## 资料性质

- **官方事实**：上表的调用规则及文档链接。
- **本机事实**：本机安装路径及用户报告的输入框表现，见上一节。
- **待复核**：`/prompts:octoloop` 在重启或新开会话后的实际提示表现。
