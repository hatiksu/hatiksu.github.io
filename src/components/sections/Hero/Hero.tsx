import { useRef } from 'react'
import { motion, useScroll, useTransform, type Variants } from 'motion/react'
import { usePreferences } from '../../../hooks/usePreferences'
import { useTyping } from '../../../hooks/useTyping'
import { Button } from '../../ui/Button/Button'
import styles from './Hero.module.css'

interface HeroProps {
  name: string
  github: string
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.2 } },
}

const letter: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
})

/**
 * Слово с градиентом выезжает целиком: Safari на iOS не рисует
 * background-clip: text на буквах, которые анимируются отдельно от родителя.
 */
function RevealWord({ text, className }: { text: string; className?: string }) {
  return (
    <span className={styles.word}>
      <motion.span className={`${styles.char} ${className ?? ''}`} variants={letter}>
        {text}
      </motion.span>
    </span>
  )
}

/** Разбивает текст на буквы для анимации появления. */
function SplitText({ text }: { text: string }) {
  return (
    <span>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className={styles.word}>
          {[...word].map((ch, ci) => (
            <motion.span key={ci} className={styles.char} variants={letter}>
              {ch}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  )
}

export function Hero({ name, github }: HeroProps) {
  const { t } = usePreferences()
  const { status, roles, about } = t.hero
  const ref = useRef<HTMLElement>(null)
  const typed = useTyping(roles)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94])

  return (
    <section ref={ref} id="top" className={styles.hero}>
      <motion.div className={`container ${styles.content}`} style={{ y, opacity, scale }}>
        <motion.div className={styles.badge} {...fadeUp(0)}>
          <i className={styles.dot} />
          {status}
        </motion.div>

        <motion.h1 className={styles.title} variants={container} initial="hidden" animate="show" aria-label={`${t.hero.hello} ${name}`}>
          <span aria-hidden="true">
            <SplitText key={t.hero.hello} text={t.hero.hello} />
            <br />
            <RevealWord text={name} className="gradient-text" />
          </span>
        </motion.h1>

        <motion.p className={styles.typed} {...fadeUp(0.7)}>
          <span className={styles.prompt}>&gt;</span>
          <span className={styles.typedText}>{typed}</span>
          <span className={styles.cursor} aria-hidden="true" />
          <span className="visually-hidden">{roles.join(', ')}</span>
        </motion.p>

        {/* Самый крупный текст первого экрана (LCP): виден сразу, анимируется только сдвиг */}
        <motion.p className={styles.lead} initial={{ y: 24 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          {about}
        </motion.p>

        <motion.div className={styles.cta} {...fadeUp(1)}>
          <Button href="#projects" variant="primary">
            {t.hero.projects}
          </Button>
          <Button href={github} icon="github" external>
            GitHub
          </Button>
        </motion.div>
      </motion.div>

      <motion.a
        href="#stats"
        className={styles.scroll}
        aria-label={t.hero.scroll}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <span className={styles.mouse}>
          <motion.span
            className={styles.wheel}
            animate={{ y: [0, 10, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.a>
    </section>
  )
}
