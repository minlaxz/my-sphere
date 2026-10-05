import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBoardStore, isOpen, MORPH_DURATION, PANEL_REVEAL } from './board-state.ts'

const run = (store: ReturnType<typeof createBoardStore>, seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) store.tick(dt)
}

test('open → reveal → full → close → idle', () => {
  const s = createBoardStore()
  const phases: string[] = []
  s.subscribe((st) => phases.push(st.phase))

  s.open('blog')
  assert.equal(s.get().phase, 'morphing-in')
  assert.equal(s.get().id, 'blog')

  run(s, MORPH_DURATION * PANEL_REVEAL + 0.05)
  assert.equal(s.get().phase, 'open')
  assert.ok(s.get().morph >= PANEL_REVEAL)

  run(s, MORPH_DURATION)
  assert.equal(s.get().morph, 1)
  assert.equal(s.get().phase, 'open')

  s.close()
  assert.equal(s.get().phase, 'morphing-out')
  assert.equal(isOpen(s.get()), false)
  assert.equal(s.get().id, 'blog', 'id kept until idle')

  run(s, MORPH_DURATION + 0.05)
  assert.deepEqual(s.get(), { phase: 'idle', id: null, morph: 0 })
  assert.deepEqual(phases, ['morphing-in', 'open', 'morphing-out', 'idle'])
})

test('guards: open only from idle, close only while open, subscribers fire on phase change only', () => {
  const s = createBoardStore()
  let fired = 0
  s.subscribe(() => fired++)

  s.close()
  assert.equal(s.get().phase, 'idle')
  s.open('about')
  s.open('idea')
  assert.equal(s.get().id, 'about', 'second open ignored')
  run(s, 0.1)
  assert.equal(fired, 1, 'ticks inside a phase do not notify')

  s.close() // close mid morph-in
  assert.equal(s.get().phase, 'morphing-out')
  run(s, 1)
  assert.equal(s.get().phase, 'idle')
  assert.equal(fired, 3)
})
