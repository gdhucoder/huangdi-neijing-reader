import { describe, expect, it } from 'vitest'
import { numericPinyinToToneMarks, validPronunciation } from '../src/utils/pinyin'
describe('numericPinyinToToneMarks', () => {
  it.each([['ma1', 'mā'], ['ma2', 'má'], ['ma3', 'mǎ'], ['ma4', 'mà'], ['shuo4', 'shuò'], ['qiao1', 'qiāo'], ['zhi3', 'zhǐ'], ['nv3', 'nǚ'], ['nve4', 'nüè'], ['lv4', 'lǜ']])('converts %s', (input, output) => expect(numericPinyinToToneMarks(input)).toBe(output))

  it('accepts punctuation tokens without hiding the whole segment', () => {
    expect(validPronunciation([
      { text: '天', pinyin: 'tian1' },
      { text: '—', pinyin: '' },
      { text: '地', pinyin: 'di4' },
    ], '天—地')).toBe(true)
  })
})
