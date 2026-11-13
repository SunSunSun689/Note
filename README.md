# translator-model-call-map

NextAI Translator 配套的「模型调用链」静态展示站。

## 当前状态

**页面已撤销**:最新提交(`78d5955`)的 `dist/index.html` 是「页面已撤销」占位页,站点内容已下线,线上不提供服务。

上一版完整页面(20KB 单文件,标题「模型调用链 · NextAI Translator」)保留在 git 历史里,需要恢复时:

```bash
git checkout 8a64250 -- dist/index.html   # 恢复上一版内容
```

## 部署

- 托管配置见 `.openai/hosting.json`(project_id `appgprj_6adf0d7f06e08191bb08fa8dd3881114`,静态目录 `dist`)
- 本地预览:`python3 -m http.server -d dist`(或任意静态服务器)
- 发布流程按当时使用的托管平台流程执行,内容上线前注意先恢复/重建页面

## 与插件的关系

独立站点,翻译插件本体(`translator-extension` 分支)不依赖它;两者分开维护。本仓库不包含任何 API Key。
