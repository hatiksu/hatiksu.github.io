// Мини-игра для страницы 404: арканоид, где кирпичи выложены цифрами «404».
// Детерминированная логика без DOM: шаг симуляции step() и раскладка кирпичей — покрыты тестами.

export const W = 360
export const H = 480
export const BALL_R = 6
export const PADDLE_W = 72
export const PADDLE_H = 10
export const PADDLE_Y = H - 36
const SPEED = 300
const MAX_SPEED = 470

/** Пиксельный шрифт 3×5 для цифр */
const GLYPHS: Record<string, string[]> = {
  '4': ['1.1', '1.1', '111', '..1', '..1'],
  '0': ['111', '1.1', '1.1', '1.1', '111'],
}

export interface Brick {
  x: number
  y: number
  w: number
  h: number
  alive: boolean
  /** Номер цифры — для цвета */
  glyph: number
}

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
}

export type Status = 'ready' | 'playing' | 'won' | 'lost'

export interface GameState {
  ball: Ball
  paddleX: number
  bricks: Brick[]
  score: number
  lives: number
  status: Status
}

/** Кирпичи по пиксельному шрифту: каждая «точка» цифры — кирпич */
export function layoutBricks(text = '404', top = 70): Brick[] {
  const cell = 22
  const gap = 3
  const glyphGap = cell
  const glyphW = 3 * cell
  const totalW = text.length * glyphW + (text.length - 1) * glyphGap
  const left = (W - totalW) / 2
  const bricks: Brick[] = []
  ;[...text].forEach((ch, g) => {
    const rows = GLYPHS[ch]
    if (!rows) return
    rows.forEach((row, r) =>
      [...row].forEach((c, col) => {
        if (c !== '1') return
        bricks.push({
          x: left + g * (glyphW + glyphGap) + col * cell + gap / 2,
          y: top + r * cell + gap / 2,
          w: cell - gap,
          h: cell - gap,
          alive: true,
          glyph: g,
        })
      }),
    )
  })
  return bricks
}

export function newGame(): GameState {
  return { ball: restingBall(W / 2), paddleX: W / 2, bricks: layoutBricks(), score: 0, lives: 3, status: 'ready' }
}

const restingBall = (paddleX: number): Ball => ({ x: paddleX, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0 })

/** Запуск мяча: немного в сторону, чтобы не летел строго вертикально */
export function launch(s: GameState, dir = 1): GameState {
  if (s.status === 'playing') return s
  const base = s.status === 'won' || s.status === 'lost' ? newGame() : s
  const angle = -Math.PI / 2 + dir * 0.35
  return { ...base, status: 'playing', ball: { ...restingBall(base.paddleX), vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED } }
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function movePaddle(s: GameState, x: number): GameState {
  const paddleX = clamp(x, PADDLE_W / 2, W - PADDLE_W / 2)
  return s.status === 'playing' ? { ...s, paddleX } : { ...s, paddleX, ball: restingBall(paddleX) }
}

/** Шаг симуляции; dt в секундах (длинные шаги дробятся, чтобы мяч не проскакивал кирпичи) */
export function step(s: GameState, dt: number): GameState {
  if (s.status !== 'playing') return s
  let state = s
  const parts = Math.max(1, Math.ceil(dt / 0.008))
  for (let i = 0; i < parts && state.status === 'playing'; i++) state = substep(state, dt / parts)
  return state
}

function substep(s: GameState, dt: number): GameState {
  let { x, y, vx, vy } = s.ball
  let { score, lives, status } = s
  x += vx * dt
  y += vy * dt

  // Стены
  if (x < BALL_R) {
    x = BALL_R
    vx = Math.abs(vx)
  } else if (x > W - BALL_R) {
    x = W - BALL_R
    vx = -Math.abs(vx)
  }
  if (y < BALL_R) {
    y = BALL_R
    vy = Math.abs(vy)
  }

  // Ракетка: угол отскока зависит от точки удара
  const half = PADDLE_W / 2
  if (vy > 0 && y + BALL_R >= PADDLE_Y && y + BALL_R <= PADDLE_Y + PADDLE_H + 8 && Math.abs(x - s.paddleX) <= half + BALL_R) {
    const hit = clamp((x - s.paddleX) / half, -1, 1)
    const speed = Math.min(MAX_SPEED, Math.hypot(vx, vy) * 1.02)
    const angle = hit * 1.05 // до ~60° от вертикали
    vx = Math.sin(angle) * speed
    vy = -Math.cos(angle) * speed
    y = PADDLE_Y - BALL_R
  }

  // Кирпичи: отражаемся по оси с меньшим перекрытием
  let bricks = s.bricks
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i]
    if (!b.alive) continue
    const nx = clamp(x, b.x, b.x + b.w)
    const ny = clamp(y, b.y, b.y + b.h)
    if ((x - nx) ** 2 + (y - ny) ** 2 > BALL_R ** 2) continue
    const overlapX = Math.min(x + BALL_R - b.x, b.x + b.w - (x - BALL_R))
    const overlapY = Math.min(y + BALL_R - b.y, b.y + b.h - (y - BALL_R))
    if (overlapX < overlapY) vx = x < b.x + b.w / 2 ? -Math.abs(vx) : Math.abs(vx)
    else vy = y < b.y + b.h / 2 ? -Math.abs(vy) : Math.abs(vy)
    bricks = bricks.map((br, j) => (j === i ? { ...br, alive: false } : br))
    score += 10
    break
  }
  if (bricks.every((b) => !b.alive)) status = 'won'

  // Мяч упал
  if (y - BALL_R > H) {
    lives -= 1
    if (lives <= 0) return { ...s, bricks, score, lives: 0, status: 'lost', ball: restingBall(s.paddleX) }
    return { ...s, bricks, score, lives, status: 'ready', ball: restingBall(s.paddleX) }
  }
  return { ...s, ball: { x, y, vx, vy }, bricks, score, lives, status }
}
