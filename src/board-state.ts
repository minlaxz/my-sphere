// Single owner of the board / morph state machine.
//
//   idle ──open(id)──▶ morphing-in ──morph ≥ PANEL_REVEAL──▶ open
//    ▲                     │                                  │
//    └──morph ≤ 0── morphing-out ◀──────────close()───────────┘
//
// The scene advances `morph` each frame via tick(); the board panel and the
// lamp react to phase changes via subscribe(). Nothing else holds a copy.

export type BoardPhase = 'idle' | 'morphing-in' | 'open' | 'morphing-out'

export type BoardState = {
  phase: BoardPhase
  /** Label id being shown. Set from open() until the machine returns to idle. */
  id: string | null
  /** 0 = sphere, 1 = flat board. Advances linearly at 1 / MORPH_DURATION per second. */
  morph: number
}

/** Seconds for a full sphere ⇄ board morph. */
export const MORPH_DURATION = 1.18
/** Fraction of the morph at which the panel reveals (≈ 430 ms of 1180). */
export const PANEL_REVEAL = 0.36

export type BoardAction = { type: 'open'; id: string } | { type: 'close' } | { type: 'tick'; dt: number }

export const IDLE: BoardState = { phase: 'idle', id: null, morph: 0 }

/** True while a board is opening or open. False while idle or morphing back out. */
export function isOpen(s: BoardState): boolean {
  return s.phase === 'morphing-in' || s.phase === 'open'
}

export function reduceBoard(s: BoardState, a: BoardAction): BoardState {
  switch (a.type) {
    case 'open':
      return s.phase === 'idle' ? { phase: 'morphing-in', id: a.id, morph: s.morph } : s
    case 'close':
      return isOpen(s) ? { ...s, phase: 'morphing-out' } : s
    case 'tick': {
      const step = a.dt / MORPH_DURATION
      switch (s.phase) {
        case 'morphing-in': {
          const morph = Math.min(1, s.morph + step)
          return { ...s, morph, phase: morph >= PANEL_REVEAL ? 'open' : 'morphing-in' }
        }
        case 'open':
          return s.morph >= 1 ? s : { ...s, morph: Math.min(1, s.morph + step) }
        case 'morphing-out': {
          const morph = Math.max(0, s.morph - step)
          return morph <= 0 ? IDLE : { ...s, morph }
        }
        case 'idle':
          return s
      }
    }
  }
}

export type BoardStore = {
  get: () => BoardState
  open: (id: string) => void
  close: () => void
  tick: (dt: number) => void
  /** Called only when `phase` changes. Returns an unsubscribe function. */
  subscribe: (fn: (state: BoardState, prev: BoardState) => void) => () => void
}

export function createBoardStore(initial: BoardState = IDLE): BoardStore {
  let state = initial
  const subs = new Set<(s: BoardState, p: BoardState) => void>()
  const dispatch = (a: BoardAction) => {
    const prev = state
    state = reduceBoard(prev, a)
    if (state.phase !== prev.phase) subs.forEach((fn) => fn(state, prev))
  }
  return {
    get: () => state,
    open: (id) => dispatch({ type: 'open', id }),
    close: () => dispatch({ type: 'close' }),
    tick: (dt) => dispatch({ type: 'tick', dt }),
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}
