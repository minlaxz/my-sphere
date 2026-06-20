import './style.css'
import { inject } from '@vercel/analytics'
import { createScene } from './scene'
import { mountBoard } from './blog'

if (import.meta.env.PROD) {
  inject()
}

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <div class="field" aria-hidden="true"></div>
  <div class="nightfall" aria-hidden="true"></div>
  <div class="backlight" aria-hidden="true"></div>
  <div class="pendant" id="pendant" aria-hidden="true">
    <span class="pendant-canopy"></span>
    <span class="pendant-cord"></span>
    <span class="pendant-ring"></span>
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
          Everything you wanna know is <em>inside the sphere</em> — go ahead, explore it and have fun.
          Tap <em>blog</em> to watch it unwarp into my writing. Work with me, I do
          <em>enterprise AI Solutions</em> to close the gaps that matter for your Business.
          <br /><a href="mailto:hello@minlaxz.icu">hello@minlaxz.icu</a>
        </p>
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
        Designed by <a href="http://open-design.ai/" target="_blank" rel="noopener">Open Design</a>
        with <a href="https://www.tasteskill.dev/" target="_blank" rel="noopener">Taste Skill</a>
        and built using <a href="https://multica.ai/" target="_blank" rel="noopener">Multica</a>.
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

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let sceneApi: ReturnType<typeof createScene> | null = null

const board = mountBoard({
  panel: document.querySelector<HTMLDivElement>('#blog-panel')!,
  list: document.querySelector<HTMLDivElement>('#blog-list')!,
  count: document.querySelector<HTMLSpanElement>('#blog-count')!,
  search: document.querySelector<HTMLInputElement>('#blog-search-input')!,
  titleText: document.querySelector<HTMLSpanElement>('#blog-title-text')!,
  closeBtn: document.querySelector<HTMLButtonElement>('#blog-close')!,
  scene: sceneEl,
  sceneHint,
  reduceMotion,
  onMorphIn: () => {
    // morph state lives inside the scene; the label click triggers it from
    // there, so this side just needs to know a board has opened. Pull the
    // pendant up — cord retracts, ring sticks to the top edge at full power.
    pendantEl.classList.add('lamp-up')
  },
  onMorphOut: () => {
    pendantEl.classList.remove('lamp-up')
    sceneApi?.closeBoard()
  },
})

sceneApi = createScene({
  canvas,
  container: sceneEl,
  onLabelClick: (id) => board.open(id),
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
    rootStyle.setProperty('--lamp', value.toFixed(3))
    const v = value * 12
    const i = value * 2.0
    lampVEl.textContent = v.toFixed(1)
    lampIEl.textContent = i.toFixed(2)
    lampPEl.textContent = (v * i).toFixed(1)
  },
})
