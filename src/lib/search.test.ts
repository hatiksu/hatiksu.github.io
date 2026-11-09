import { describe, expect, it } from 'vitest'
import { search } from './search'

const items = [
  { id: 'a', label: 'Навыки' },
  { id: 'b', label: 'Орбита — аркада', keywords: 'canvas игра' },
  { id: 'c', label: 'Скачать Орбиту', keywords: 'windows exe' },
  { id: 'd', label: 'Тёмная тема' },
]

describe('search', () => {
  it('пустой запрос — всё по порядку', () => {
    expect(search(items, '  ').map((i) => i.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('совпадение в начале выше, ключевые слова тоже ищутся', () => {
    expect(search(items, 'орбит').map((i) => i.id)).toEqual(['b', 'c'])
    expect(search(items, 'игра').map((i) => i.id)).toEqual(['b'])
    expect(search(items, 'exe скачать').map((i) => i.id)).toEqual(['c'])
  })

  it('ё и е не различаются', () => {
    expect(search(items, 'темная').map((i) => i.id)).toEqual(['d'])
  })
})
