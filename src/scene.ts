import * as THREE from 'three'
import { LABELS, type LabelDef } from './labels'

export type SceneMetrics = { r: number; vol: number; area: number; flatten: number }

export type SceneAPI = {
  dispose: () => void
  closeBoard: () => void
}

type LabelSprite = THREE.Sprite & {
  userData: { labelId: string; baseScale: { x: number; y: number }; facing?: number }
}

const POINTS = 4200
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const LABEL_RADIUS = 2.42
const LABEL_W = 384
const LABEL_H = 128
const DOT_X = 34
const DOT_R = 7
const DOT_NORM = DOT_X / LABEL_W
const MORPH_SPREAD = 0.62
const MORPH_WINDOW = 0.42
const MORPH_DURATION = 1.18
const SQUARE_HALF = 2.95
const GRID = Math.ceil(Math.sqrt(POINTS))
const SPARK_COUNT = 8
const CLICK_THRESHOLD = 6

function makeSphereSprite(): THREE.Texture {
  const s = 128
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grad.addColorStop(0.0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(180,210,255,0.85)')
  grad.addColorStop(0.55, 'rgba(96,165,250,0.35)')
  grad.addColorStop(1.0, 'rgba(96,165,250,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  return tex
}

function makeNameSprite(text: string, renderer: THREE.WebGLRenderer): THREE.Sprite {
  const W = 1024
  const H = 256
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, W, H)
  ctx.font = '600 96px "JetBrains Mono", ui-monospace, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(96,165,250,0.95)'
  ctx.shadowBlur = 38
  ctx.fillStyle = 'rgba(96,165,250,0.45)'
  ctx.fillText(text, W / 2, H / 2)
  ctx.shadowBlur = 18
  ctx.fillStyle = 'rgba(220,236,255,0.9)'
  ctx.fillText(text, W / 2, H / 2)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(text, W / 2, H / 2)
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(2.6, 0.65, 1)
  sprite.renderOrder = -1
  return sprite
}

function makeLabelSpriteTex(text: string): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = LABEL_W
  c.height = LABEL_H
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, LABEL_W, LABEL_H)
  // glowing dot
  ctx.shadowColor = 'rgba(96,165,250,1)'
  ctx.shadowBlur = 28
  ctx.fillStyle = 'rgba(150,200,255,0.85)'
  ctx.beginPath()
  ctx.arc(DOT_X, LABEL_H / 2, DOT_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 10
  ctx.fillStyle = '#f8fafc'
  ctx.beginPath()
  ctx.arc(DOT_X, LABEL_H / 2, DOT_R * 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  const textX = DOT_X + DOT_R + 22
  ctx.font = '500 52px "JetBrains Mono", ui-monospace, Menlo, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(96,165,250,0.95)'
  ctx.shadowBlur = 26
  ctx.fillStyle = 'rgba(96,165,250,0.55)'
  ctx.fillText(text, textX, LABEL_H / 2)
  ctx.shadowBlur = 12
  ctx.fillStyle = 'rgba(220,236,255,0.95)'
  ctx.fillText(text, textX, LABEL_H / 2)
  ctx.shadowBlur = 0
  ctx.fillStyle = '#f8fafc'
  ctx.fillText(text, textX, LABEL_H / 2)
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

function makeRippleTex(): THREE.Texture {
  const s = 128
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, s, s)
  ctx.shadowColor = 'rgba(96,165,250,0.95)'
  ctx.shadowBlur = 18
  ctx.strokeStyle = 'rgba(170,210,255,0.95)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, s / 2 - 14, 0, Math.PI * 2)
  ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  return tex
}

function makeSparkTex(): THREE.Texture {
  const s = 96
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0.0, 'rgba(255,255,245,1)')
  g.addColorStop(0.35, 'rgba(255,214,120,0.9)')
  g.addColorStop(0.65, 'rgba(255,138,40,0.55)')
  g.addColorStop(1.0, 'rgba(220,60,20,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  return tex
}

function smooth01(p: number): number {
  return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p)
}

export function createScene(opts: {
  canvas: HTMLCanvasElement
  container: HTMLElement
  onLabelClick: (id: string) => void
  onMetrics?: (m: SceneMetrics) => void
  onLamp?: (value: number) => void
}): SceneAPI {
  const { canvas, container, onLabelClick, onMetrics, onLamp } = opts
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0, 8.8)

  const positions = new Float32Array(POINTS * 3)
  const baseDirections = new Float32Array(POINTS * 3)
  const offsets = new Float32Array(POINTS)
  const sizes = new Float32Array(POINTS)
  const tints = new Float32Array(POINTS)

  for (let i = 0; i < POINTS; i++) {
    const t = i / (POINTS - 1)
    const y = 1 - t * 2
    const r = Math.sqrt(1 - y * y)
    const theta = GOLDEN_ANGLE * i
    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r
    baseDirections[i * 3 + 0] = x
    baseDirections[i * 3 + 1] = y
    baseDirections[i * 3 + 2] = z
    positions[i * 3 + 0] = x * 2
    positions[i * 3 + 1] = y * 2
    positions[i * 3 + 2] = z * 2
    offsets[i] = Math.random() * Math.PI * 2
    sizes[i] = 0.018 + Math.random() * 0.028
    tints[i] = Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aTint', new THREE.BufferAttribute(tints, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: makeSphereSprite() },
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uSizeScale: { value: 1 },
      uMouseLocal: { value: new THREE.Vector3(99, 99, 99) },
      uHover: { value: 0 },
      uRadius: { value: 2.0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aTint;
      varying float vTint; varying float vBoost;
      uniform float uTime; uniform float uPixelRatio; uniform float uSizeScale;
      uniform vec3 uMouseLocal; uniform float uHover; uniform float uRadius;
      void main() {
        vTint = aTint;
        vec3 pos = position;
        float d = distance(pos, uMouseLocal);
        float falloff = uRadius * 0.55;
        float prox = 1.0 - smoothstep(0.0, falloff, d);
        float boost = prox * uHover;
        vBoost = boost;
        vec3 outward = normalize(pos);
        pos += outward * boost * 0.55;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        float dist = length(mv.xyz);
        float twinkle = 0.78 + 0.22 * sin(uTime * 1.6 + aTint * 8.0);
        gl_PointSize = aSize * 700.0 * uPixelRatio * uSizeScale * twinkle * (1.0 + boost * 1.6) / dist;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex; varying float vTint; varying float vBoost;
      void main() {
        vec4 tex = texture2D(uTex, gl_PointCoord);
        vec3 cool  = vec3(0.78, 0.92, 1.00);
        vec3 azure = vec3(0.38, 0.65, 0.98);
        vec3 hot   = vec3(0.92, 0.97, 1.00);
        vec3 col = mix(cool, azure, vTint);
        col = mix(col, hot, vBoost * 0.85);
        gl_FragColor = vec4(col, 1.0) * tex * (1.0 + vBoost * 0.6);
        if (gl_FragColor.a < 0.02) discard;
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const sphere = new THREE.Points(geometry, material)
  scene.add(sphere)

  // Equatorial ring
  const ringGeo = new THREE.RingGeometry(2.55, 2.555, 256)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  scene.add(ring)

  // Central name sprite
  const nameSprite = makeNameSprite('minlaxz', renderer)
  scene.add(nameSprite)

  // Label sprites + ripple rings
  const rippleTex = makeRippleTex()
  const labelSprites: LabelSprite[] = []
  const labelRipples: { sprite: THREE.Sprite; phase: number }[] = []
  LABELS.forEach((L: LabelDef, i: number) => {
    const sm = new THREE.SpriteMaterial({
      map: makeLabelSpriteTex(L.text),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    })
    const sp = new THREE.Sprite(sm) as LabelSprite
    sp.scale.set(0.95, 0.32, 1)
    sp.renderOrder = 2
    sp.position.copy(L.dir).multiplyScalar(LABEL_RADIUS)
    sp.userData = { labelId: L.id, baseScale: { x: sp.scale.x, y: sp.scale.y } }
    sphere.add(sp)
    labelSprites.push(sp)

    const rm = new THREE.SpriteMaterial({
      map: rippleTex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    })
    const rs = new THREE.Sprite(rm)
    rs.scale.set(0.14, 0.14, 1)
    rs.renderOrder = 3
    scene.add(rs)
    labelRipples.push({ sprite: rs, phase: i * 0.33 })
  })

  // Square target positions for the morph
  const squarePositions = new Float32Array(POINTS * 3)
  const morphDelay = new Float32Array(POINTS)
  for (let i = 0; i < POINTS; i++) {
    const gx = i % GRID
    const gy = Math.floor(i / GRID)
    const nx = GRID > 1 ? gx / (GRID - 1) : 0.5
    const ny = GRID > 1 ? gy / (GRID - 1) : 0.5
    squarePositions[i * 3 + 0] = (nx - 0.5) * 2 * SQUARE_HALF
    squarePositions[i * 3 + 1] = (0.5 - ny) * 2 * SQUARE_HALF
    squarePositions[i * 3 + 2] = (tints[i] - 0.5) * 0.05
  }
  const _bd = new THREE.Vector3()
  function computeMorphDelay(originDir: THREE.Vector3) {
    for (let i = 0; i < POINTS; i++) {
      _bd.set(baseDirections[i * 3 + 0]!, baseDirections[i * 3 + 1]!, baseDirections[i * 3 + 2]!)
      const align = _bd.dot(originDir)
      morphDelay[i] = (1 - align) * 0.5 * MORPH_SPREAD
    }
  }
  const blogLabel = LABELS.find((l) => l.blog)
  if (blogLabel) computeMorphDelay(blogLabel.dir)

  // Sparks
  const sparkTex = makeSparkTex()
  const sparkStates: { dot: number; intensity: number; nextFire: number }[] = []
  const sparkPool: THREE.Sprite[] = []
  function pickDot(exclude: number): number {
    let n = Math.floor(Math.random() * POINTS)
    if (n === exclude) n = (n + 1) % POINTS
    return n
  }
  for (let i = 0; i < SPARK_COUNT; i++) {
    sparkStates.push({ dot: pickDot(-1), intensity: 0, nextFire: 1.5 + Math.random() * 6 })
    const sm = new THREE.SpriteMaterial({
      map: sparkTex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    })
    const sp = new THREE.Sprite(sm)
    sp.scale.set(0.11, 0.11, 1)
    sphere.add(sp)
    sparkPool.push(sp)
  }

  // Interaction state
  let morph = 0
  let morphTarget = 0
  let boardOpen = false
  // Lamp charge — the interaction signal that drives the pendant glow. Sphere
  // hover/drag/tap pumps it; idle cools it. Latched to full while a board is
  // open. Published to the host each frame via onLamp.
  let lampCharge = 0
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  const canvasPointer = { x: 0, y: 0, inside: false, down: false }
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const hitSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2.0)
  const hitPoint = new THREE.Vector3()
  const mouseWorld = new THREE.Vector3(99, 99, 99)
  const mouseLocal = new THREE.Vector3(99, 99, 99)
  let hoverTarget = 0
  let hoverEased = 0
  let hoveredLabelId: string | null = null
  let spinBoostX = 0
  let spinBoostY = 0
  let lastPointer: { x: number; y: number } | null = null
  let dragDistance = 0

  const handlers: Array<() => void> = []

  // ── Halo ring power switch ───────────────────────────────────────────────
  // The ring under the top bar is the lamp's power switch. Clicking it cycles a
  // persistent power floor; sphere hover/drag/tap pumps brightness ABOVE that
  // floor, idle cools it back down. The combined level is published to the host
  // each frame via onLamp (which drives the --lamp var + P=V·I meter).
  // States loop: 3W (offset, on load) → 12W → 24W → 12W → 3W → 0W (off) → 3W…
  const RING_POWER_STATES = [3, 12, 24, 12, 3, 0] // watts; index 0 = initial 3W offset
  const wattToLc = (w: number) => Math.sqrt(w / 24)
  let ringPowerIndex = 0
  let ringTargetLc = wattToLc(RING_POWER_STATES[ringPowerIndex]!)
  let ringLamp = ringTargetLc // start already glowing at the 3W offset
  const ringEl = document.getElementById('pendant-ring')

  function applyRingPower() {
    const w = RING_POWER_STATES[ringPowerIndex]!
    ringTargetLc = wattToLc(w)
    if (ringEl) {
      ringEl.title = w === 0 ? 'Lamp off — click to switch on' : 'Lamp ' + w + ' W — click to change'
      ringEl.setAttribute('aria-label', w === 0 ? 'Halo lamp off' : 'Halo lamp ' + w + ' watts')
    }
  }
  function cycleRingPower() {
    ringPowerIndex = (ringPowerIndex + 1) % RING_POWER_STATES.length
    applyRingPower()
  }
  if (ringEl) {
    applyRingPower()
    const onRingClick = () => cycleRingPower()
    const onRingKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        cycleRingPower()
      }
    }
    ringEl.addEventListener('click', onRingClick)
    ringEl.addEventListener('keydown', onRingKey)
    handlers.push(() => ringEl.removeEventListener('click', onRingClick))
    handlers.push(() => ringEl.removeEventListener('keydown', onRingKey))
  }
  // seed the glow at the 3W offset before the first animation frame
  onLamp?.(ringLamp)

  function hitLabelAt(px: number, py: number, w: number, h: number): { id: string } | null {
    ndc.set((px / w) * 2 - 1, -((py / h) * 2 - 1))
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(labelSprites, false)
    if (!hits.length) return null
    const sp = hits[0]!.object as LabelSprite
    if ((sp.userData.facing || 0) < 0.18) return null
    return { id: sp.userData.labelId }
  }

  if (!reduceMotion) {
    const onWindowMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5
      mouse.ty = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onWindowMove, { passive: true })
    handlers.push(() => window.removeEventListener('pointermove', onWindowMove))

    const onEnter = () => {
      canvasPointer.inside = true
    }
    const onLeave = () => {
      canvasPointer.inside = false
      canvasPointer.down = false
      hoverTarget = 0
      lastPointer = null
      container.classList.remove('label-hover')
      hoveredLabelId = null
    }
    const onDown = (e: PointerEvent) => {
      if (boardOpen) return
      canvasPointer.down = true
      container.setPointerCapture(e.pointerId)
      lastPointer = { x: e.clientX, y: e.clientY }
      dragDistance = 0
      lampCharge = Math.min(1, lampCharge + 0.14) // tap pumps the lamp
    }
    const onUp = (e: PointerEvent) => {
      if (boardOpen) return
      canvasPointer.down = false
      try {
        container.releasePointerCapture(e.pointerId)
      } catch {}
      if (dragDistance < CLICK_THRESHOLD) {
        const r = container.getBoundingClientRect()
        const hit = hitLabelAt(e.clientX - r.left, e.clientY - r.top, r.width, r.height)
        if (hit) {
          boardOpen = true
          morphTarget = 1
          hoverTarget = 0
          hoveredLabelId = null
          container.classList.remove('label-hover')
          const L = LABELS.find((l) => l.id === hit.id)
          if (L) computeMorphDelay(L.dir)
          onLabelClick(hit.id)
        }
      }
      lastPointer = null
    }
    const onMove = (e: PointerEvent) => {
      if (boardOpen) return
      const r = container.getBoundingClientRect()
      const px = e.clientX - r.left
      const py = e.clientY - r.top
      canvasPointer.x = px
      canvasPointer.y = py
      canvasPointer.inside = true
      if (canvasPointer.down && lastPointer) {
        const dx = (e.clientX - lastPointer.x) / r.width
        const dy = (e.clientY - lastPointer.y) / r.height
        spinBoostY -= dx * 2.4
        spinBoostX += dy * 1.8
        dragDistance += Math.abs(e.clientX - lastPointer.x) + Math.abs(e.clientY - lastPointer.y)
      }
      if (lastPointer) {
        lastPointer.x = e.clientX
        lastPointer.y = e.clientY
      } else if (canvasPointer.down) {
        lastPointer = { x: e.clientX, y: e.clientY }
      }
      ndc.set((px / r.width) * 2 - 1, -((py / r.height) * 2 - 1))
      raycaster.setFromCamera(ndc, camera)
      hitSphere.radius = material.uniforms.uRadius!.value + 0.15
      const hit = raycaster.ray.intersectSphere(hitSphere, hitPoint)
      if (hit) {
        mouseWorld.copy(hitPoint)
        hoverTarget = 1
      } else {
        hoverTarget = 0
      }
      if (!canvasPointer.down) {
        const lh = hitLabelAt(px, py, r.width, r.height)
        container.classList.toggle('label-hover', !!lh)
        hoveredLabelId = lh ? lh.id : null
      }
    }
    container.addEventListener('pointerenter', onEnter)
    container.addEventListener('pointerleave', onLeave)
    container.addEventListener('pointerdown', onDown)
    container.addEventListener('pointerup', onUp)
    container.addEventListener('pointermove', onMove, { passive: true })
    handlers.push(() => container.removeEventListener('pointerenter', onEnter))
    handlers.push(() => container.removeEventListener('pointerleave', onLeave))
    handlers.push(() => container.removeEventListener('pointerdown', onDown))
    handlers.push(() => container.removeEventListener('pointerup', onUp))
    handlers.push(() => container.removeEventListener('pointermove', onMove))
  }

  // Resize
  function resize() {
    const rect = container.getBoundingClientRect()
    const w = Math.max(1, rect.width)
    const h = Math.max(1, rect.height)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    material.uniforms.uPixelRatio!.value = renderer.getPixelRatio()
    material.uniforms.uSizeScale!.value = Math.min(1, w / 560)
    const narrow = window.innerWidth <= 820
    camera.position.z = narrow ? 7.0 : 8.8
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()
  handlers.push(() => ro.disconnect())

  // Render loop
  const positionAttr = geometry.attributes.position!
  const pArr = positionAttr.array as Float32Array
  let t = 0
  const clock = new THREE.Clock()
  const _invMat = new THREE.Matrix4()
  const _labelWorld = new THREE.Vector3()
  const _camDir = new THREE.Vector3()
  const _cameraRight = new THREE.Vector3()
  let metricsTick = 0
  const DEMO_START_DELAY = 0.9
  const DEMO_LABEL_DURATION = 0.55
  const DEMO_GAP = 0.18
  let demoClockStart = -1
  function demoBoostFor(i: number, tNow: number): number {
    if (demoClockStart < 0) return 0
    const elapsed = tNow - demoClockStart - DEMO_START_DELAY
    if (elapsed < 0) return 0
    const cycle = DEMO_LABEL_DURATION + DEMO_GAP
    const local = elapsed - i * cycle
    if (local < 0 || local > DEMO_LABEL_DURATION) return 0
    const p = local / DEMO_LABEL_DURATION
    return Math.sin(p * Math.PI)
  }

  let rafId = 0
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05)
    t += dt
    if (boardOpen) hoverTarget = 0

    if (morph !== morphTarget) {
      const dir = morphTarget > morph ? 1 : -1
      morph += (dir * dt) / MORPH_DURATION
      morph = Math.max(0, Math.min(1, morph))
    }
    const flat = smooth01(morph)
    const breath = 2.0 + Math.sin(t * 0.55) * 0.18
    material.uniforms.uRadius!.value = breath

    metricsTick++
    if (metricsTick % 5 === 0 && onMetrics) {
      onMetrics({
        r: breath,
        vol: (4 / 3) * Math.PI * breath * breath * breath,
        area: 4 * Math.PI * breath * breath,
        flatten: flat,
      })
    }

    for (let i = 0; i < POINTS; i++) {
      const ix = i * 3
      const dx = baseDirections[ix + 0]!
      const dy = baseDirections[ix + 1]!
      const dz = baseDirections[ix + 2]!
      const w = 0.05 * Math.sin(t * 0.8 + offsets[i]!)
      const r = breath + w
      const spx = dx * r,
        spy = dy * r,
        spz = dz * r
      if (morph <= 0.0001) {
        pArr[ix + 0] = spx
        pArr[ix + 1] = spy
        pArr[ix + 2] = spz
      } else {
        let p = (morph * (MORPH_SPREAD + MORPH_WINDOW) - morphDelay[i]!) / MORPH_WINDOW
        p = smooth01(p)
        pArr[ix + 0] = spx + (squarePositions[ix + 0]! - spx) * p
        pArr[ix + 1] = spy + (squarePositions[ix + 1]! - spy) * p
        pArr[ix + 2] = spz + (squarePositions[ix + 2]! - spz) * p
      }
    }
    positionAttr.needsUpdate = true

    // sparks
    for (let i = 0; i < SPARK_COUNT; i++) {
      const s = sparkStates[i]!
      const sp = sparkPool[i]!
      if (flat > 0.04) {
        sp.material.opacity = 0
        s.intensity = 0
        continue
      }
      s.nextFire -= dt
      if (s.nextFire <= 0) {
        s.dot = pickDot(s.dot)
        s.intensity = 1.0
        s.nextFire = 2.5 + Math.random() * 7.5
      }
      if (s.intensity > 0.01) {
        const dIx = s.dot * 3
        sp.position.set(pArr[dIx + 0]!, pArr[dIx + 1]!, pArr[dIx + 2]!)
        sp.material.opacity = Math.min(1, s.intensity)
        const sc = 0.06 + s.intensity * 0.12
        sp.scale.set(sc, sc, 1)
      } else {
        sp.material.opacity = 0
      }
      s.intensity = Math.max(0, s.intensity - dt * 2.4)
    }

    // name sprite — drift + fade as board forms
    const nameDriftX = Math.sin(t * 0.42) * 0.07
    const nameDriftY = Math.cos(t * 0.31) * 0.045
    const nameDriftZ = Math.sin(t * 0.23) * 0.95
    nameSprite.position.set(nameDriftX, nameDriftY, nameDriftZ)
    const nameBreath = 0.5 + 0.5 * Math.sin(t * 0.65)
    const zNorm = nameDriftZ / 0.95
    const depthScaleName = 1.0 + zNorm * 0.1
    nameSprite.scale.x = (2.6 + nameBreath * 0.06) * depthScaleName
    nameSprite.scale.y = (0.65 + nameBreath * 0.018) * depthScaleName
    nameSprite.material.opacity = (0.55 + 0.35 * (zNorm * 0.5 + 0.5) + nameBreath * 0.08) * (1 - flat)

    // rotation
    const runFactor = 1 - flat
    const autoFactor = (1 - hoverEased * 0.6) * runFactor
    sphere.rotation.y += dt * 0.08 * autoFactor + spinBoostY * dt * 3.2 * runFactor
    sphere.rotation.x += dt * 0.022 * autoFactor + spinBoostX * dt * 3.2 * runFactor
    if (flat > 0.001) {
      const settle = Math.pow(0.0009, dt * flat)
      sphere.rotation.x *= settle
      sphere.rotation.y *= settle
    }
    ring.rotation.z += dt * 0.04 * (0.3 + 0.7 * runFactor)
    ring.material.opacity = 0.16 * (1 - flat)
    spinBoostX *= Math.pow(0.001, dt)
    spinBoostY *= Math.pow(0.001, dt)

    // parallax camera
    mouse.x += (mouse.tx - mouse.x) * 0.045
    mouse.y += (mouse.ty - mouse.y) * 0.045
    const parallax = 1 - 0.75 * flat
    camera.position.x = mouse.x * 0.9 * parallax
    camera.position.y = -mouse.y * 0.7 * parallax
    camera.lookAt(0, 0, 0)
    hoverEased += (hoverTarget - hoverEased) * Math.min(1, dt * 6)

    // Lamp — the ring power floor sets a baseline; sphere hover/drag/tap pumps
    // charge ABOVE it; idle cools the pumped charge back down to the floor.
    // While a board is open the lamp latches to full; otherwise it dims as the
    // sphere flattens. Published to the host to drive --lamp + the P=V·I meter.
    const dragMag = Math.abs(spinBoostX) + Math.abs(spinBoostY)
    let lampPump = hoverEased * 0.22 * dt // hovering the sphere warms it
    // dt-scaled so the charge rate is frame-rate independent (matches the old
    // 60Hz feel: cap 3.0/s, drag gain 1.8/s per unit of drag magnitude)
    lampPump += Math.min(3.0 * dt, dragMag * 1.8 * dt) // dragging spikes it harder
    lampCharge = Math.min(1, lampCharge + lampPump)
    lampCharge = Math.max(0, lampCharge - dt * 0.07) // gentle cool-down
    ringLamp += (ringTargetLc - ringLamp) * Math.min(1, dt * 4) // ease between clicked ring states
    if (boardOpen) lampCharge = 1 // latched: an open board holds full power
    const base = Math.max(lampCharge, ringLamp) // ring = persistent floor, sphere pumps above
    const lampOut = boardOpen ? 1 : base * (1 - flat)
    onLamp?.(lampOut)

    sphere.updateMatrixWorld()
    _invMat.copy(sphere.matrixWorld).invert()
    mouseLocal.copy(mouseWorld).applyMatrix4(_invMat)
    material.uniforms.uMouseLocal!.value.copy(mouseLocal)

    // labels — opacity by facing + ripple ring
    _camDir.copy(camera.position).normalize()
    if (demoClockStart < 0 && !reduceMotion) demoClockStart = t
    const labelFade = 1 - flat
    for (let i = 0; i < labelSprites.length; i++) {
      const sp = labelSprites[i]!
      sp.getWorldPosition(_labelWorld)
      const facing = _labelWorld.clone().normalize().dot(_camDir)
      sp.userData.facing = flat > 0.05 ? -1 : facing
      const vis = Math.max(0, Math.min(1, (facing + 1.0) / 1.4))
      const eased = vis * vis * (3 - 2 * vis)
      const op = 0.16 + eased * 0.79
      const depthScale = 0.82 + eased * 0.18
      const breathL = 1 + 0.04 * Math.sin(t * 1.2 + i * 1.7)
      const isHovered = hoveredLabelId === sp.userData.labelId
      const hoverBoost = isHovered ? 1 : 0
      const demoBoost = reduceMotion ? 0 : demoBoostFor(i, t)
      const popBoost = Math.max(hoverBoost, demoBoost)
      const popScale = 1 + popBoost * 0.22
      const popOp = popBoost * 0.18
      sp.material.opacity = Math.min(1, op + popOp) * labelFade
      const bs = sp.userData.baseScale
      const liveScaleX = bs.x * breathL * depthScale * popScale
      const liveScaleY = bs.y * breathL * depthScale * popScale
      sp.scale.x = liveScaleX
      sp.scale.y = liveScaleY

      const rs = labelRipples[i]!.sprite
      _cameraRight.setFromMatrixColumn(camera.matrixWorld, 0)
      const dotOffset = (DOT_NORM - 0.5) * liveScaleX
      rs.position.copy(_labelWorld).addScaledVector(_cameraRight, dotOffset)
      if (eased > 0.4 && !reduceMotion && flat < 0.05) {
        const ph = (t * 0.5 + labelRipples[i]!.phase) % 1
        const growth = 0.55 + ph * 1.55
        const rippleOp = (1 - ph) * (1 - ph) * 0.85
        const haloBoost = 1 + popBoost * 1.6
        rs.material.opacity = (rippleOp * (eased - 0.4)) / 0.6 * haloBoost
        const baseSize = 0.13
        rs.scale.set(baseSize * growth, baseSize * growth, 1)
      } else {
        rs.material.opacity = 0
      }
    }

    material.uniforms.uHover!.value = hoverEased
    material.uniforms.uTime!.value = t
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  const onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(rafId)
    else {
      clock.getDelta()
      rafId = requestAnimationFrame(tick)
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  handlers.push(() => document.removeEventListener('visibilitychange', onVisibility))

  return {
    dispose() {
      cancelAnimationFrame(rafId)
      handlers.forEach((fn) => fn())
      geometry.dispose()
      // sphere shader sampler texture
      const uTex = material.uniforms.uTex?.value as THREE.Texture | undefined
      uTex?.dispose()
      material.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      // central name sprite owns its canvas texture + material
      nameSprite.material.map?.dispose()
      nameSprite.material.dispose()
      // each label sprite has its own baked canvas texture + material
      labelSprites.forEach((sp) => {
        sp.material.map?.dispose()
        sp.material.dispose()
      })
      // ripple sprites share rippleTex (disposed below) but each has its own material
      labelRipples.forEach((r) => r.sprite.material.dispose())
      // spark sprites share sparkTex (disposed below) but each has its own material
      sparkPool.forEach((sp) => sp.material.dispose())
      rippleTex.dispose()
      sparkTex.dispose()
      renderer.dispose()
    },
    closeBoard() {
      boardOpen = false
      morphTarget = 0
    },
  }
}
