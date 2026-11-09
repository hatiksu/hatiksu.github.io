import { useEffect, useRef, useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { usePreferences } from '../../../hooks/usePreferences'
import { FRAGMENT, VERTEX, hexToRgb } from '../../../lib/shader'
import styles from './Background.module.css'

const PALETTE = {
  dark: { a: '#7c5cff', b: '#22d3ee', c: '#f472b6', bg: '#07080c' },
  light: { a: '#8b6cff', b: '#38bdf8', c: '#f472b6', bg: '#f6f6fb' },
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

/**
 * Фон страницы: WebGL-«туманность», которая тянется к курсору и реагирует на наклон телефона.
 * Без WebGL — градиентные пятна на CSS. При «уменьшить движение» — один статичный кадр.
 */
export function Background() {
  const { theme } = usePreferences()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webgl, setWebgl] = useState(true)
  const x = useSpring(useMotionValue(-1000), { stiffness: 80, damping: 20 })
  const y = useSpring(useMotionValue(-1000), { stiffness: 80, damping: 20 })
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${x}px ${y}px, color-mix(in srgb, var(--a1) 10%, transparent), transparent 60%)`

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!canvas || !gl) {
      setWebgl(false)
      return
    }
    let program: WebGLProgram
    try {
      program = gl.createProgram()!
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link')
    } catch {
      setWebgl(false)
      return
    }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (name: string) => gl.getUniformLocation(program, name)
    const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uTilt = u('uTilt'), uLight = u('uLight')

    const colors = PALETTE[theme]
    gl.uniform3fv(u('uA'), hexToRgb(colors.a))
    gl.uniform3fv(u('uB'), hexToRgb(colors.b))
    gl.uniform3fv(u('uC'), hexToRgb(colors.c))
    gl.uniform3fv(u('uBg'), hexToRgb(colors.bg))
    gl.uniform1f(uLight, theme === 'light' ? 1 : 0)

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    // Рисуем в пониженном разрешении: шум мягкий, а GPU телефона скажет спасибо
    const scale = 0.5
    const resize = () => {
      canvas.width = Math.max(1, Math.round(innerWidth * scale))
      canvas.height = Math.max(1, Math.round(innerHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }
    resize()

    const mouse = { x: 0.7, y: 0.75, tx: 0.7, ty: 0.75 }
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / innerWidth
      mouse.ty = 1 - e.clientY / innerHeight
    }
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      tilt.tx = Math.max(-1, Math.min(1, e.gamma / 30))
      tilt.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30))
    }

    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04
      mouse.y += (mouse.ty - mouse.y) * 0.04
      tilt.x += (tilt.tx - tilt.x) * 0.05
      tilt.y += (tilt.ty - tilt.y) * 0.05
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.uniform2f(uTilt, tilt.x, tilt.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // Во вкладке на фоне не тратим батарею
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(frame)
    }
    const onResize = () => {
      resize()
      if (reduce) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('deviceorientation', onTilt, { passive: true })
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [theme])

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches) return
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [x, y])

  return (
    <div className={styles.root} aria-hidden="true">
      {webgl ? (
        <canvas ref={canvasRef} className={styles.canvas} />
      ) : (
        <>
          <div className={`${styles.blob} ${styles.b1}`} />
          <div className={`${styles.blob} ${styles.b2}`} />
          <div className={`${styles.blob} ${styles.b3}`} />
        </>
      )}
      <div className={styles.grid} />
      <motion.div className={styles.spotlight} style={{ background: spotlight }} />
    </div>
  )
}
