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
import { useLocale } from '@/shared/i18n'

const CTX = 'RemindersPage'

const inputClass =
  'w-full px-4 py-3 rounded-neu-md bg-neu-bg/60 dark:bg-white/5 border border-line dark:border-line-dark outline-none text-neu-textMain dark:text-darkNeu-textMain focus:border-neu-textMuted/50 transition-all-custom'

export default function RemindersPage() {
  const session = useSessionData()
  const toast = useToast()
  const { t } = useLocale()
  const settings = useReminderSettings(session?.user?.id)
  const whatsapp = useWhatsAppLink()
  const [sendingNow, setSendingNow] = useState(false)

  useEffect(() => {
    if (settings.loadError) {
      toast.error(t('reminders.loadError'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast omitted intentionally
  }, [settings.loadError, t])

  async function handleSave(e) {
    e.preventDefault()
    try {
      const result = await settings.save()
      if (!result.ok) {
        toast.warning(result.validationError)
        return
      }
      toast.success(t('reminders.saved'))
    } catch (err) {
      toast.error(err?.message || t('reminders.saveFailed'))
    }
  }

  async function handleDisconnect() {
    try {
      await whatsapp.disconnect()
      toast.success(t('reminders.disconnectedToast'))
    } catch (err) {
      toast.error(err?.message || t('reminders.disconnectFailed'))
    }
  }

  async function handleRelink() {
    try {
      await whatsapp.relink()
      toast.success(t('reminders.relinkToast'))
    } catch (err) {
      toast.error(err?.message || t('reminders.relinkFailed'))
    }
  }

  async function handleSendNow() {
    if (!whatsapp.apiConfigured) {
      toast.warning(t('reminders.apiNotConfigured'))
      return
    }
    if (whatsapp.status !== 'connected') {
      toast.warning(t('reminders.linkBeforeSend'))
      return
    }
    if (!settings.form.phone.trim()) {
      toast.warning(t('reminders.enterPhoneFirst'))
      return
    }

    setSendingNow(true)
    try {
      const result = await whatsappApi.runReminders({ force: true })
      if (result?.reason === 'disconnected') {
        toast.warning(t('reminders.workerDisconnected'))
        return
      }
      if (result?.reason === 'no_settings') {
        toast.warning(t('reminders.saveFirst'))
        return
      }
      if (result?.reason === 'no_phone') {
        toast.warning(t('reminders.setPhone'))
        return
      }
      if (result?.reason === 'no_debts') {
        toast.warning(t('reminders.noDebts'))
        return
      }
      const sent = result?.sent ?? 0
      const failed = result?.failed ?? 0
      if (sent > 0) {
        const key =
          sent === 1 ? 'reminders.sentSuccess' : 'reminders.sentSuccessPlural'
        toast.success(
          t(key, {
            sent,
            failed: failed
              ? t('reminders.failedSuffix', { failed })
              : '',
          }),
        )
      } else if (failed > 0) {
        const key =
          failed === 1 ? 'reminders.sendFailed' : 'reminders.sendFailedPlural'
        toast.error(result?.lastError || t(key, { failed }))
      } else {
        toast.warning(t('reminders.nothingToSend'))
      }
    } catch (err) {
      toast.error(err?.message || t('reminders.sendRemindersFailed'))
      logger.error('send now failed', CTX, err)
    } finally {
      setSendingNow(false)
    }
  }

  async function handleTestMessage() {
    if (!whatsapp.apiConfigured) {
      toast.warning(t('reminders.apiNotConfigured'))
      return
    }
    if (whatsapp.status !== 'connected') {
      toast.warning(t('reminders.linkBeforeTest'))
      return
    }
    if (!settings.form.phone.trim()) {
      toast.warning(t('reminders.enterPhoneFirst'))
      return
    }

    setSendingNow(true)
    try {
      await whatsappApi.sendTestReminder()
      toast.success(t('reminders.testSent'))
    } catch (err) {
      toast.error(err?.message || t('reminders.testFailed'))
      logger.error('test message failed', CTX, err)
    } finally {
      setSendingNow(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3 text-neu-textMain dark:text-darkNeu-textMain">
          <span className="w-10 h-10 rounded-xl bg-ink text-accent flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </span>
          {t('reminders.title')}
        </h2>
        <p className="mt-2 text-sm text-neu-textMuted dark:text-darkNeu-textMuted max-w-2xl">
          {t('reminders.subtitle')}
        </p>
      </div>

      <NeuCard className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            {t('reminders.whatsappLink')}
          </h3>
          <NeuButton
            type="button"
            onClick={whatsapp.refresh}
            disabled={whatsapp.loading || !whatsapp.apiConfigured}
          >
            <RefreshCw
              className={`w-4 h-4 ${whatsapp.loading ? 'animate-spin' : ''}`}
            />
            {t('reminders.refresh')}
          </NeuButton>
        </div>

        {!whatsapp.apiConfigured ? (
          <p className="text-sm text-brand-negative">
            {t('reminders.notConfigured')}
          </p>
        ) : null}

        {whatsapp.apiConfigured && whatsapp.status === 'connected' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="space-y-1">
              <p className="text-sm text-brand-positive font-semibold">
                {t('reminders.connected')}
              </p>
              {whatsapp.linkedPhone ? (
                <p className="text-xs text-neu-textMuted dark:text-darkNeu-textMuted">
                  {t('reminders.linkedPhone', { phone: whatsapp.linkedPhone })}
                </p>
              ) : null}
            </div>
            <NeuButton
              type="button"
              onClick={handleDisconnect}
              disabled={whatsapp.loading}
            >
              <Link2Off className="w-4 h-4" />
              {t('reminders.disconnect')}
            </NeuButton>
          </div>
        ) : null}

        {whatsapp.apiConfigured && whatsapp.status === 'qr' && whatsapp.qr ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-neu-textMuted dark:text-darkNeu-textMuted">
              {t('reminders.scanQr')}
            </p>
            <img
              src={whatsapp.qr}
              alt={t('reminders.qrAlt')}
              className="w-64 h-64 rounded-neu-md bg-white p-2 border border-line dark:border-line-dark"
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
              {t('reminders.disconnected')}
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
              {t('reminders.relink')}
            </NeuButton>
          </div>
        ) : null}

        {whatsapp.status === 'error' ? (
          <p className="text-sm text-brand-negative">
            {t('reminders.reachError')}
          </p>
        ) : null}
      </NeuCard>

      <NeuCard className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h3 className="font-bold">{t('reminders.settingsTitle')}</h3>

          {settings.loading ? (
            <p className="text-sm text-neu-textMuted flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              {t('common.loading')}
            </p>
          ) : (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neu-textMuted">
                  {t('reminders.phoneLabel')}
                </span>
                <input
                  className={inputClass}
                  value={settings.form.phone}
                  onChange={settings.handleChange('phone')}
                  placeholder="84901234567"
                  inputMode="tel"
                />
                <span className="text-xs text-neu-textMuted">
                  {t('reminders.phoneHint')}
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-neu-textMuted">
                  {t('reminders.messageTemplate')}
                </span>
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={settings.form.message_template}
                  onChange={settings.handleChange('message_template')}
                  rows={4}
                />
                <span className="text-xs text-neu-textMuted">
                  {t('reminders.placeholders')}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-neu-textMuted">
                    {t('reminders.daysBefore')}
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
                    {t('reminders.timezone')}
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
                <span className="text-sm font-medium">
                  {t('reminders.enable')}
                </span>
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
                  {t('reminders.saveSettings')}
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
                  {t('reminders.sendNow')}
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
                  {t('reminders.testMessage')}
                </NeuButton>
              </div>
              <p className="text-xs text-neu-textMuted dark:text-darkNeu-textMuted">
                {t('reminders.sendHint')}
              </p>
            </>
          )}
        </form>
      </NeuCard>
    </div>
  )
}
