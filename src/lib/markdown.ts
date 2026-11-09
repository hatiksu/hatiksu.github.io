// Минимальный разбор Markdown из описаний релизов — без HTML, только безопасные блоки.
export type MdInline = { type: 'text' | 'code' | 'bold'; value: string }
export type MdBlock =
  | { type: 'heading'; inline: MdInline[] }
  | { type: 'paragraph'; inline: MdInline[] }
  | { type: 'list'; ordered: boolean; items: MdInline[][] }

export function parseInline(text: string): MdInline[] {
  const parts: MdInline[] = []
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    parts.push(m[1] !== undefined ? { type: 'code', value: m[1] } : { type: 'bold', value: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

export function parseMarkdown(md: string): MdBlock[] {
  const blocks: MdBlock[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) blocks.push({ type: 'paragraph', inline: parseInline(para.join(' ')) })
    para = []
  }
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const item = line.match(/^(?:([-*])|(\d+)[.)])\s+(.*)$/)
    if (!line) flush()
    else if (heading) {
      flush()
      blocks.push({ type: 'heading', inline: parseInline(heading[1]) })
    } else if (item) {
      flush()
      const ordered = Boolean(item[2])
      const prev = blocks.at(-1)
      if (prev?.type === 'list' && prev.ordered === ordered) prev.items.push(parseInline(item[3]))
      else blocks.push({ type: 'list', ordered, items: [parseInline(item[3])] })
    } else para.push(line)
  }
  flush()
  return blocks
}
