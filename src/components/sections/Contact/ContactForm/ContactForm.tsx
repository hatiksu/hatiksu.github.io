import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '../../../../hooks/usePreferences'
import { LIMITS, toFormSubmit, validateMessage, type ContactError, type ContactField } from '../../../../lib/contact'
import { Icon } from '../../../ui/Icon/Icon'
import styles from './ContactForm.module.css'

type Status = 'idle' | 'sending' | 'sent' | 'failed' | 'rate'

/** Форма «Написать мне»: FormSubmit пересылает сообщение на почту */
export function ContactForm({ endpoint }: { endpoint: string }) {
  const { t, lang } = usePreferences()
  const f = t.contact.form
  const id = useId()
  const startedAt = useRef(0)
  const [values, setValues] = useState({ name: '', contact: '', message: '', website: '' })
  const [errors, setErrors] = useState<Partial<Record<ContactField, ContactError>>>({})
  const [status, setStatus] = useState<Status>('idle')

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!startedAt.current) startedAt.current = Date.now()
    setValues((v) => ({ ...v, [field]: e.target.value }))
    if (field in errors) setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const elapsedMs = startedAt.current ? Date.now() - startedAt.current : 0
    // Сначала поля (без антиспама), чтобы человек увидел свои ошибки
    const check = validateMessage({ ...values, website: '', lang, elapsedMs: LIMITS.minFillMs })
    if (!check.ok) {
      if (!check.spam) {
        setErrors(check.errors)
        document.getElementById(`${id}-${Object.keys(check.errors)[0]}`)?.focus()
      }
      return
    }
    // Бот (заполнил ловушку или отправил мгновенно) видит «успех», но ничего не уходит
    if (!validateMessage({ ...values, lang, elapsedMs }).ok) return setStatus('sent')
    setStatus('sending')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(toFormSubmit(check.value, values.website)),
      })
      if (res.status === 429) return setStatus('rate')
      const data = (await res.json().catch(() => ({}))) as { success?: string | boolean }
      if (res.ok && String(data.success) === 'true') {
        setStatus('sent')
        setValues({ name: '', contact: '', message: '', website: '' })
        startedAt.current = 0
      } else setStatus('failed')
    } catch {
      setStatus('failed')
    }
  }

  const field = (name: ContactField, label: string, input: React.ReactNode) => (
    <label className={styles.field} htmlFor={`${id}-${name}`}>
      <span className={styles.label}>{label}</span>
      {input}
      <AnimatePresence>
        {errors[name] && (
          <motion.span className={styles.error} id={`${id}-${name}-error`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {f.errors[errors[name]!]}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
  const aria = (name: ContactField) => ({ id: `${id}-${name}`, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined })

  if (status === 'sent') {
    return (
      <motion.div className={styles.sent} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} role="status">
        <motion.span className={styles.check} initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}>
          <Icon name="send" size={26} />
        </motion.span>
        <p>{f.sent}</p>
        <button type="button" className={styles.link} onClick={() => setStatus('idle')}>
          {f.again}
        </button>
      </motion.div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.row}>
        {field('name', f.name, <input {...aria('name')} className={styles.input} value={values.name} onChange={set('name')} maxLength={LIMITS.name} autoComplete="name" />)}
        {field(
          'contact',
          f.contact,
          <input {...aria('contact')} className={styles.input} value={values.contact} onChange={set('contact')} maxLength={LIMITS.contact} autoComplete="email" inputMode="email" />,
        )}
      </div>
      {field(
        'message',
        f.message,
        <textarea {...aria('message')} className={`${styles.input} ${styles.textarea}`} value={values.message} onChange={set('message')} maxLength={LIMITS.message} rows={5} placeholder={f.placeholder} />,
      )}
      {/* Ловушка для ботов: людям поле не видно */}
      <input className={styles.trap} name="website" value={values.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={styles.footer}>
        <span className={styles.counter}>
          {values.message.length} / {LIMITS.message}
        </span>
        <button type="submit" className={styles.submit} disabled={status === 'sending'}>
          <Icon name="send" />
          {status === 'sending' ? f.sending : f.send}
        </button>
      </div>
      {(status === 'failed' || status === 'rate') && (
        <p className={styles.failed} role="alert">
          {status === 'rate' ? f.rate : f.failed}
        </p>
      )}
    </form>
  )
}
