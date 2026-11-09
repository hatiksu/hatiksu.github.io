import { usePreferences } from '../../../hooks/usePreferences'
import { Reveal } from '../../ui/Reveal/Reveal'
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading'
import { TiltCard } from '../../ui/TiltCard/TiltCard'
import styles from './Skills.module.css'

export function Skills() {
  const { t } = usePreferences()
  const skills = t.skills.items
  return (
    <section id="skills" className={styles.section}>
      <div className="container">
        <SectionHeading eyebrow={t.skills.eyebrow} title={t.skills.title} />
        <ul className={styles.grid}>
          {skills.map((skill, i) => (
            <Reveal as="li" key={i} delay={(i % 3) * 0.1}>
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
