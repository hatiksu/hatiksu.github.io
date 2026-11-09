import { describe, expect, it } from 'vitest'
import { BALL_R, H, PADDLE_W, PADDLE_Y, W, launch, layoutBricks, movePaddle, newGame, step, type GameState } from './breakout'

describe('раскладка', () => {
  it('«404» — 9 + 12 + 9 кирпичей по центру и без пересечений', () => {
    const bricks = layoutBricks('404')
    expect(bricks).toHaveLength(9 + 12 + 9)
    const minX = Math.min(...bricks.map((b) => b.x))
    const maxX = Math.max(...bricks.map((b) => b.x + b.w))
    expect(Math.abs(minX - (W - maxX))).toBeLessThan(1)
    for (const a of bricks)
      for (const b of bricks) if (a !== b) expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true)
  })
})

describe('игра', () => {
  it('ракетка не выходит за поле, мяч лежит на ней до запуска', () => {
    const s = movePaddle(newGame(), -100)
    expect(s.paddleX).toBe(PADDLE_W / 2)
    expect(s.ball.x).toBe(PADDLE_W / 2)
    expect(step(s, 1)).toBe(s)
  })

  it('мяч отскакивает от стен и потолка', () => {
    const keep = [{ x: 0, y: 0, w: 1, h: 1, alive: true, glyph: 0 }]
    let s: GameState = { ...launch(newGame()), bricks: keep }
    s = { ...s, ball: { x: BALL_R + 1, y: 100, vx: -300, vy: -10 } }
    s = step(s, 0.05)
    expect(s.ball.vx).toBeGreaterThan(0)
    s = { ...s, status: 'playing', ball: { x: 100, y: BALL_R + 1, vx: 0, vy: -300 } }
    expect(step(s, 0.05).ball.vy).toBeGreaterThan(0)
  })

  it('удар по краю ракетки отправляет мяч в сторону', () => {
    const s = { ...launch(newGame()), bricks: [{ x: 0, y: 0, w: 1, h: 1, alive: true, glyph: 0 }] }
    const right = step({ ...s, ball: { x: s.paddleX + PADDLE_W / 2 - 2, y: PADDLE_Y - BALL_R - 2, vx: 0, vy: 300 } }, 0.02)
    expect(right.ball.vy).toBeLessThan(0)
    expect(right.ball.vx).toBeGreaterThan(100)
  })

  it('кирпич разбивается, даёт очки; все кирпичи — победа', () => {
    const brick = { x: 100, y: 100, w: 20, h: 20, alive: true, glyph: 0 }
    const s: GameState = { ...launch(newGame()), bricks: [brick], ball: { x: 110, y: 130, vx: 0, vy: -300 } }
    const next = step(s, 0.05)
    expect(next.bricks[0].alive).toBe(false)
    expect(next.score).toBe(10)
    expect(next.status).toBe('won')
    expect(next.ball.vy).toBeGreaterThan(0)
  })

  it('падение отнимает жизнь, после трёх — проигрыш, launch начинает заново', () => {
    let s: GameState = { ...launch(newGame()), ball: { x: 10, y: H + 20, vx: 0, vy: 300 } }
    s = step(s, 0.01)
    expect(s.lives).toBe(2)
    expect(s.status).toBe('ready')
    s = step({ ...launch(s), lives: 1, ball: { x: 10, y: H + 20, vx: 0, vy: 300 } }, 0.01)
    expect(s.status).toBe('lost')
    const again = launch(s)
    expect(again.lives).toBe(3)
    expect(again.bricks.every((b) => b.alive)).toBe(true)
  })

  it('длинный шаг не даёт мячу пролететь сквозь кирпич', () => {
    const brick = { x: 100, y: 100, w: 20, h: 6, alive: true, glyph: 0 }
    const s: GameState = { ...launch(newGame()), bricks: [brick, { ...brick, x: 300 }], ball: { x: 110, y: 200, vx: 0, vy: -400 } }
    expect(step(s, 0.5).bricks[0].alive).toBe(false)
  })
})
