import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Delete, Calculator as CalcIcon, Percent, Plus, Minus, Divide } from 'lucide-react'
import logger from '../lib/logger'

const BUTTONS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['±', '0', '.', '='],
]

const OP_MAP = { '÷': '/', '×': '*', '−': '-', '+': '+' }
const OP_SYMBOLS = new Set(['÷', '×', '−', '+'])

function evaluate(expression, currentValue) {
  try {
    const tokens = []
    let num = ''
    for (const ch of expression) {
      if ('0123456789.'.includes(ch)) {
        num += ch
      } else if ('+-*/'.includes(ch)) {
        if (num) tokens.push(parseFloat(num))
        tokens.push(ch)
        num = ''
      }
    }
    if (num) tokens.push(parseFloat(num))
    else if (currentValue !== '') tokens.push(parseFloat(currentValue))

    if (tokens.length === 0) return 0

    // Handle * and / first
    let i = 1
    while (i < tokens.length) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        const left = tokens[i - 1]
        const right = tokens[i + 1]
        const result = tokens[i] === '*' ? left * right : left / right
        tokens.splice(i - 1, 3, result)
      } else {
        i += 2
      }
    }

    // Then + and -
    let result = tokens[0]
    for (let j = 1; j < tokens.length; j += 2) {
      const op = tokens[j]
      const right = tokens[j + 1]
      if (op === '+') result += right
      else if (op === '-') result -= right
    }

    return result
  } catch (err) {
    logger.warn('Calculator expression parse failed', 'calculator', err)
    return NaN
  }
}

function formatDisplay(value) {
  if (value === '' || value === '-') return value || '0'
  const num = parseFloat(value)
  if (isNaN(num)) return value
  const parts = value.split('.')
  const intPart = Math.abs(Math.trunc(num)).toLocaleString('vi-VN')
  const sign = num < 0 || value.startsWith('-') ? '-' : ''
  return sign + intPart + (parts.length > 1 ? '.' + parts[1] : '')
}

export default function Calculator({ open, onClose }) {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [lastOp, setLastOp] = useState('')
  const [resetNext, setResetNext] = useState(false)
  const panelRef = useRef(null)
  const dragState = useRef(null)
  const [pos, setPos] = useState(null)

  const reset = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setLastOp('')
    setResetNext(false)
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      setPos(null)
    }
  }, [open, reset])

  // Drag logic
  const onPointerDown = (e) => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    dragState.current = { startX: e.clientX, startY: e.clientY, initX: rect.left, initY: rect.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setPos({ x: dragState.current.initX + dx, y: dragState.current.initY + dy })
  }
  const onPointerUp = () => { dragState.current = null }

  const handleButtonRef = useRef(null)

  const handleButton = (btn) => {
    if (btn === 'C') { reset(); return }

    if (btn === '⌫') {
      if (resetNext) { setDisplay('0'); setResetNext(false); return }
      setDisplay((d) => (d.length <= 1 || (d.length === 2 && d.startsWith('-')) ? '0' : d.slice(0, -1)))
      return
    }

    if (btn === '±') {
      setDisplay((d) => {
        if (d === '0') return d
        return d.startsWith('-') ? d.slice(1) : '-' + d
      })
      return
    }

    if (btn === '%') {
      setDisplay((d) => {
        const n = parseFloat(d)
        if (isNaN(n)) return d
        return String(n / 100)
      })
      return
    }

    if (OP_SYMBOLS.has(btn)) {
      const op = OP_MAP[btn]
      if (expression && !resetNext) {
        const result = evaluate(expression, display)
        setDisplay(String(result))
        setExpression(String(result) + op)
      } else {
        setExpression(display + op)
      }
      setLastOp(btn)
      setResetNext(true)
      return
    }

    if (btn === '=') {
      if (!expression) return
      const result = evaluate(expression, display)
      const formatted = Number.isInteger(result) ? String(result) : String(Math.round(result * 100) / 100)
      setExpression('')
      setDisplay(formatted)
      setLastOp('')
      setResetNext(true)
      return
    }

    // Number or dot
    if (btn === '.' && display.includes('.')) return
    if (resetNext) {
      setDisplay(btn === '.' ? '0.' : btn)
      setResetNext(false)
    } else {
      setDisplay((d) => (d === '0' && btn !== '.' ? btn : d + btn))
    }
  }

  handleButtonRef.current = handleButton

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      const k = e.key
      const press = (b) => handleButtonRef.current(b)
      if (k >= '0' && k <= '9') press(k)
      else if (k === '.') press('.')
      else if (k === '+') press('+')
      else if (k === '-') press('−')
      else if (k === '*') press('×')
      else if (k === '/') { e.preventDefault(); press('÷') }
      else if (k === '%') press('%')
      else if (k === 'Enter' || k === '=') press('=')
      else if (k === 'Backspace') press('⌫')
      else if (k === 'Escape') onClose()
      else if (k === 'Delete' || k.toLowerCase() === 'c') press('C')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const btnBase =
    'w-full aspect-square rounded-neu-md font-semibold text-lg transition-all-custom select-none active:scale-95 cursor-pointer flex items-center justify-center'
  const btnNum =
    `${btnBase} bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm active:shadow-neu-inner dark:active:shadow-neu-dark-inner text-neu-textMain dark:text-darkNeu-textMain`
  const btnOp =
    `${btnBase} bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm active:shadow-neu-inner dark:active:shadow-neu-dark-inner text-neu-primary dark:text-darkNeu-textMain font-bold`
  const btnEquals =
    `${btnBase} bg-neu-primary text-white shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm active:shadow-neu-inner font-bold`
  const btnAction =
    `${btnBase} bg-neu-surface dark:bg-darkNeu-surface shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm active:shadow-neu-inner dark:active:shadow-neu-dark-inner text-brand-negative font-bold`

  const getClass = (btn) => {
    if (btn === '=') return btnEquals
    if (btn === 'C' || btn === '⌫') return btnAction
    if (OP_SYMBOLS.has(btn) || btn === '%') return btnOp
    return btnNum
  }

  const panelStyle = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, zIndex: 70 }
    : { position: 'fixed', bottom: '6rem', right: '1.5rem', zIndex: 70 }

  const expressionDisplay = expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')

  return (
    <div ref={panelRef} style={panelStyle} className="w-72 bg-neu-bg dark:bg-darkNeu-bg rounded-neu-lg shadow-neu-drop dark:shadow-neu-dark-drop p-4 flex flex-col gap-3">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="flex items-center gap-2 text-sm font-bold text-neu-textMain dark:text-darkNeu-textMain">
          <CalcIcon className="w-4 h-4 text-neu-primary dark:text-darkNeu-textMain" />
          Calculator
        </div>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="w-7 h-7 rounded-full shadow-neu-drop-sm dark:shadow-neu-dark-drop-sm flex items-center justify-center text-neu-textMuted hover:text-brand-negative transition active:shadow-neu-inner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Display */}
      <div className="bg-neu-surface dark:bg-darkNeu-surface rounded-neu-md shadow-neu-inner dark:shadow-neu-dark-inner p-4">
        <div className="text-xs text-neu-textMuted dark:text-darkNeu-textMuted h-5 text-right truncate">
          {expressionDisplay || '\u00A0'}
        </div>
        <div className="text-2xl font-bold text-right text-neu-textMain dark:text-darkNeu-textMain truncate mt-1">
          {formatDisplay(display)}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2.5">
        {BUTTONS.flat().map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleButton(btn)}
            className={getClass(btn)}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  )
}
