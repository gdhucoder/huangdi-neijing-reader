# Architecture

```
AncientMedicalTTS
        ↓
Publication Bundle v1
        ↓
BundleLoader
        ↓
BundleAdapter
        ↓
Reader Domain Model
        ↓
React UI
        ↓
HTMLAudioElement
        ↓
Timeline
```

`bundleLoader.ts` validates format and version, loads only relative resources, and keeps raw schema concerns at the edge. `bundleAdapter.ts` maps raw v1 documents to `ReaderBook`, `ReaderChapter`, and `ReaderSegment`; a future Bundle v1.1 should primarily be handled there. `timeline.ts` validates ranges and finds the active segment with a cached-index fast path and binary-search fallback.

The browser stores reader settings and the latest reading position locally. No service, account, database, content editing or TTS capability exists in this project.
