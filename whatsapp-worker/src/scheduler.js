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

export function renderTemplate(template, debt) {
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

/**
 * @param {{ userId?: string, force?: boolean }} [opts]
 * force=true: send all unpaid debts with a due date (ignores days_before window + prior sends for today)
 */
export async function runReminderScan({ userId, force = false } = {}) {
  if (!admin) {
    logger.warn('Skipping reminder scan: Supabase admin client not configured')
    return {
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: 'no_admin',
    }
  }

  const wa = getWhatsAppState()
  if (!wa.connected) {
    logger.info('Skipping reminder scan: WhatsApp not connected')
    return {
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: 'disconnected',
    }
  }

  let settingsQuery = admin.from('reminder_settings').select('*')
  if (userId) {
    settingsQuery = settingsQuery.eq('user_id', userId)
  } else {
    settingsQuery = settingsQuery.eq('enabled', true)
  }

  const { data: settingsRows, error: settingsError } = await settingsQuery

  if (settingsError) {
    logger.error({ err: settingsError }, 'Failed to load reminder_settings')
    throw settingsError
  }

  let scanned = 0
  let sent = 0
  let skipped = 0
  let failed = 0
  const skipReasons = {
    disabled: 0,
    no_phone: 0,
    paid: 0,
    not_due: 0,
    already_sent: 0,
    no_debts: 0,
  }

  const rows = settingsRows || []
  if (rows.length === 0) {
    return {
      scanned: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      reason: 'no_settings',
      force: Boolean(force),
      skipReasons,
    }
  }

  for (const settings of rows) {
    if (!force && !settings.enabled) {
      skipReasons.disabled += 1
      skipped += 1
      continue
    }

    if (!settings.phone?.trim()) {
      skipReasons.no_phone += 1
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
      failed += 1
      continue
    }

    if (!debts?.length) {
      skipReasons.no_debts += 1
    }

    for (const debt of debts || []) {
      scanned += 1
      if (!isUnpaid(debt.paid)) {
        skipReasons.paid += 1
        skipped += 1
        continue
      }

      const remindOn = subtractDays(debt.due_date, daysBefore)
      if (!force) {
        if (!remindOn || remindOn !== today) {
          skipReasons.not_due += 1
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
          skipReasons.already_sent += 1
          skipped += 1
          continue
        }
      }

      const logDate = force ? today : remindOn
      const text = renderTemplate(settings.message_template, debt)

      try {
        await sendTextMessage(settings.phone, text)
        const { error: insertError } = await admin.from('reminder_sends').upsert(
          {
            user_id: settings.user_id,
            debt_id: debt.id,
            remind_on_date: logDate,
          },
          { onConflict: 'debt_id,remind_on_date' },
        )
        if (insertError) {
          logger.error(
            { err: insertError, debtId: debt.id },
            'Sent but failed to log reminder_sends',
          )
        }
        sent += 1
        logger.info({ debtId: debt.id, remindOn: logDate, force }, 'Reminder sent')
      } catch (err) {
        failed += 1
        logger.error({ err, debtId: debt.id }, 'Failed to send reminder')
      }
    }
  }

  let reason
  if (sent === 0 && failed > 0) reason = 'send_failed'
  else if (sent === 0 && skipReasons.no_phone) reason = 'no_phone'
  else if (sent === 0 && skipReasons.no_debts && scanned === 0) reason = 'no_debts'
  else if (sent === 0 && skipReasons.not_due) reason = 'not_due'
  else if (sent === 0 && skipReasons.already_sent) reason = 'already_sent'
  else if (sent === 0) reason = 'nothing_to_send'

  return {
    scanned,
    sent,
    skipped,
    failed,
    force: Boolean(force),
    reason,
    skipReasons,
  }
}

/** Send one plain text message to the user's configured reminder phone. */
export async function sendTestReminder(userId) {
  if (!admin) {
    return { ok: false, reason: 'no_admin' }
  }
  if (!userId) {
    return { ok: false, reason: 'no_user' }
  }

  const wa = getWhatsAppState()
  if (!wa.connected) {
    return { ok: false, reason: 'disconnected' }
  }

  const { data: settings, error } = await admin
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!settings) {
    return { ok: false, reason: 'no_settings' }
  }
  if (!settings.phone?.trim()) {
    return { ok: false, reason: 'no_phone' }
  }

  const text = `Debt Ledger test: WhatsApp link OK (${new Date().toISOString()}).`
  await sendTextMessage(settings.phone, text)
  return { ok: true, phone: settings.phone.replace(/\d(?=\d{4})/g, '*') }
}
