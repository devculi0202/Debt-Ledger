import { useCallback, useEffect, useState } from 'react'
import * as whatsappApi from '../api/whatsappApi'
import logger from '@/shared/lib/logger'

const CTX = 'useWhatsAppLink'

/**
 * WhatsApp worker connection lifecycle: status polling, QR, disconnect, relink.
 */
export default function useWhatsAppLink({ pollIntervalMs = 4000 } = {}) {
  const [status, setStatus] = useState('unknown')
  const [qr, setQr] = useState(null)
  const [linkedPhone, setLinkedPhone] = useState(null)
  const [loading, setLoading] = useState(false)
  const apiConfigured = whatsappApi.isWhatsAppApiConfigured()

  const refresh = useCallback(async () => {
    if (!apiConfigured) {
      setStatus('unconfigured')
      setQr(null)
      setLinkedPhone(null)
      return
    }
    setLoading(true)
    try {
      const statusRes = await whatsappApi.getStatus()
      setStatus(statusRes.status || 'disconnected')
      setLinkedPhone(statusRes.linkedPhone || null)
      if (statusRes.status === 'qr' || statusRes.qr) {
        const qrRes = statusRes.qr ? statusRes : await whatsappApi.getQr()
        setQr(qrRes.qr || null)
      } else {
        setQr(null)
      }
    } catch (err) {
      setStatus('error')
      setQr(null)
      setLinkedPhone(null)
      logger.error('WhatsApp status failed', CTX, err)
    } finally {
      setLoading(false)
    }
  }, [apiConfigured])

  useEffect(() => {
    if (!apiConfigured) {
      const t = setTimeout(() => {
        setStatus('unconfigured')
        setQr(null)
        setLinkedPhone(null)
      }, 0)
      return () => clearTimeout(t)
    }
    const tick = () => {
      void refresh()
    }
    const t = setTimeout(tick, 0)
    const id = setInterval(tick, pollIntervalMs)
    return () => {
      clearTimeout(t)
      clearInterval(id)
    }
  }, [apiConfigured, pollIntervalMs, refresh])

  async function disconnect() {
    setLoading(true)
    try {
      await whatsappApi.disconnect()
      await refresh()
    } catch (err) {
      logger.error('WhatsApp disconnect failed', CTX, err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function relink() {
    setLoading(true)
    try {
      await whatsappApi.relink()
      for (let i = 0; i < 10; i += 1) {
        await new Promise((r) => setTimeout(r, 1200))
        try {
          const statusRes = await whatsappApi.getStatus()
          const next = statusRes.status || 'disconnected'
          setStatus(next)
          setLinkedPhone(statusRes.linkedPhone || null)
          if (next === 'qr') {
            const qrRes = statusRes.qr ? statusRes : await whatsappApi.getQr()
            setQr(qrRes.qr || null)
            break
          }
          if (next === 'connected') {
            setQr(null)
            break
          }
          setQr(null)
        } catch {
          /* keep polling */
        }
      }
    } catch (err) {
      logger.error('WhatsApp relink failed', CTX, err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    apiConfigured,
    status,
    qr,
    linkedPhone,
    loading,
    refresh,
    disconnect,
    relink,
  }
}
