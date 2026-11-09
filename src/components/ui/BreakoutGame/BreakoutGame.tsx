import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '../../../hooks/usePreferences'
import { BALL_R, H, PADDLE_H, PADDLE_W, PADDLE_Y, W, launch, movePaddle, newGame, step, type GameState } from '../../../lib/breakout'
import { storage } from '../../../lib/prefs'
import styles from './BreakoutGame.module.css'

const COLORS = ['#7c5cff', '#22d3ee', '#f472b6']

function draw(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  ctx.clearRect(0, 0, W, H)
  for (const b of s.bricks) {
    if (!b.alive) continue
    const color = COLORS[b.glyph % COLORS.length]
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 4)
    ctx.fill()
  }
  ctx.shadowBlur = 0
  // Ракетка
  const grad = ctx.createLinearGradient(s.paddleX - PADDLE_W / 2, 0, s.paddleX + PADDLE_W / 2, 0)
  grad.addColorStop(0, '#7c5cff')
  grad.addColorStop(1, '#22d3ee')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(s.paddleX - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H, 5)
  ctx.fill()
  // Мяч с пульсирующим свечением
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 14 + Math.sin(time / 200) * 4
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

/** Арканоид с кирпичами «404»: мышь, касание или стрелки; пробел/тап — запуск */
export function BreakoutGame() {
  const { t } = usePreferences()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(newGame())
  const keys = useRef({ left: false, right: false })
  const [hud, setHud] = useState<Pick<GameState, 'score' | 'lives' | 'status'>>({ score: 0, lives: 3, status: 'ready' })
  const [best, setBest] = useState(() => Number(storage.get('breakout-best')) || 0)
  const bestRef = useRef(best)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let s = stateRef.current
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      if (dir) s = movePaddle(s, s.paddleX + dir * 420 * dt)
      s = step(s, dt)
      stateRef.current = s
      draw(ctx, s, now)
      setHud((h) =>
        h.score === s.score && h.lives === s.lives && h.status === s.status ? h : { score: s.score, lives: s.lives, status: s.status },
      )
      if (s.score > bestRef.current) {
        bestRef.current = s.score
        setBest(s.score)
        storage.set('breakout-best', String(s.score))
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const pause = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', pause)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', pause)
    }
  }, [])

  const toGame = (clientX: number) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return ((clientX - r.left) / r.width) * W
  }
  const start = () => {
    stateRef.current = launch(stateRef.current, Math.random() < 0.5 ? -1 : 1)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true
    else if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true
    else if (e.key === ' ' || e.key === 'Enter') start()
    else return
    e.preventDefault()
  }
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false
    if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false
  }

  const message =
    hud.status === 'won' ? t.notFound.won : hud.status === 'lost' ? t.notFound.lost : hud.status === 'ready' ? t.notFound.start : ''

  return (
    <div className={styles.wrap}>
      <div className={styles.hud} aria-live="polite">
        <span>
          {t.notFound.score}: <b>{hud.score}</b>
        </span>
        <span aria-label={`${t.notFound.lives}: ${hud.lives}`}>{'♥'.repeat(hud.lives) || '—'}</span>
        <span>
          {t.notFound.best}: <b>{best}</b>
        </span>
      </div>
      <div className={styles.field}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          tabIndex={0}
          role="application"
          aria-label={t.notFound.gameLabel}
          onPointerMove={(e) => (stateRef.current = movePaddle(stateRef.current, toGame(e.clientX)))}
          onPointerDown={(e) => {
            stateRef.current = movePaddle(stateRef.current, toGame(e.clientX))
            start()
          }}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
        {message && (
          <button type="button" className={`${styles.overlay} ${hud.status === 'won' ? styles.won : ''}`} onClick={start}>
            {message}
          </button>
        )}
      </div>
    </div>
  )
}
