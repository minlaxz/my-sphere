import * as THREE from 'three'

export type LabelAction = { label: string; href: string }

export type LabelDef = {
  id: string
  text: string
  dir: THREE.Vector3
  blog?: boolean
  eyebrow?: string
  title?: string
  body?: string
  action?: LabelAction | null
}

export const LABELS: LabelDef[] = [
  {
    id: 'idea',
    text: 'idea',
    dir: new THREE.Vector3(0.18, 0.88, 0.44).normalize(),
    eyebrow: 'the whole portfolio · in one line',
    title: 'The most <em>minimalist</em> and <em>informative</em> — at the same time.',
    body:
      "That's the whole brief. One sphere, a handful of labels, no scroll required. " +
      "Everything you need to know about me lives behind one of these orbiting words " +
      "— tap any of them and the rest of the portfolio unfolds, quietly. " +
      "No second page. No third. Just this.",
    action: null,
  },
  {
    id: 'about',
    text: 'about',
    dir: new THREE.Vector3(0.92, 0.32, 0.35).normalize(),
    eyebrow: 'who · min min latt',
    title: "Let's <em>build</em> together.",
    body:
      "I'm Min Min Latt — an AI Enthusiast with 4 years of hands-on AWS (no cert, all production), " +
      "6 years as an EOR at a Japanese company sharpening a near-obsessive eye for detail, " +
      "and 1.5 years deep in the AI-agent rabbit hole. I like restraint, legibility, " +
      "and shipping things that quietly do their job.",
    action: null,
  },
  {
    id: 'github',
    text: 'github',
    dir: new THREE.Vector3(-0.58, -0.42, 0.72).normalize(),
    eyebrow: 'open source · experiments',
    title: 'Where the <em>prototypes</em> live.',
    body:
      "Small, focused repositories you can read in one sitting — multimodal agents, " +
      "local-first inference, tooling for thought. Mostly experiments that earn their complexity.",
    action: { label: 'Open GitHub', href: 'https://github.com/minlaxz' },
  },
  {
    id: 'linkedin',
    text: 'linkedin',
    dir: new THREE.Vector3(-0.28, 0.72, 0.62).normalize(),
    eyebrow: 'work · collaborations',
    title: 'The <em>longer</em> form.',
    body:
      "Roles, collaborations, and what I've shipped alongside other humans. " +
      "Reach out if you'd like to build something together — I prefer slow conversations over quick pitches.",
    action: { label: 'Open LinkedIn', href: 'https://www.linkedin.com/' },
  },
  {
    id: 'blog',
    text: 'blog',
    blog: true,
    dir: new THREE.Vector3(0.3, -0.52, 0.8).normalize(),
  },
]

export const BOARD_TITLES: Record<string, string> = {
  idea: 'Idea',
  about: 'About',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  blog: 'Blog',
}

export type Post = {
  title: string
  date: string
  read: string
  summary: string
  tags: string[]
}

export const POSTS: Post[] = [
  {
    title: 'I stopped fighting the model and started designing the loop',
    date: '2026 · 05',
    read: '6 min',
    summary:
      "Most agent failures aren't the model being dumb — they're a loop with no exit, no memory, and no place to ask for help. Here's the control-flow I reach for before I touch a prompt.",
    tags: ['Agents', 'Design', 'Loops'],
  },
  {
    title: 'Local-first inference on a single AWS box',
    date: '2026 · 04',
    read: '9 min',
    summary:
      'Four years of hands-on AWS, no certificate, all production. A pragmatic setup for running small models close to your data without renting a GPU fleet you’ll forget to turn off.',
    tags: ['AWS', 'Inference', 'Cost'],
  },
  {
    title: 'The most boring prompt is the one that ships',
    date: '2026 · 03',
    read: '5 min',
    summary:
      'Clever prompts demo well and break quietly. I’d rather have a dull, explicit, testable instruction that does the same thing on Tuesday as it did on Friday.',
    tags: ['Prompting', 'Reliability'],
  },
  {
    title: 'Six years as an EOR taught me how to read software',
    date: '2026 · 02',
    read: '7 min',
    summary:
      'Detail work for a Japanese company rewired how I look at systems: where the edge cases hide, why the boring field matters, and how restraint is a feature, not a limitation.',
    tags: ['Craft', 'Process'],
  },
  {
    title: 'Multimodal agents that read your screen, not your mind',
    date: '2026 · 01',
    read: '8 min',
    summary:
      'Vision + tools beats a bigger context window for most real tasks. Notes from wiring an assistant that looks at what you’re doing and offers the next move, quietly.',
    tags: ['Multimodal', 'UX'],
  },
  {
    title: 'Token budgets are a design constraint, not an afterthought',
    date: '2025 · 12',
    read: '6 min',
    summary:
      'If you don’t budget tokens up front, the agent will spend them for you — usually re-reading things it already knew. Treating the budget like a layout grid changed how I architect.',
    tags: ['Cost', 'Architecture'],
  },
  {
    title: 'Small repositories you can read in one sitting',
    date: '2025 · 11',
    read: '4 min',
    summary:
      'A quiet argument for fewer files, fewer abstractions, and code that earns its complexity. The repos I’m proudest of are the ones a stranger can finish reading over coffee.',
    tags: ['Open Source', 'Simplicity'],
  },
]
