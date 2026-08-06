import { useCallback, useEffect, useState } from 'react'
import * as remindersService from '../api/reminders'
import logger from '@/shared/lib/logger'
import { DEFAULT_REMINDER_TIMEZONE } from '@debt-ledger/domain'

const CTX = 'useReminderSettings'

export const EMPTY_REMINDER_FORM = {
  phone: '',
  message_template: remindersService.DEFAULT_TEMPLATE,
  days_before: 3,
  enabled: false,
  timezone: DEFAULT_REMINDER_TIMEZONE,
}

function settingsToForm(data) {
  return {
    phone: data.phone || '',
    message_template:
      data.message_template || EMPTY_REMINDER_FORM.message_template,
    days_before: data.days_before ?? 3,
    enabled: Boolean(data.enabled),
    timezone: data.timezone || DEFAULT_REMINDER_TIMEZONE,
  }
}

/**
 * Loads and saves reminder_settings for the signed-in user.
 * Presentation (toasts) stays in the page — this hook throws on failure
 * and returns a validation message string when input is invalid.
 */
export default function useReminderSettings(userId) {
  const [form, setForm] = useState(EMPTY_REMINDER_FORM)
  const [loading, setLoading] = useState(Boolean(userId))
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(async () => {
    if (!userId) {
      setForm(EMPTY_REMINDER_FORM)
      setLoadError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    const { data, error } = await remindersService.fetchSettings(userId)
    setLoading(false)
    if (error) {
      logger.error('load settings failed', CTX, error)
      setLoadError(error)
      throw error
    }
    if (data) setForm(settingsToForm(data))
  }, [userId])

  useEffect(() => {
    const t = setTimeout(() => {
      void load().catch(() => {})
    }, 0)
    return () => clearTimeout(t)
  }, [load])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleChange(field) {
    return (e) => {
      const value =
        e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setField(field, value)
    }
  }

  /**
   * @returns {{ ok: true } | { ok: false, validationError: string }}
   */
  async function save() {
    if (!userId) return { ok: false, validationError: 'Not signed in.' }

    const phone = String(form.phone).trim()
    if (form.enabled && !phone) {
      return {
        ok: false,
        validationError: 'Enter a phone number before enabling reminders.',
      }
    }
    const days = parseInt(form.days_before, 10)
    if (Number.isNaN(days) || days < 0) {
      return {
        ok: false,
        validationError: 'Days before due must be 0 or greater.',
      }
    }

    setSaving(true)
    try {
      const { error } = await remindersService.upsertSettings(userId, {
        ...form,
        phone,
        days_before: days,
      })
      if (error) throw error
      return { ok: true }
    } catch (err) {
      logger.error('save settings failed', CTX, err)
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    loading,
    saving,
    loadError,
    setField,
    handleChange,
    load,
    save,
  }
}
