import type { Skill } from '../../../types'
import { Reveal } from '../../ui/Reveal/Reveal'
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading'
import { TiltCard } from '../../ui/TiltCard/TiltCard'
import styles from './Skills.module.css'

export function Skills({ skills }: { skills: Skill[] }) {
  return (
    <section id="skills" className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow="Что я умею" title="Делаю продукты от идеи до запуска" />
        <ul className={styles.grid}>
          {skills.map((skill, i) => (
            <Reveal as="li" key={skill.title} delay={(i % 3) * 0.1}>
              <TiltCard className={styles.card}>
                <span className={styles.icon}>{skill.icon}</span>
                <h3 className={styles.title}>{skill.title}</h3>
                <p className={styles.text}>{skill.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
