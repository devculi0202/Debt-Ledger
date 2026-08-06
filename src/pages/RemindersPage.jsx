import { useEffect, useState } from 'react'
import {
  Bell,
  Link2,
  Link2Off,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
} from 'lucide-react'
import NeuCard from '@/shared/ui/NeuCard'
import NeuButton from '@/shared/ui/NeuButton'
import { useToast } from '@/shared/ui/Toast'
import { useSessionData } from '@/app/providers/DataProvider'
import useReminderSettings from '@/features/reminders/hooks/useReminderSettings'
import useWhatsAppLink from '@/features/reminders/hooks/useWhatsAppLink'
import * as whatsappApi from '@/features/reminders/api/whatsappApi'
import logger from '@/shared/lib/logger'

const CTX = 'RemindersPage'

const inputClass =
  'w-full px-4 py-3 rounded-neu-md bg-neu-bg dark:bg-darkNeu-bg shadow-neu-inner dark:shadow-neu-dark-inner outline-none text-neu-textMain dark:text-darkNeu-textMain'

export default function RemindersPage() {
  const session = useSessionData()
  const toast = useToast()
  const settings = useReminderSettings(session?.user?.id)
  const whatsapp = useWhatsAppLink()
  const [sendingNow, setSendingNow] = useState(false)

  useEffect(() => {
    if (settings.loadError) {
      toast.error('Could not load reminder settings.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast omitted intentionally
  }, [settings.loadError])

  async function handleSave(e) {
    e.preventDefault()
    try {
      const result = await settings.save()
      if (!result.ok) {
        toast.warning(result.validationError)
        return
      }
      toast.success('Reminder settings saved.')
    } catch (err) {
      toast.error(err?.message || 'Failed to save settings.')
    }
  }

  async function handleDisconnect() {
    try {
      await whatsapp.disconnect()
      toast.success('WhatsApp disconnected. Scan a new QR to link again.')
    } catch (err) {
      toast.error(err?.message || 'Disconnect failed.')
    }
  }

  async function handleRelink() {
    try {
      await whatsapp.relink()
      toast.success('Starting a new WhatsApp link — wait for the QR.')
    } catch (err) {
      toast.error(err?.message || 'Could not start WhatsApp link.')
    }
  }

  async function handleSendNow() {
    if (!whatsapp.apiConfigured) {
      toast.warning('WhatsApp API is not configured.')
      return
    }
    if (whatsapp.status !== 'connected') {
      toast.warning('Link WhatsApp before sending reminders.')
      return
    }
    if (!settings.form.phone.trim()) {
      toast.warning('Enter a phone number and save settings first.')
      return
    }

    setSendingNow(true)
    try {
      const result = await whatsappApi.runReminders({ force: true })
      if (result?.reason === 'disconnected') {
        toast.warning('WhatsApp is not connected on the worker.')
        return
      }
      if (result?.reason === 'no_settings') {
        toast.warning('Save reminder settings first.')
        return
      }
      if (result?.reason === 'no_phone') {
        toast.warning('Set a phone number with country code (e.g. 8490…).')
        return
      }
      if (result?.reason === 'no_debts') {
        toast.warning(
          'No unpaid debts with a due date found for your account (check user_id on debts).',
        )
        return
      }
      const sent = result?.sent ?? 0
      const failed = result?.failed ?? 0
      if (sent > 0) {
        toast.success(
          `Sent ${sent} reminder${sent === 1 ? '' : 's'} to WhatsApp${
            failed ? ` (${failed} failed)` : ''
          }.`,
        )
      } else if (failed > 0) {
        toast.error(
          result?.lastError ||
            `Failed to send ${failed} reminder${failed === 1 ? '' : 's'}. Check phone format (8490…).`,
        )
      } else {
        toast.warning(
          'Nothing to send — need unpaid debts with due dates linked to your user.',
        )
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to send reminders.')
      logger.error('send now failed', CTX, err)
    } finally {
      setSendingNow(false)
    }
  }

  async function handleTestMessage() {
    if (!whatsapp.apiConfigured) {
      toast.warning('WhatsApp API is not configured.')
      return
    }
    if (whatsapp.status !== 'connected') {
      toast.warning('Link WhatsApp before sending a test.')
      return
    }
    if (!settings.form.phone.trim()) {
      toast.warning('Enter a phone number and save settings first.')
      return
    }

    setSendingNow(true)
    try {
      await whatsappApi.sendTestReminder()
      toast.success(
        'Test sent. Open WhatsApp on the linked phone — check chats / “Message yourself”.',
      )
    } catch (err) {
      toast.error(err?.message || 'Test message failed.')
      logger.error('test message failed', CTX, err)
    } finally {
      setSendingNow(false)
    }
  }

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
            onClick={whatsapp.refresh}
            disabled={whatsapp.loading || !whatsapp.apiConfigured}
          >
            <RefreshCw
              className={`w-4 h-4 ${whatsapp.loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </NeuButton>
        </div>

        {!whatsapp.apiConfigured ? (
          <p className="text-sm text-brand-negative">
            Set <code className="font-mono">VITE_WHATSAPP_API_URL</code> to your
            Railway worker URL, then restart the Vite app.
          </p>
        ) : null}

        {whatsapp.apiConfigured && whatsapp.status === 'connected' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="space-y-1">
              <p className="text-sm text-brand-positive font-semibold">
                Connected — session stays linked after you sign out of Debt Ledger.
              </p>
              {whatsapp.linkedPhone ? (
                <p className="text-xs text-neu-textMuted dark:text-darkNeu-textMuted">
                  Linked WhatsApp: +{whatsapp.linkedPhone}. Reminder phone should
                  match this (or another WhatsApp number with country code).
                </p>
              ) : null}
            </div>
            <NeuButton
              type="button"
              onClick={handleDisconnect}
              disabled={whatsapp.loading}
            >
              <Link2Off className="w-4 h-4" />
              Disconnect WhatsApp
            </NeuButton>
          </div>
        ) : null}

        {whatsapp.apiConfigured && whatsapp.status === 'qr' && whatsapp.qr ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted">
              Open WhatsApp → Linked devices → Link a device, then scan this QR.
            </p>
            <img
              src={whatsapp.qr}
              alt="WhatsApp QR code"
              className="w-64 h-64 rounded-neu-md bg-white p-2 shadow-neu-inner dark:shadow-neu-dark-inner"
            />
          </div>
        ) : null}

        {whatsapp.apiConfigured &&
        (whatsapp.status === 'disconnected' || whatsapp.status === 'unknown') &&
        !whatsapp.qr ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted flex items-center gap-2">
              {whatsapp.loading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : null}
              Disconnected — click Relink to generate a QR code.
            </p>
            <NeuButton
              type="button"
              variant="primary"
              onClick={handleRelink}
              disabled={whatsapp.loading}
            >
              {whatsapp.loading ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Relink WhatsApp
            </NeuButton>
          </div>
        ) : null}

        {whatsapp.status === 'error' ? (
          <p className="text-sm text-brand-negative">
            Could not reach the WhatsApp worker. Check Railway logs and CORS.
          </p>
        ) : null}
      </NeuCard>

      <NeuCard className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h3 className="font-bold">Reminder settings</h3>

          {settings.loading ? (
            <p className="text-sm text-neu-textMuted flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Loading…
            </p>
          ) : (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neu-textMuted">
                  Phone number (country code, no + — e.g. 84901234567)
                </span>
                <input
                  className={inputClass}
                  value={settings.form.phone}
                  onChange={settings.handleChange('phone')}
                  placeholder="84901234567"
                  inputMode="tel"
                />
                <span className="text-xs text-neu-textMuted">
                  Must be a WhatsApp number. Local 09… is auto-converted to 849….
                  Prefer the same number as the linked device above.
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neu-textMuted">
                  Message template
                </span>
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={settings.form.message_template}
                  onChange={settings.handleChange('message_template')}
                  rows={4}
                />
                <span className="text-xs text-neu-textMuted">
                  Placeholders: {'{person}'}, {'{amount}'}, {'{due_date}'},{' '}
                  {'{type}'}, {'{notes}'}
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
                    value={settings.form.days_before}
                    onChange={settings.handleChange('days_before')}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neu-textMuted">
                    Timezone
                  </span>
                  <input
                    className={inputClass}
                    value={settings.form.timezone}
                    onChange={settings.handleChange('timezone')}
                    placeholder="Asia/Ho_Chi_Minh"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.form.enabled}
                  onChange={settings.handleChange('enabled')}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">Enable reminders</span>
              </label>

              <div className="flex flex-wrap gap-3">
                <NeuButton
                  type="submit"
                  variant="primary"
                  disabled={settings.saving}
                >
                  {settings.saving ? (
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
                    !whatsapp.apiConfigured ||
                    whatsapp.status !== 'connected' ||
                    settings.loading
                  }
                >
                  {sendingNow ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send now
                </NeuButton>
                <NeuButton
                  type="button"
                  onClick={handleTestMessage}
                  disabled={
                    sendingNow ||
                    !whatsapp.apiConfigured ||
                    whatsapp.status !== 'connected' ||
                    settings.loading
                  }
                >
                  Test message
                </NeuButton>
              </div>
              <p className="text-xs text-neu-textMuted dark:text-darkNeu-textMuted">
                Send now messages all unpaid debts that have a due date (does not
                wait for the remind day). Test message only checks WhatsApp
                delivery. Phone must include country code (e.g. 84901234567).
              </p>
            </>
          )}
        </form>
      </NeuCard>
    </div>
  )
}
