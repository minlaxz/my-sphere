import { LABELS, BOARD_TITLES, POSTS, type LabelDef } from './labels'

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESCAPE_MAP[c]!)
}

function highlight(text: string, q: string): string {
  if (!q) return escapeHTML(text)
  // Split raw (un-escaped) text by the query so escaping happens AFTER matching;
  // escaping first then string-replacing could match inside an entity like &amp;.
  const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig')
  const ql = q.toLowerCase()
  return text
    .split(re)
    .map((part) =>
      part.toLowerCase() === ql ? '<mark>' + escapeHTML(part) + '</mark>' : escapeHTML(part),
    )
    .join('')
}

export type BoardController = {
  open: (id: string) => void
  close: () => void
  isOpen: () => boolean
}

export function mountBoard(opts: {
  panel: HTMLElement
  list: HTMLElement
  count: HTMLElement
  search: HTMLInputElement
  titleText: HTMLElement
  closeBtn: HTMLElement
  scene: HTMLElement
  sceneHint: HTMLElement | null
  onMorphIn: (id: string) => void
  onMorphOut: () => void
  reduceMotion: boolean
}): BoardController {
  const { panel, list, count, search, titleText, closeBtn, scene, sceneHint } = opts
  let openId: string | null = null
  let openTimer: ReturnType<typeof setTimeout> | null = null

  function renderPosts(query: string) {
    const q = (query || '').trim().toLowerCase()
    const matches = POSTS.filter((p) =>
      !q || (p.title + ' ' + p.summary + ' ' + p.tags.join(' ')).toLowerCase().includes(q),
    )
    count.textContent =
      matches.length +
      (matches.length === 1 ? ' post' : ' posts') +
      (q ? ' · “' + query.trim() + '”' : '')

    if (!matches.length) {
      list.innerHTML =
        '<div class="blog-empty">No posts match <strong>“' +
        escapeHTML(query.trim()) +
        '”</strong>.<br>Try a tag like <strong>Agents</strong>, <strong>AWS</strong>, or <strong>Cost</strong>.</div>'
      return
    }

    list.innerHTML = matches
      .map((p) => {
        const tags = p.tags
          .map(
            (tg) =>
              '<button type="button" class="blog-tag" data-tag="' +
              escapeHTML(tg) +
              '">' +
              escapeHTML(tg) +
              '</button>',
          )
          .join('')
        return (
          '<article class="blog-post">' +
          '<div class="blog-post-meta"><span>' +
          escapeHTML(p.date) +
          '</span><span class="sep"></span><span>' +
          escapeHTML(p.read) +
          ' read</span></div>' +
          '<h3 class="blog-post-title">' +
          highlight(p.title, q) +
          '</h3>' +
          '<p class="blog-post-summary">' +
          highlight(p.summary, q) +
          '</p>' +
          '<div class="blog-tags">' +
          tags +
          '</div>' +
          '</article>'
        )
      })
      .join('')
  }

  function renderArticle(L: LabelDef) {
    const action = L.action
      ? '<a class="blog-article-action" href="' +
        escapeHTML(L.action.href) +
        '" target="_blank" rel="noopener">' +
        escapeHTML(L.action.label) +
        ' <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 10.5 L10.5 3.5 M5 3.5 H10.5 V9"/></svg>' +
        '</a>'
      : ''
    list.innerHTML =
      '<div class="blog-article">' +
      '<p class="blog-article-eyebrow">' +
      escapeHTML(L.eyebrow || '') +
      '</p>' +
      '<h3 class="blog-article-title">' +
      (L.title || '') +
      '</h3>' +
      '<p class="blog-article-body">' +
      escapeHTML(L.body || '') +
      '</p>' +
      action +
      '</div>'
  }

  function open(id: string) {
    if (openId) return
    const L = LABELS.find((x) => x.id === id)
    if (!L) return
    const isBlog = !!L.blog
    openId = id
    opts.onMorphIn(id)
    scene.classList.remove('label-hover')
    scene.classList.add('blog-active')
    document.body.classList.add('board-open')
    if (sceneHint) sceneHint.classList.add('hidden')
    titleText.textContent = BOARD_TITLES[id] || L.text
    panel.classList.toggle('is-article', !isBlog)
    panel.setAttribute('aria-label', isBlog ? 'Blog posts' : BOARD_TITLES[id] || L.text)
    panel.setAttribute('aria-hidden', 'false')
    if (openTimer) clearTimeout(openTimer)
    openTimer = setTimeout(
      () => {
        panel.classList.add('open')
        if (isBlog) {
          search.value = ''
          renderPosts('')
        } else {
          renderArticle(L)
        }
        list.scrollTop = 0
      },
      opts.reduceMotion ? 60 : 430,
    )
  }

  function close() {
    if (!openId) return
    openId = null
    if (openTimer) clearTimeout(openTimer)
    panel.classList.remove('open')
    panel.setAttribute('aria-hidden', 'true')
    scene.classList.remove('blog-active')
    document.body.classList.remove('board-open')
    opts.onMorphOut()
  }

  search.addEventListener('input', (e) => renderPosts((e.target as HTMLInputElement).value))
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.blog-tag')
    if (!btn) return
    search.value = btn.dataset.tag || ''
    renderPosts(search.value)
    search.focus()
  })
  closeBtn.addEventListener('click', close)

  // Click outside the scene closes the board.
  document.addEventListener('click', (e) => {
    if (!openId) return
    if (!scene.contains(e.target as Node)) close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openId) close()
  })

  return { open, close, isOpen: () => openId !== null }
}
