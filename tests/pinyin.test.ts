import { describe, expect, it } from 'vitest'
import { numericPinyinToToneMarks } from '../src/utils/pinyin'
describe('numericPinyinToToneMarks', () => {
  it.each([['ma1', 'mā'], ['ma2', 'má'], ['ma3', 'mǎ'], ['ma4', 'mà'], ['shuo4', 'shuò'], ['qiao1', 'qiāo'], ['zhi3', 'zhǐ'], ['nv3', 'nǚ'], ['nve4', 'nüè'], ['lv4', 'lǜ']])('converts %s', (input, output) => expect(numericPinyinToToneMarks(input)).toBe(output))
})
