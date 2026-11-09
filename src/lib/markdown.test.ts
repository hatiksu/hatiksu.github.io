import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from './markdown'

describe('markdown', () => {
  it('инлайн: код и жирный', () => {
    expect(parseInline('Скачайте `app.exe` и **запустите**')).toEqual([
      { type: 'text', value: 'Скачайте ' },
      { type: 'code', value: 'app.exe' },
      { type: 'text', value: ' и ' },
      { type: 'bold', value: 'запустите' },
    ])
  })

  it('блоки: заголовки, списки, абзацы', () => {
    const blocks = parseMarkdown('## Установка\n\n1. Раз\n2. Два\n\nТекст\nпродолжение\n- пункт')
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'list', 'paragraph', 'list'])
    expect(blocks[1]).toMatchObject({ ordered: true, items: [[{ value: 'Раз' }], [{ value: 'Два' }]] })
    expect(blocks[2]).toEqual({ type: 'paragraph', inline: [{ type: 'text', value: 'Текст продолжение' }] })
  })

  it('HTML не превращается в разметку', () => {
    expect(parseMarkdown('<script>x</script>')).toEqual([{ type: 'paragraph', inline: [{ type: 'text', value: '<script>x</script>' }] }])
  })
})
