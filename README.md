# 翻译插件（NextAI Translator 个人定制版）

基于 [nextai-translator](https://github.com/nextai-translator/nextai-translator)（原 openai-translator）的个人定制版，重点增强**单词音标与词典原声发音**，并配好**本地部署**（Chrome 策略强制安装 + Ollama 本地模型，无云端依赖）。

> 上游原版说明见 [README-CN.md](./README-CN.md)（上游文档）。

## 功能

- **划词翻译**：选中文字即时翻译，流式输出，支持翻译/润色/总结三种模式，55 种语言
- **单词音标 + 词典原声**（本 fork 新增）：
  - 译文中每个英文单词均可交互：**悬停**快速预览音标（IPA）与释义，**点击**固定查词卡片
  - 喇叭按钮播放**词典原声**，三级音源链：dictionaryapi.dev（Wiktionary 原声）→ 有道 dictvoice → 浏览器 TTS 合成音
  - Esc / 滚动 / 点击外部关闭卡片
- **17 种 LLM 服务商**：DeepSeek、OpenAI、Ollama、Claude、Gemini、Kimi、Moonshot、ChatGLM 等，OpenAI 兼容 API 均可接入
- 整句朗读（TTS）、Markdown 渲染、生词本、快捷键、右键菜单等（上游功能）

## 安装（Chrome · Linux）

一键脚本完成构建、打包、部署、策略配置：

```sh
./scripts/install-linux.sh
```

脚本做的事（重启 Chrome 后扩展自动安装/升级）：

1. 构建浏览器插件（chromium 版）
2. 用 `dist/selfhost/key.pem` 打包自签 `.crx`（首次自动生成密钥，**请勿删除**，它决定扩展 ID `oaphiomanbkpiaoleeonclikdfljihik`）
3. 部署本地更新服务（systemd user service，`localhost:8930`，开机自启）
4. 写入 Chrome 策略 `/etc/opt/chrome/policies/managed/translator.json`（`ExtensionInstallForcelist` 强制安装，第 4 步需要 sudo）

**升级**：改代码后重跑脚本 + 重启 Chrome 即可。验证：`chrome://policy` 应显示策略生效，`chrome://extensions` 应显示 NextAI Translator。

**卸载**：

```sh
systemctl --user disable --now translator-update
sudo rm /etc/opt/chrome/policies/managed/translator.json
```

备选安装方式：`chrome://extensions` → 开发者模式 → 加载已解压的 `dist/browser-extension/chromium`。

## 本地翻译服务（可选，无云端依赖）

用 [Ollama](https://ollama.com) 在本机跑翻译模型，数据不出本机：

```sh
ollama pull qwen3:14b        # 9.3GB，需约 10GB 显存（RTX 5080 16G 实测 0.3s/句）
```

插件设置：服务商选 **Ollama** → API URL `http://localhost:11434` → 模型 `qwen3:14b`。
插件会自动发送 `reasoning_effort: 'none'` 关闭 Qwen3 思考模式（上游已内置），无需额外配置。

- 首次翻译较慢（模型加载进显存 ~15s），可在设置里调大模型驻留时间让它常驻
- 小显存备选：`ollama pull qwen3:8b`
- 云 API（DeepSeek 等）：设置里直接切换服务商并填入 API Key 即可
- **本仓库不包含任何 API Key**：云端服务的 Key 在插件设置页填写，仅存于浏览器本地，不要提交进仓库；`dist/` 构建产物（含自签 `key.pem`）已被 `.gitignore` 排除

## 使用

1. 任意网页选中文字 → 弹出翻译卡片（或右键菜单 / `Ctrl+Shift+Y` 弹窗输入）
2. 译文中的英文单词：悬停看音标预览，点击固定卡片（音标 + 释义 + 词典原声）
3. 设置页可调整：服务商与模型、TTS 音色、快捷键、单词交互等

## 开发

环境：Node ≥ 22（建议 nvm）、pnpm 9（`corepack enable pnpm`）

```sh
ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --registry=https://registry.npmmirror.com  # 国内镜像
pnpm test                      # vitest（全量 90 个测试）
pnpm lint                      # eslint
pnpm exec tsc --noEmit         # 类型检查
pnpm build-browser-extension   # 产出 dist/browser-extension/{chromium,firefox}.zip
pnpm dev-chromium              # 开发模式（HMR）
```

开发规范：TDD（先写失败测试再实现）。新增测试放对应 `*.spec.ts(x)`，服务层纯函数直接测，组件交互用 `createRoot` + `act`（参考 `WordHoverCard.spec.tsx`）。

## 本 fork 的改动

| 文件 | 改动 |
|---|---|
| `src/common/services/wordLookup.ts` | `WordLookupPreview` 增加 `audio` 字段，解析 dictionaryapi.dev 的 `phonetics[].audio` |
| `src/common/services/wordAudio.ts` | **新增**：有道 dictvoice URL 生成、`resolveAudioSources` 音源链、`playAudioChain` 播放链（失败自动切换下一音源、可停止） |
| `src/common/components/WordHoverCard.tsx` | 单词点击/回车 → 固定查词卡片（原行为是重新翻译该词）；悬停预览不变；Esc/滚动/点外部关闭；喇叭按钮走三级音源链（原声 → 有道 → TTS） |
| `src/browser-extension/manifest.ts` | `host_permissions` 增加 `dict.youdao.com` |
| `src/common/services/wordLookup.spec.ts` | 新增 14 个测试：audio 解析、音源链、播放链 |
| `src/common/components/WordHoverCard.spec.tsx` | **新增**：点击固定卡片等 5 个交互测试 |
| `scripts/install-linux.sh` | **新增**：构建 + 打包 crx + 部署 + Chrome 策略一键脚本 |
| `scripts/serve-extension-updates.js` | **新增**：本地更新服务（localhost:8930，提供 crx 与 update.xml） |
| `scripts/translator-update.service` | **新增**：systemd user service 模板 |

## 架构速览

```
src/browser-extension/        # 插件壳：content_script（划词弹窗）、popup、options、manifest
src/common/components/
  ├─ Translator.tsx           # 翻译主 UI（流式渲染、操作栏）
  ├─ WordHoverCard.tsx        # 单词悬停/固定查词卡片（本 fork 重点改动）
  └─ PhoneticText.tsx         # 译文行渲染（音标段、朗读高亮）
src/common/services/
  ├─ wordLookup.ts            # dictionaryapi.dev 查词（音标/释义/原声）
  └─ wordAudio.ts             # 音源链与播放链（本 fork 新增）
src/common/engines/           # 17 个 LLM 引擎（DeepSeek、Ollama 等），OpenAI 兼容
scripts/                      # 部署脚本（install-linux.sh 等）
dist/selfhost/                # 打包产物：key.pem、translator.crx、update.xml
```

## 配套站点

`sites/translator-model-call-map`（翻译模型调用图静态站）是独立的小仓库，已单独推送到 `SunSunSun689/Note` 的 `translator-model-call-map` 分支，与插件本体分开维护。

## 许可证

[AGPL-3.0](./LICENSE)（继承上游；个人自用不受影响，公开发布/对外提供服务需遵循 AGPL 条款）。
