import { useState, useCallback } from 'react'

export default function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', resolve: null })

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setState({ open: true, title, message, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState({ open: false, title: '', message: '', resolve: null })
  }, [state])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState({ open: false, title: '', message: '', resolve: null })
  }, [state])

  return {
    confirmState: { open: state.open, title: state.title, message: state.message },
    confirm,
    handleConfirm,
    handleCancel,
  }
}
