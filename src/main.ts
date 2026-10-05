import './style.css'
import { createScene } from './scene'
import { mountBoard } from './blog'
import { createBoardStore, isOpen } from './board-state'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="field" aria-hidden="true"></div>
  <div class="nightfall" aria-hidden="true"></div>
  <div class="backlight" aria-hidden="true"></div>
  <div class="pendant" id="pendant" aria-hidden="true">
    <span class="pendant-canopy"></span>
    <span class="pendant-cord"></span>
    <span class="pendant-ring" id="pendant-ring" role="button" tabindex="0" aria-hidden="false" aria-label="Halo lamp 3 watts" title="Lamp 3 W — click to change"></span>
  </div>
  <div class="lamp-meter" id="lamp-meter" aria-hidden="true">
    <span class="lm-eq">P = V·I</span>
    <span class="lm-row"><b id="lm-p">0.0</b> W</span>
    <span class="lm-row"><b id="lm-v">0.0</b> V</span>
    <span class="lm-row"><b id="lm-i">0.00</b> A</span>
  </div>
  <div class="page">
    <main class="hero">
      <div class="hero-copy">
        <p class="eyebrow">An AI Enthusiast</p>
        <h1>Hi, <span class="accent">nice</span> to meet&nbsp;you.</h1>
        <p class="lede">
          It's all <em>inside the sphere</em> — explore it, or tap <em>blog</em> to read my writing.
          I build <em>enterprise AI solutions</em> that close the gaps that move your business.
        </p>
        <div class="contact">
          <a class="contact-link" href="mailto:hello@minlaxz.icu">
            <span class="contact-cue">Let's talk</span>
            <span class="contact-mail">hello@minlaxz.icu</span>
            <svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12 L12 4 M6 4 H12 V10"/></svg>
          </a>
          <p class="contact-note">
            <span class="contact-status"><span class="status-dot" id="status-dot"></span><span id="status-text">checking local time…</span></span>
            <span>Typical replies in ~6–12h on weekdays, ~3–6h on weekends. Different timezone? It may stretch a little.</span>
            <span class="contact-rest" id="rest-note"></span>
          </p>
        </div>
      </div>
      <div class="scene-wrap">
        <div class="scene" id="scene">
          <canvas id="three-canvas" aria-label="A slowly tumbling sphere of glowing particles surrounding the name minlaxz. Five labels — idea, about, github, linkedin, blog — orbit the sphere. Click any label to unwarp the sphere into a squared board."></canvas>
          <div class="blog-panel" id="blog-panel" aria-hidden="true" role="region" aria-label="Blog posts">
            <div class="blog-head">
              <div class="blog-head-top">
                <span class="blog-title"><span class="blog-dot"></span> <span id="blog-title-text">Blog</span></span>
                <button class="blog-close" id="blog-close" type="button" aria-label="Close board">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4 L12 12 M12 4 L4 12"/></svg>
                </button>
              </div>
              <div class="blog-search">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.4"/><path d="M10.4 10.4 L14 14"/></svg>
                <input id="blog-search-input" type="search" placeholder="Search posts, tags, ideas…" autocomplete="off" spellcheck="false" aria-label="Search blog posts" />
              </div>
              <span class="blog-count" id="blog-count"></span>
            </div>
            <div class="blog-list" id="blog-list"></div>
          </div>
        </div>
        <div class="scene-hint" id="scene-hint" aria-hidden="true">
          <span class="tap-glyph"><span class="tap-dot"></span></span>
          <span>Tap an orbiting label to explore more...</span>
        </div>
        <div class="scene-metrics" id="scene-metrics" aria-hidden="true">
          <span class="metric">
            <span class="metric-key">r</span>
            <span class="metric-val" id="metric-r">2.00</span>
          </span>
          <span class="metric-sep"></span>
          <span class="metric">
            <span class="metric-key">volume <span class="metric-formula">4⁄3·π·r³</span></span>
            <span class="metric-val"><span id="metric-vol">33.51</span><span class="metric-unit">u³</span></span>
          </span>
          <span class="metric-sep"></span>
          <span class="metric">
            <span class="metric-key">surface <span class="metric-formula">4·π·r²</span></span>
            <span class="metric-val"><span id="metric-area">50.27</span><span class="metric-unit">u²</span></span>
          </span>
        </div>
      </div>
    </main>
    <footer class="bar footbar">
      <span class="meta">
        <a href="http://open-design.ai/" target="_blank" rel="noopener">Open Design</a>
        with <a href="https://www.tasteskill.dev/" target="_blank" rel="noopener">Taste Skills</a>
        + Claude on <a href="https://multica.ai/" target="_blank" rel="noopener">Multica</a>
      </span>
    </footer>
  </div>
`

const canvas = document.querySelector<HTMLCanvasElement>('#three-canvas')!
const sceneEl = document.querySelector<HTMLDivElement>('#scene')!
const sceneHint = document.querySelector<HTMLDivElement>('#scene-hint')
const metricsEl = document.querySelector<HTMLDivElement>('#scene-metrics')!
const metricREl = document.querySelector<HTMLSpanElement>('#metric-r')!
const metricVolEl = document.querySelector<HTMLSpanElement>('#metric-vol')!
const metricAreaEl = document.querySelector<HTMLSpanElement>('#metric-area')!

// Lamp fixture: a halo-ring pendant whose glow is driven by sphere interaction.
const pendantEl = document.querySelector<HTMLDivElement>('#pendant')!
const lampPEl = document.querySelector<HTMLElement>('#lm-p')!
const lampVEl = document.querySelector<HTMLElement>('#lm-v')!
const lampIEl = document.querySelector<HTMLElement>('#lm-i')!
const rootStyle = document.documentElement.style
let lastLampStr = '' // cache so steady-state frames skip redundant DOM writes

// One owner for board / morph state. Scene advances it each frame and opens it
// on label click; the panel and the lamp pendant react to phase changes.
const board = createBoardStore()

// Pendant up while a board is opening/open — cord retracts, ring sticks to the
// top edge at full power.
board.subscribe((s) => pendantEl.classList.toggle('lamp-up', isOpen(s)))

mountBoard({
  panel: document.querySelector<HTMLDivElement>('#blog-panel')!,
  list: document.querySelector<HTMLDivElement>('#blog-list')!,
  count: document.querySelector<HTMLSpanElement>('#blog-count')!,
  search: document.querySelector<HTMLInputElement>('#blog-search-input')!,
  titleText: document.querySelector<HTMLSpanElement>('#blog-title-text')!,
  closeBtn: document.querySelector<HTMLButtonElement>('#blog-close')!,
  scene: sceneEl,
  sceneHint,
  board,
})

createScene({
  canvas,
  container: sceneEl,
  board,
  onMetrics: ({ r, vol, area, flatten }) => {
    metricREl.textContent = r.toFixed(2)
    metricVolEl.textContent = vol.toFixed(2)
    metricAreaEl.textContent = area.toFixed(2)
    metricsEl.style.opacity = (1 - flatten).toFixed(3)
  },
  // Lamp output (0..1) published each frame; drives the --lamp CSS var (ring
  // glow, backlight pool, nightfall lift) and the P = V·I power meter.
  // Rated 12 V / 2.0 A / 24 W at full output.
  onLamp: (value) => {
    // Guard every write: steady-state frames (lamp idle/off) produce the same
    // string, so skipping unchanged writes avoids needless style recalcs and
    // layout thrash inside the rAF loop.
    const lampStr = value.toFixed(3)
    if (lampStr === lastLampStr) return
    lastLampStr = lampStr
    rootStyle.setProperty('--lamp', lampStr)
    const v = value * 12
    const i = value * 2.0
    const vStr = v.toFixed(1)
    const iStr = i.toFixed(2)
    const pStr = (v * i).toFixed(1)
    if (lampVEl.textContent !== vStr) lampVEl.textContent = vStr
    if (lampIEl.textContent !== iStr) lampIEl.textContent = iStr
    if (lampPEl.textContent !== pStr) lampPEl.textContent = pStr
  },
})

// ── Live contact status — day/night dot + Myanmar local time (UTC+6:30) ──
// Derived from this device's clock so it stays correct in any timezone.
// Refreshed each minute so the "live" time and rest-hours note stay current.
function initContactStatus() {
  const dot = document.querySelector<HTMLSpanElement>('#status-dot')
  const txt = document.querySelector<HTMLSpanElement>('#status-text')
  const rest = document.querySelector<HTMLSpanElement>('#rest-note')
  const update = () => {
    const now = new Date()
    const mmt = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 6.5 * 3600000)
    const h = mmt.getHours()
    const m = mmt.getMinutes()
    const isDay = h >= 6 && h < 18
    const resting = h >= 23 || h < 7
    if (dot) {
      dot.classList.remove('day', 'night')
      dot.classList.add(isDay ? 'day' : 'night')
    }
    const hh = h % 12 || 12
    const ampm = h < 12 ? 'AM' : 'PM'
    const mm = m < 10 ? '0' + m : '' + m
    if (txt) {
      txt.textContent =
        (isDay ? 'Daytime' : 'Nighttime') + ' in Myanmar · ' + hh + ':' + mm + ' ' + ampm + ' (UTC+6:30)'
    }
    if (rest) {
      rest.textContent = resting ? "It's my rest hours, so a reply may run a touch later." : ''
    }
  }
  update()
  // Align to the start of the next minute so the displayed time flips exactly
  // on the minute boundary instead of drifting up to 59s from page-load time.
  const delay = 60000 - (Date.now() % 60000)
  window.setTimeout(() => {
    update()
    window.setInterval(update, 60000)
  }, delay)
}

initContactStatus()
