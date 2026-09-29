# 黄帝内经 · 精选

一个移动端优先的静态阅读器：阅读《黄帝内经》精选篇章的原文、注音、朗读和白话解释。

## 项目边界

本仓库是阅读端。内容制作、注音校正、发音规则、腾讯 TTS 与 Publication Bundle 导出由独立项目 AncientMedicalTTS 负责。Reader 只读取并播放已经出版的 Bundle；它不会读取制作端数据库、调用 TTS 或保存密钥。

## 使用

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

默认读取 `public/books/huangdi-neijing-selected/`。生产环境可设置 `VITE_CONTENT_BASE_URL`，例如 `https://content.example.com/huangdi-neijing-selected/`；内容路径必须保持相对路径，且不能使用 `..`。

## Publication Bundle v1

支持 `format: ancient-medical-publication-bundle` 和 `format_version: 1.0`。加载顺序为 `manifest.json → book.json → chapters/*.json → audio/*.mp3`。UI 先通过 `bundleLoader` 获取原始 JSON，再由 `bundleAdapter` 转成 Reader Domain Model，界面组件不会直接依赖原始 Bundle 字段。

仓库附带的小型 Bundle v1 fixture 仅供开发与交互验证；音频是静音占位，必须替换为 AncientMedicalTTS 导出的正式《黄帝内经精选》Bundle 才能作为正式内容发布。

## PWA 与部署

应用使用 `vite-plugin-pwa` 缓存 App Shell 和 Book/Chapter JSON；MP3 不会被全量预缓存，按需使用浏览器原生 `HTMLAudioElement` 加载。部署为任意静态站点即可。若阅读器与音频 CDN 跨域，CDN 必须为音频与 JSON 配置正确的 CORS 响应头。
