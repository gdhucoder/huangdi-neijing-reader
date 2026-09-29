# 音频导入规范

本文档约束 `黄帝内经 · 精选` 内容包中的章节音频、章节 JSON 和时间轴格式。

## 1. 当前应用读取的位置

默认内容根目录是：

```text
public/books/huangdi-neijing-selected-v01/
```

如果没有修改 `VITE_CONTENT_BASE_URL`，应用会按下面的结构加载：

```text
public/books/huangdi-neijing-selected-v01/
├── manifest.json
├── book.json
├── audio/
│   ├── chapter-001.mp3
│   └── chapter-002.mp3
└── chapters/
    ├── chapter-001.json
    └── chapter-002.json
```

每一篇使用一个完整的章节音频文件。不要把每个句子单独导出成一个音频文件；句子的播放位置由章节 JSON 中的 `start_ms` 和 `end_ms` 指定。

## 2. 音频文件要求

### 必须满足

| 项目 | 约束 |
| --- | --- |
| 容器/编码 | MP3（`.mp3`） |
| 文件数量 | 每章一个文件 |
| 文件名 | 推荐 `chapter-001.mp3`、`chapter-002.mp3`，三位数字补零 |
| 路径 | 相对于内容根目录的 `audio/`，不可使用绝对路径、反斜杠或 `..` |
| 内容 | 音频顺序必须与章节 `segments` 的时间轴一致 |

### 推荐参数

为保持当前音频包的一致性，建议使用：

```text
采样率：16 kHz
声道：单声道（mono）
码率：96 kbps CBR
```

当前正式音频就是这一组参数。浏览器虽然可能播放其他 MP3 参数，但不建议在同一内容包中混用 WAV、M4A、OGG 或不同采样率的文件。

音频文件的真实时长应与章节 JSON 的 `audio.duration_ms` 基本一致，建议误差不超过 100 ms。导出音频时不要在结尾额外加入大段静音。

## 3. `manifest.json`

格式和版本必须固定为：

```json
{
  "format": "ancient-medical-publication-bundle",
  "format_version": "1.0",
  "generator": {
    "name": "AncientMedicalTTS",
    "version": "0.1.0"
  },
  "generated_at": "2026-09-29T01:36:01.782041Z",
  "book": "book.json"
}
```

当前加载器只支持 `format_version: "1.0"`。资源路径必须是内容根目录下的相对路径。

## 4. `book.json`

章节清单至少需要 `id`、`order`、`title`、`content` 和 `audio`：

```json
{
  "id": "book-id",
  "title": "黄帝内经精选",
  "language": "zh-CN",
  "reading_mode": "modern_standard_mandarin",
  "audio": {
    "format": "mp3"
  },
  "chapters": [
    {
      "id": "chapter-id",
      "order": 1,
      "title": "养生与天年",
      "content": "chapters/chapter-001.json",
      "audio": "audio/chapter-001.mp3"
    }
  ]
}
```

约束：

- `id` 在整本书内唯一；
- `order` 从 1 开始，按阅读顺序递增且不能重复；
- `content` 必须能找到对应的章节 JSON；
- `audio` 应与章节 JSON 中 `audio.src` 指向同一个文件；
- 当前播放器实际使用章节 JSON 的 `audio.src`，只修改 `book.json` 中的 `audio` 不会改变播放器音频。

## 5. 章节 JSON

每个章节文件的最小结构如下：

```json
{
  "id": "chapter-id",
  "order": 1,
  "collection": "素问",
  "title": "养生与天年",
  "subtitle": "上古天真论篇第一",
  "audio": {
    "src": "audio/chapter-001.mp3",
    "duration_ms": 42110,
    "format": "mp3"
  },
  "segments": []
}
```

`audio.src` 是相对于内容根目录的路径，必须与实际文件名完全一致。

## 6. 片段和章节时间轴

每个可朗读片段至少需要：

```json
{
  "id": "segment-id",
  "order": 1,
  "text": "上古之人，其知道者。",
  "speak_enabled": true,
  "start_ms": 0,
  "end_ms": 3820,
  "translation": "古人中懂得养生规律的人。"
}
```

时间轴规则：

- `start_ms` 和 `end_ms` 使用整数毫秒；
- 它们是相对于整章音频的绝对时间，不是相对于片段的时间；
- `start_ms >= 0`，且 `end_ms > start_ms`；
- 片段按 `order` 排列，时间段不能重叠；允许片段之间存在短暂空隙；
- 所有片段的 `end_ms` 不应超过音频真实时长；
- `speak_enabled: true` 且同时有有效时间轴的片段才能被播放和点击定位；
- 如果时间轴不合法，正文仍会显示，但整章朗读定位会被禁用。

例如，第二个片段的全章时间轴应从第一个片段结束处继续：

```text
片段 1：0       - 13652 ms
片段 2：13652   - 29820 ms
片段 3：29820   - 42112 ms
```

## 7. 拼音和逐字跟读数据

如果需要显示拼音和逐字高亮，推荐使用下面的结构：

```json
{
  "pronunciation": {
    "tokens": [
      { "text": "上", "confirmed_pinyin": "shang4" },
      { "text": "古", "confirmed_pinyin": "gu3" },
      { "text": "，", "confirmed_pinyin": null }
    ],
    "tts_actual": [
      { "text": "上", "pinyin": "shang4", "begin_ms": 34, "end_ms": 348 },
      { "text": "古", "pinyin": "gu3", "begin_ms": 360, "end_ms": 650 }
    ]
  }
}
```

约束：

- `tokens` 拼接后的 `text` 必须与片段 `text` 完全一致，包括标点和空格；
- 汉字拼音使用数字声调，例如 `shang4`、`nv3`、`lü4`；`v` 和 `u:` 也可表示 `ü`；
- 轻声使用声调数字 `5`，例如 `de5`；
- 标点 token 的拼音使用空字符串；
- `tts_actual` 的时间是相对于当前片段开始位置的毫秒，不是整章绝对时间；
- `tts_actual` 应按朗读顺序排列，`begin_ms < end_ms`，且不超过片段时长；
- 末尾静音可以不写入 `tts_actual`，应用会忽略空文本的静音记录；
- 拼音 token 无效时，应用会隐藏该片段的拼音，但不会影响正文显示。

## 8. 导入前检查清单

- [ ] 音频是 MP3，文件名和路径大小写完全匹配 JSON；
- [ ] `manifest.json` 的格式和版本正确；
- [ ] `book.json` 的每个 `content` 文件都存在；
- [ ] 每个章节 JSON 的 `audio.src` 文件都存在；
- [ ] 音频时长与 `duration_ms` 基本一致；
- [ ] 片段时间轴不重叠，并且没有超过音频时长；
- [ ] `speak_enabled`、`start_ms`、`end_ms` 已填写；
- [ ] 拼音 token 拼接后与原文完全一致；
- [ ] 逐字时间使用片段内相对毫秒；
- [ ] JSON 使用 UTF-8 编码，不能有注释和尾逗号；
- [ ] 修改后运行 `pnpm test` 和 `pnpm build`。

## 9. 常见错误

| 现象 | 常见原因 |
| --- | --- |
| 播放按钮不可用 | `audio.src` 不存在、时间轴无效，或没有可播放片段 |
| 能播放但无法跳到句子 | `start_ms/end_ms` 缺失、重叠或顺序错误 |
| 拼音全部不显示 | token 拼接结果与 `text` 不一致，或拼音格式不是数字声调 |
| 逐字高亮错位 | `tts_actual` 不是片段内相对时间，或顺序与 tokens 不一致 |
| 更新音频后仍听到旧内容 | 浏览器/PWA 缓存仍在使用旧文件；提交后刷新或更换文件名 |
