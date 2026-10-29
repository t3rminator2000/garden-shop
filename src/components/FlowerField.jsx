import { useMemo } from 'react'

// Фон баннера: цветущие ветки на тёмном поле, нарисованные кодом (SVG).
// Объём делают градиенты на лепестках, тень под цветком, блик сверху слева
// и три плана глубины: дальний размыт сильнее, ближний почти резкий.

const W = 1600
const H = 900

// Оттенки лепестков: от тёмного основания к светлому краю
const TONES = [
  { deep: '#7d4406', mid: '#dd9f14', edge: '#ffd862' },
  { deep: '#8c5207', mid: '#eaae1c', edge: '#ffe27e' },
  { deep: '#6d3a05', mid: '#cf9110', edge: '#f8cd4e' },
  { deep: '#95590a', mid: '#f2b824', edge: '#ffe994' },
]

function makeRng(seed) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Группы цветов: левый край, правый край и нижняя полоса. Верх по центру свободен под заголовок.
const CLUSTERS = [
  { x: 70, y: 600, sx: 180, sy: 300, n: 30, near: true },
  { x: 150, y: 420, sx: 150, sy: 220, n: 20, near: true },
  { x: 55, y: 230, sx: 120, sy: 180, n: 16 },
  { x: 210, y: 120, sx: 140, sy: 110, n: 9 },
  { x: 1520, y: 470, sx: 170, sy: 340, n: 28, near: true },
  { x: 1560, y: 160, sx: 110, sy: 150, n: 12 },
  { x: 1390, y: 60, sx: 120, sy: 90, n: 6 },
  { x: 330, y: 870, sx: 260, sy: 90, n: 20, near: true },
  { x: 760, y: 905, sx: 280, sy: 80, n: 18, near: true },
  { x: 1180, y: 860, sx: 250, sy: 95, n: 22, near: true },
  { x: 980, y: 760, sx: 220, sy: 70, n: 10 },
  { x: 520, y: 720, sx: 200, sy: 70, n: 9 },
]

// Зона заголовка и кнопки: туда цветы не ставим
const inTextZone = (x, y) => x > 430 && x < 1180 && y < 620

function buildScene() {
  const rnd = makeRng(20261029)
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5
  const flowers = []
  const leaves = []
  const buds = []
  const branches = []
  const petals = []

  for (const c of CLUSTERS) {
    const pts = []
    let tries = 0
    while (pts.length < c.n && tries < c.n * 14) {
      tries += 1
      const x = c.x + gauss() * c.sx
      const y = c.y + gauss() * c.sy
      if (x < -40 || x > W + 40 || y < 10 || y > H + 50 || inTextZone(x, y)) continue
      // чем ниже и ближе к краю, тем крупнее цветок
      const edge = Math.max(0, 1 - Math.min(x, W - x) / 420)
      const low = Math.max(0, (y - 420) / (H - 420))
      const r = 22 + edge * 20 + low * 26 + rnd() * 18 + (c.near ? 14 : 0)
      pts.push({
        x,
        y,
        r,
        rot: rnd() * 360,
        tone: Math.floor(rnd() * TONES.length),
        jitter: [rnd(), rnd(), rnd(), rnd(), rnd()],
        open: 0.82 + rnd() * 0.3,
      })
    }
    flowers.push(...pts)

    // ветки: соединяют соседние цветы группы
    const sorted = [...pts].sort((a, b) => a.x - b.x)
    for (let i = 0; i < sorted.length - 1; i += 1) {
      if (rnd() > 0.72) continue
      const a = sorted[i]
      const b = sorted[i + 1]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (dist > 260) continue
      const mx = (a.x + b.x) / 2 + (rnd() - 0.5) * 90
      const my = (a.y + b.y) / 2 + (rnd() - 0.5) * 90
      branches.push({
        d: `M${a.x.toFixed(0)} ${a.y.toFixed(0)} Q${mx.toFixed(0)} ${my.toFixed(0)} ${b.x.toFixed(0)} ${b.y.toFixed(0)}`,
        w: 2.5 + rnd() * 5,
        far: !c.near,
      })
    }

    for (const p of pts) {
      const n = 1 + Math.floor(rnd() * 3)
      for (let i = 0; i < n; i += 1) {
        const ang = rnd() * 360
        const dist = p.r * (1 + rnd() * 0.9)
        leaves.push({
          x: p.x + Math.cos((ang * Math.PI) / 180) * dist,
          y: p.y + Math.sin((ang * Math.PI) / 180) * dist,
          len: p.r * (0.9 + rnd() * 0.7),
          rot: ang,
          dark: rnd() > 0.45,
          far: !c.near,
        })
      }
      if (rnd() > 0.5) {
        const ang = rnd() * Math.PI * 2
        buds.push({ x: p.x + Math.cos(ang) * p.r * 1.25, y: p.y + Math.sin(ang) * p.r * 1.25, r: p.r * (0.18 + rnd() * 0.12) })
      }
    }
  }

  // отдельные лепестки в воздухе
  for (let i = 0; i < 14; i += 1) {
    const x = 220 + rnd() * 1180
    const y = 120 + rnd() * 620
    if (inTextZone(x, y) && rnd() > 0.25) continue
    petals.push({ x, y, r: 7 + rnd() * 9, rot: rnd() * 360, op: 0.3 + rnd() * 0.45 })
  }

  flowers.sort((a, b) => a.r - b.r)
  return { flowers, leaves, buds, branches, petals }
}

// Контур лепестка в долях радиуса: основание в центре цветка, кончик вверху
const PETAL = 'M0 0 C-0.40 -0.22 -0.52 -0.72 -0.30 -0.98 C-0.14 -1.16 0.14 -1.16 0.30 -0.98 C0.52 -0.72 0.40 -0.22 0 0 Z'

function Flower({ f }) {
  const { x, y, r, rot, tone, jitter, open } = f
  const petals = [0, 1, 2, 3, 4]
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${r.toFixed(1)})`}>
      {/* тень под цветком отделяет его от веток */}
      <g fill="#0a0702" opacity="0.5" transform="translate(0.05 0.08)">
        {petals.map((i) => (
          <path key={i} d={PETAL} transform={`rotate(${i * 72 + jitter[i] * 10 - 5}) scale(${open.toFixed(2)})`} />
        ))}
      </g>
      {petals.map((i) => {
        const a = i * 72 + jitter[i] * 10 - 5
        const s = (open * (0.92 + jitter[i] * 0.16)).toFixed(3)
        return (
          <g key={i} transform={`rotate(${a.toFixed(1)}) scale(${s})`}>
            <path d={PETAL} fill={`url(#ff-p${tone})`} />
            <path d={PETAL} fill="url(#ff-fold)" transform="scale(0.62)" opacity="0.5" />
          </g>
        )
      })}
      {/* сердцевина со тычинками */}
      <circle r="0.2" fill="url(#ff-core)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = ((i * 51 + jitter[i % 5] * 30) * Math.PI) / 180
        const d = 0.1 + (i % 3) * 0.05
        return <circle key={i} cx={(Math.cos(a) * d).toFixed(3)} cy={(Math.sin(a) * d).toFixed(3)} r="0.032" fill="#ffe9a4" />
      })}
      {/* блик: свет падает сверху слева */}
      <ellipse cx="-0.3" cy="-0.42" rx="0.5" ry="0.36" fill="url(#ff-shine)" opacity="0.5" />
    </g>
  )
}

function Leaf({ l }) {
  const s = l.len
  return (
    <g transform={`translate(${l.x.toFixed(0)} ${l.y.toFixed(0)}) rotate(${l.rot.toFixed(0)}) scale(${s.toFixed(1)})`}>
      <path d="M0 0 C0.34 -0.2 0.86 -0.14 1 0 C0.86 0.14 0.34 0.2 0 0 Z" fill={l.dark ? '#16241c' : '#1f3326'} />
      <path d="M0.06 0 L0.92 0" stroke="#2e4532" strokeWidth="0.03" opacity="0.8" />
    </g>
  )
}

export default function FlowerField() {
  const scene = useMemo(buildScene, [])
  const far = scene.flowers.filter((f) => f.r < 40)
  const mid = scene.flowers.filter((f) => f.r >= 40 && f.r < 62)
  const near = scene.flowers.filter((f) => f.r >= 62 && f.r < 96)
  const front = scene.flowers.filter((f) => f.r >= 96)

  return (
    <svg className="flower-field" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        {TONES.map((t, i) => (
          <linearGradient key={i} id={`ff-p${i}`} x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor={t.deep} />
            <stop offset="45%" stopColor={t.mid} />
            <stop offset="100%" stopColor={t.edge} />
          </linearGradient>
        ))}
        <linearGradient id="ff-fold" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#a35f08" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffd862" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ff-core" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#c47c12" />
          <stop offset="55%" stopColor="#8a4708" />
          <stop offset="100%" stopColor="#4d2305" />
        </radialGradient>
        <radialGradient id="ff-shine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff6d6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ff-glow" cx="50%" cy="104%" r="78%">
          <stop offset="0%" stopColor="#6b4a12" stopOpacity="0.65" />
          <stop offset="55%" stopColor="#2a1d07" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0b0a07" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ff-vignette" cx="50%" cy="42%" r="72%">
          <stop offset="62%" stopColor="#0b0a07" stopOpacity="0" />
          <stop offset="100%" stopColor="#060503" stopOpacity="0.55" />
        </radialGradient>
        <filter id="ff-far" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="ff-mid" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id="ff-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.9" /></filter>
        <filter id="ff-front" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6.5" /></filter>
      </defs>

      <rect width={W} height={H} fill="#0b0a07" />
      <rect width={W} height={H} fill="url(#ff-glow)" />

      {/* дальний план: размытые ветки, листья и цветы */}
      <g filter="url(#ff-far)" opacity="0.85">
        <g stroke="#241a12" strokeLinecap="round" fill="none">
          {scene.branches.filter((b) => b.far).map((b, i) => (
            <path key={i} d={b.d} strokeWidth={b.w.toFixed(1)} />
          ))}
        </g>
        {scene.leaves.filter((l) => l.far).map((l, i) => <Leaf key={i} l={l} />)}
        {far.map((f, i) => <Flower key={i} f={f} />)}
      </g>

      {/* средний план */}
      <g filter="url(#ff-mid)">
        <g stroke="#2b2017" strokeLinecap="round" fill="none">
          {scene.branches.filter((b) => !b.far).map((b, i) => (
            <path key={i} d={b.d} strokeWidth={b.w.toFixed(1)} />
          ))}
        </g>
        {scene.leaves.filter((l) => !l.far).map((l, i) => <Leaf key={i} l={l} />)}
        {mid.map((f, i) => <Flower key={i} f={f} />)}
      </g>

      {/* ближний план: почти резкий */}
      <g filter="url(#ff-soft)">
        <g fill="#e0a518">
          {scene.buds.map((b, i) => <circle key={i} cx={b.x.toFixed(0)} cy={b.y.toFixed(0)} r={b.r.toFixed(1)} />)}
        </g>
        {near.map((f, i) => <Flower key={i} f={f} />)}
      </g>

      {/* самый близкий план: сильное размытие, как у объектива */}
      <g filter="url(#ff-front)" opacity="0.85">
        {front.map((f, i) => <Flower key={i} f={f} />)}
      </g>

      {/* лепестки в воздухе */}
      <g filter="url(#ff-mid)">
        {scene.petals.map((p, i) => (
          <g key={i} transform={`translate(${p.x.toFixed(0)} ${p.y.toFixed(0)}) rotate(${p.rot.toFixed(0)}) scale(${p.r.toFixed(1)})`} opacity={p.op.toFixed(2)}>
            <path d={PETAL} fill="url(#ff-p1)" />
          </g>
        ))}
      </g>

      <rect width={W} height={H} fill="url(#ff-vignette)" />
    </svg>
  )
}
