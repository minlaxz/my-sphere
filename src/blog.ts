import { LABELS, BOARD_TITLES, POSTS, type LabelDef } from './labels'
import { isOpen, type BoardStore } from './board-state'

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

export function mountBoard(opts: {
  panel: HTMLElement
  list: HTMLElement
  count: HTMLElement
  search: HTMLInputElement
  titleText: HTMLElement
  closeBtn: HTMLElement
  scene: HTMLElement
  sceneHint: HTMLElement | null
  board: BoardStore
}): void {
  const { panel, list, count, search, titleText, closeBtn, scene, sceneHint, board } = opts

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

  // Phase → DOM. The store owns when; this owns what it looks like.
  const labelFor = (id: string | null) => LABELS.find((x) => x.id === id)

  function onMorphIn(L: LabelDef) {
    const isBlog = !!L.blog
    scene.classList.remove('label-hover')
    scene.classList.add('blog-active')
    document.body.classList.add('board-open')
    if (sceneHint) sceneHint.classList.add('hidden')
    titleText.textContent = BOARD_TITLES[L.id] || L.text
    panel.classList.toggle('is-article', !isBlog)
    panel.setAttribute('aria-label', isBlog ? 'Blog posts' : BOARD_TITLES[L.id] || L.text)
    panel.setAttribute('aria-hidden', 'false')
  }

  function onReveal(L: LabelDef) {
    panel.classList.add('open')
    if (L.blog) {
      search.value = ''
      renderPosts('')
    } else {
      renderArticle(L)
    }
    list.scrollTop = 0
  }

  function onMorphOut() {
    panel.classList.remove('open')
    panel.setAttribute('aria-hidden', 'true')
    scene.classList.remove('blog-active')
    document.body.classList.remove('board-open')
  }

  board.subscribe((s) => {
    const L = labelFor(s.id)
    if (s.phase === 'morphing-in' && L) onMorphIn(L)
    else if (s.phase === 'open' && L) onReveal(L)
    else if (s.phase === 'morphing-out') onMorphOut()
  })

  const close = () => board.close()

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
    if (!isOpen(board.get())) return
    if (!scene.contains(e.target as Node)) close()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen(board.get())) close()
  })
}
