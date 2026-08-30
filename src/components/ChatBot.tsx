// ── ChatBot.tsx ────────────────────────────────────────────────────────────
// Floating AI chatbot grounded in the Pandharpur Wari website data.

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { sendChatMessage, type ChatResponse } from '../api/operationsApi'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: number
}

const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const SANS: React.CSSProperties = { fontFamily: "Manrope, sans-serif" }

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: 'Hi! I\'m the WariAI assistant. Ask me anything about the Pandharpur Wari — toilets, dustbins, crowd, hotspots, sites, and more.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unread, setUnread] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(false)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError(null)
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }])
    setLoading(true)

    try {
      const res: ChatResponse = await sendChatMessage(text)
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: res.answer }])
    } catch {
      setError("Sorry, I'm unable to access the latest website data right now.")
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Sorry, I'm unable to access the latest website data right now.",
      }])
    } finally {
      setLoading(false)
      if (!open) setUnread(true)
    }
  }

  function clearChat() {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: 'Chat cleared. How can I help you with the Pandharpur Wari data?',
    }])
    setError(null)
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {/* ── Chat window ─────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          width: 380,
          maxWidth: 'calc(100vw - 48px)',
          height: 520,
          maxHeight: 'calc(100vh - 120px)',
          background: '#0E1210',
          border: '1px solid #1C2520',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #1C2520',
            background: '#111714',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#2DD4A8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...MONO, fontSize: '0.75rem', fontWeight: 700, color: '#090D0B',
              }}>W</div>
              <div>
                <div style={{ ...MONO, fontSize: '0.8125rem', fontWeight: 600, color: '#F3F6F4', letterSpacing: '0.04em' }}>
                  WariAI Assistant
                </div>
                <div style={{ ...MONO, fontSize: '0.625rem', color: '#2DD4A8', letterSpacing: '0.06em' }}>
                  ONLINE
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{
                  background: 'none', border: 'none', color: '#66736C', cursor: 'pointer',
                  ...MONO, fontSize: '0.6875rem', padding: '4px 8px', borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#66736C' }}
              >CLEAR</button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                style={{
                  background: 'none', border: 'none', color: '#66736C', cursor: 'pointer',
                  ...MONO, fontSize: '0.6875rem', padding: '4px 8px', borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#66736C' }}
              >✕</button>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#090D0B',
          }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  ...SANS,
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  background: m.role === 'user' ? '#2DD4A8' : '#111714',
                  color: m.role === 'user' ? '#090D0B' : '#F3F6F4',
                  border: m.role === 'user' ? 'none' : '1px solid #1C2520',
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: '#111714',
                  border: '1px solid #1C2520',
                  borderBottomLeftRadius: 4,
                  ...SANS,
                  fontSize: '0.8125rem',
                  color: '#9AA7A0',
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8',
                    animation: 'livePulse 1.2s ease-in-out infinite',
                  }} />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: 8,
            padding: '12px 14px',
            borderTop: '1px solid #1C2520',
            background: '#111714',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about toilets, dustbins, crowd..."
              disabled={loading}
              style={{
                flex: 1,
                background: '#090D0B',
                border: '1px solid #28332D',
                borderRadius: 10,
                padding: '10px 12px',
                color: '#F3F6F4',
                ...MONO,
                fontSize: '0.8125rem',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#2DD4A8' }}
              onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#28332D' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? '#1C2520' : '#2DD4A8',
                border: 'none',
                borderRadius: 10,
                padding: '0 16px',
                color: loading || !input.trim() ? '#66736C' : '#090D0B',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                ...MONO,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                transition: 'all 0.15s ease',
              }}
            >SEND</button>
          </form>
        </div>
      )}

      {/* ── Toggle button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: open ? '#1C2520' : '#2DD4A8',
          color: open ? '#2DD4A8' : '#090D0B',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
        title="WariAI Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!open && unread && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 12, height: 12, borderRadius: '50%',
            background: '#EF5B5B', border: '2px solid #090D0B',
          }} />
        )}
      </button>
    </div>
  )
}
