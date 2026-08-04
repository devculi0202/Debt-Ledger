import { admin } from './supabase.js'
import { getWhatsAppState, sendTextMessage, logger } from './baileys.js'

function todayInTimezone(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }
}

function subtractDays(isoDate, days) {
  const [y, m, d] = String(isoDate).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - Number(days))
  return dt.toISOString().slice(0, 10)
}

function formatAmount(amount) {
  try {
    return Number(amount).toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    })
  } catch {
    return String(amount)
  }
}

function renderTemplate(template, debt) {
  const raw =
    template ||
    'Reminder: {person} — {amount} due on {due_date}.'
  return raw
    .replaceAll('{person}', debt.person || 'Unknown')
    .replaceAll('{amount}', formatAmount(debt.amount))
    .replaceAll('{due_date}', debt.due_date || '')
    .replaceAll('{type}', debt.type || '')
    .replaceAll('{notes}', debt.notes || '')
}

function isUnpaid(paid) {
  return paid !== true && paid !== 'true'
}

export async function runReminderScan({ userId } = {}) {
  if (!admin) {
    logger.warn('Skipping reminder scan: Supabase admin client not configured')
    return { scanned: 0, sent: 0, skipped: 0 }
  }

  const wa = getWhatsAppState()
  if (!wa.connected) {
    logger.info('Skipping reminder scan: WhatsApp not connected')
    return { scanned: 0, sent: 0, skipped: 0, reason: 'disconnected' }
  }

  let settingsQuery = admin.from('reminder_settings').select('*').eq('enabled', true)
  if (userId) {
    settingsQuery = settingsQuery.eq('user_id', userId)
  }

  const { data: settingsRows, error: settingsError } = await settingsQuery

  if (settingsError) {
    logger.error({ err: settingsError }, 'Failed to load reminder_settings')
    throw settingsError
  }

  let scanned = 0
  let sent = 0
  let skipped = 0

  for (const settings of settingsRows || []) {
    if (!settings.phone?.trim()) {
      skipped += 1
      continue
    }

    const today = todayInTimezone(settings.timezone)
    const daysBefore = Number(settings.days_before ?? 3)

    const { data: debts, error: debtsError } = await admin
      .from('debts')
      .select('id, person, amount, due_date, type, notes, paid, user_id')
      .eq('user_id', settings.user_id)
      .not('due_date', 'is', null)

    if (debtsError) {
      logger.error({ err: debtsError, userId: settings.user_id }, 'Failed to load debts')
      continue
    }

    for (const debt of debts || []) {
      scanned += 1
      if (!isUnpaid(debt.paid)) {
        skipped += 1
        continue
      }

      const remindOn = subtractDays(debt.due_date, daysBefore)
      if (!remindOn || remindOn !== today) {
        skipped += 1
        continue
      }

      const { data: existing } = await admin
        .from('reminder_sends')
        .select('id')
        .eq('debt_id', debt.id)
        .eq('remind_on_date', remindOn)
        .maybeSingle()

      if (existing) {
        skipped += 1
        continue
      }

      const text = renderTemplate(settings.message_template, debt)

      try {
        await sendTextMessage(settings.phone, text)
        const { error: insertError } = await admin.from('reminder_sends').insert({
          user_id: settings.user_id,
          debt_id: debt.id,
          remind_on_date: remindOn,
        })
        if (insertError) {
          logger.error({ err: insertError, debtId: debt.id }, 'Sent but failed to log reminder_sends')
        }
        sent += 1
        logger.info({ debtId: debt.id, remindOn }, 'Reminder sent')
      } catch (err) {
        logger.error({ err, debtId: debt.id }, 'Failed to send reminder')
      }
    }
  }

  return { scanned, sent, skipped }
}
