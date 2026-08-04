import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  Link2,
  Link2Off,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react'
import NeuCard from '../components/ui/NeuCard'
import NeuButton from '../components/ui/NeuButton'
import { useToast } from '../components/ui/Toast'
import { useSessionData } from '../contexts/DataContext'
import * as remindersService from '../services/reminders'
import * as whatsappApi from '../services/whatsappApi'
import logger from '../lib/logger'

const CTX = 'RemindersPage'

const emptyForm = {
  phone: '',
  message_template: remindersService.DEFAULT_TEMPLATE,
  days_before: 3,
  enabled: false,
  timezone: 'Asia/Ho_Chi_Minh',
}

export default function RemindersPage() {
  const session = useSessionData()
  const toast = useToast()
  const [form, setForm] = useState(emptyForm)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)
  const [waStatus, setWaStatus] = useState('unknown')
  const [qr, setQr] = useState(null)
  const [waLoading, setWaLoading] = useState(false)
  const [sendingNow, setSendingNow] = useState(false)
  const apiConfigured = whatsappApi.isWhatsAppApiConfigured()

  const loadSettings = useCallback(async () => {
    if (!session?.user?.id) return
    setLoadingSettings(true)
    const { data, error } = await remindersService.fetchSettings(session.user.id)
    setLoadingSettings(false)
    if (error) {
      toast.error('Could not load reminder settings.')
      logger.error('load settings failed', CTX, error)
      return
    }
    if (data) {
      setForm({
        phone: data.phone || '',
        message_template: data.message_template || emptyForm.message_template,
        days_before: data.days_before ?? 3,
        enabled: Boolean(data.enabled),
        timezone: data.timezone || 'Asia/Ho_Chi_Minh',
      })
    }
    // toast is stable enough for error feedback; omit from deps to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast omitted intentionally
  }, [session?.user?.id])

  const refreshWhatsApp = useCallback(async () => {
    if (!apiConfigured) {
      setWaStatus('unconfigured')
      setQr(null)
      return
    }
    setWaLoading(true)
    try {
      const statusRes = await whatsappApi.getStatus()
      setWaStatus(statusRes.status || 'disconnected')
      if (statusRes.status === 'qr' || statusRes.qr) {
        const qrRes = statusRes.qr
          ? statusRes
          : await whatsappApi.getQr()
        setQr(qrRes.qr || null)
      } else {
        setQr(null)
      }
    } catch (err) {
      setWaStatus('error')
      setQr(null)
      logger.error('WhatsApp status failed', CTX, err)
    } finally {
      setWaLoading(false)
    }
  }, [apiConfigured])

  useEffect(() => {
    const t = setTimeout(() => {
      void loadSettings()
    }, 0)
    return () => clearTimeout(t)
  }, [loadSettings])

  useEffect(() => {
    if (!apiConfigured) {
      const t = setTimeout(() => {
        setWaStatus('unconfigured')
        setQr(null)
      }, 0)
      return () => clearTimeout(t)
    }
    const tick = () => {
      void refreshWhatsApp()
    }
    const t = setTimeout(tick, 0)
    const id = setInterval(tick, 4000)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [apiConfigured, refreshWhatsApp])

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!session?.user?.id) return
    const phone = form.phone.trim()
    if (form.enabled && !phone) {
      toast.warning('Enter a phone number before enabling reminders.')
      return
    }
    const days = parseInt(form.days_before, 10)
    if (Number.isNaN(days) || days < 0) {
      toast.warning('Days before due must be 0 or greater.')
      return
    }

    setSaving(true)
    try {
      const { error } = await remindersService.upsertSettings(session.user.id, {
        ...form,
        phone,
        days_before: days,
      })
      if (error) throw error
      toast.success('Reminder settings saved.')
    } catch (err) {
      toast.error(err?.message || 'Failed to save settings.')
      logger.error('save settings failed', CTX, err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setWaLoading(true)
    try {
      await whatsappApi.disconnect()
      toast.success('WhatsApp disconnected. Scan a new QR to link again.')
      await refreshWhatsApp()
    } catch (err) {
      toast.error(err?.message || 'Disconnect failed.')
    } finally {
      setWaLoading(false)
    }
  }

  async function handleSendNow() {
    if (!apiConfigured) {
      toast.warning('WhatsApp API is not configured.')
      return
    }
    if (waStatus !== 'connected') {
      toast.warning('Link WhatsApp before sending reminders.')
      return
    }
    if (!form.enabled) {
      toast.warning('Enable reminders and save settings first.')
      return
    }
    if (!form.phone.trim()) {
      toast.warning('Enter a phone number and save settings first.')
      return
    }

    setSendingNow(true)
    try {
      const result = await whatsappApi.runReminders()
      if (result?.reason === 'disconnected') {
        toast.warning('WhatsApp is not connected on the worker.')
        return
      }
      const sent = result?.sent ?? 0
      if (sent > 0) {
        toast.success(`Sent ${sent} reminder${sent === 1 ? '' : 's'} to WhatsApp.`)
      } else {
        toast.success(
          'Scan finished — no new reminders due today (or already sent).',
        )
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to send reminders.')
      logger.error('send now failed', CTX, err)
    } finally {
      setSendingNow(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-neu-md bg-neu-bg dark:bg-darkNeu-bg shadow-neu-inner dark:shadow-neu-dark-inner outline-none text-neu-textMain dark:text-darkNeu-textMain'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-neu-textMain dark:text-darkNeu-textMain">
          <Bell className="w-7 h-7" />
          Reminder debt
        </h2>
        <p className="mt-2 text-sm text-neu-textMuted dark:text-darkNeu-textMuted max-w-2xl">
          Link your WhatsApp once, then configure a self-reminder. Use Send now
          to message immediately, or let the background job run on its schedule.
        </p>
      </div>

      <NeuCard className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            WhatsApp link
          </h3>
          <NeuButton
            type="button"
            onClick={refreshWhatsApp}
            disabled={waLoading || !apiConfigured}
          >
            <RefreshCw className={`w-4 h-4 ${waLoading ? 'animate-spin' : ''}`} />
            Refresh
          </NeuButton>
        </div>

        {!apiConfigured ? (
          <p className="text-sm text-brand-negative">
            Set <code className="font-mono">VITE_WHATSAPP_API_URL</code> to your
            Railway worker URL, then restart the Vite app.
          </p>
        ) : null}

        {apiConfigured && waStatus === 'connected' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <p className="text-sm text-brand-positive font-semibold">
              Connected — session stays linked after you sign out of Debt Ledger.
            </p>
            <NeuButton type="button" onClick={handleDisconnect} disabled={waLoading}>
              <Link2Off className="w-4 h-4" />
              Disconnect WhatsApp
            </NeuButton>
          </div>
        ) : null}

        {apiConfigured && waStatus === 'qr' && qr ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted">
              Open WhatsApp → Linked devices → Link a device, then scan this QR.
            </p>
            <img
              src={qr}
              alt="WhatsApp QR code"
              className="w-64 h-64 rounded-neu-md bg-white p-2 shadow-neu-inner dark:shadow-neu-dark-inner"
            />
          </div>
        ) : null}

        {apiConfigured &&
        (waStatus === 'disconnected' || waStatus === 'unknown') &&
        !qr ? (
          <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted flex items-center gap-2">
            {waLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
            Waiting for QR from the WhatsApp worker…
          </p>
        ) : null}

        {waStatus === 'error' ? (
          <p className="text-sm text-brand-negative">
            Could not reach the WhatsApp worker. Check Railway logs and CORS.
          </p>
        ) : null}
      </NeuCard>

      <NeuCard className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h3 className="font-bold">Reminder settings</h3>

          {loadingSettings ? (
            <p className="text-sm text-neu-textMuted flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Loading…
            </p>
          ) : (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neu-textMuted">
                  Phone number (with country code, e.g. 84901234567)
                </span>
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="84901234567"
                  inputMode="tel"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neu-textMuted">
                  Message template
                </span>
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={form.message_template}
                  onChange={handleChange('message_template')}
                  rows={4}
                />
                <span className="text-xs text-neu-textMuted">
                  Placeholders: {'{person}'}, {'{amount}'}, {'{due_date}'}, {'{type}'},{' '}
                  {'{notes}'}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neu-textMuted">
                    Days before due date
                  </span>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={form.days_before}
                    onChange={handleChange('days_before')}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neu-textMuted">
                    Timezone
                  </span>
                  <input
                    className={inputClass}
                    value={form.timezone}
                    onChange={handleChange('timezone')}
                    placeholder="Asia/Ho_Chi_Minh"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={handleChange('enabled')}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Enable reminders</span>
              </label>

              <div className="flex flex-wrap gap-3">
                <NeuButton type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save settings
                </NeuButton>
                <NeuButton
                  type="button"
                  onClick={handleSendNow}
                  disabled={
                    sendingNow ||
                    !apiConfigured ||
                    waStatus !== 'connected' ||
                    loadingSettings
                  }
                >
                  {sendingNow ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send now
                </NeuButton>
              </div>
              <p className="text-xs text-neu-textMuted dark:text-darkNeu-textMuted">
                Send now checks unpaid debts due for reminder today and messages
                your phone right away — no need to wait for the scheduler.
              </p>
            </>
          )}
        </form>
      </NeuCard>
    </div>
  )
}
