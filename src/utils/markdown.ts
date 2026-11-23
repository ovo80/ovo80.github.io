/**
 * 一个足够用的迷你 Markdown 渲染器：
 * 支持标题、段落、列表、引用、代码块、分隔线、图片、链接、粗体、斜体、行内代码。
 * 不支持表格、嵌套列表等复杂语法 —— 对一个个人博客来说够了。
 */

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const inline = (text: string): string => {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  return html
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const html: string[] = []
  let paragraph: string[] = []
  let list: { type: 'ul' | 'ol' } | null = null
  let code: { lang: string; body: string[] } | null = null
  let quote: string[] = []

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return
    html.push(`<p>${paragraph.map(inline).join('\n')}</p>`)
    paragraph = []
  }

  const closeList = (): void => {
    if (!list) return
    html.push(`</${list.type}>`)
    list = null
  }

  const flushQuote = (): void => {
    if (quote.length === 0) return
    html.push(`<blockquote>${quote.map(inline).join('<br />')}</blockquote>`)
    quote = []
  }

  const flushAll = (): void => {
    flushParagraph()
    closeList()
    flushQuote()
  }

  for (const line of lines) {
    const fence = /^```(\S*)\s*$/.exec(line)

    if (code) {
      if (fence) {
        const language = code.lang ? ` class="language-${code.lang}"` : ''
        html.push(`<pre><code${language}>${escapeHtml(code.body.join('\n'))}</code></pre>`)
        code = null
      } else {
        code.body.push(line)
      }
      continue
    }

    if (fence) {
      flushAll()
      code = { lang: fence[1].replace(/[^\w-]/g, ''), body: [] }
      continue
    }

    if (line.trim() === '') {
      flushAll()
      continue
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      const level = Math.min(heading[1].length, 6)
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`)
      continue
    }

    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
      flushAll()
      html.push('<hr />')
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph()
      closeList()
      quote.push(line.replace(/^\s*>\s?/, ''))
      continue
    }

    const unordered = /^\s*[-*+]\s+(.*)$/.exec(line)
    const ordered = /^\s*\d+\.\s+(.*)$/.exec(line)
    if (unordered || ordered) {
      flushParagraph()
      flushQuote()
      const type = unordered ? 'ul' : 'ol'
      if (!list || list.type !== type) {
        closeList()
        list = { type }
        html.push(`<${type}>`)
      }
      const item = (unordered ?? ordered) as RegExpExecArray
      html.push(`<li>${inline(item[1])}</li>`)
      continue
    }

    closeList()
    flushQuote()
    paragraph.push(line.trim())
  }

  flushAll()
  return html.join('\n')
}
