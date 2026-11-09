'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Camera, Mic, Send, Loader2, Sparkles, Lock, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MathText } from '@/components/MathText'

type Mode = 'snap' | 'ask'

// Minimal Web Speech typing (browsers vary; feature-detected at runtime).
interface SpeechRec { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

async function fileToDownscaledBase64(file: File): Promise<{ data: string; mediaType: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = URL.createObjectURL(file)
  })
  const maxDim = 1400
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unsupported')
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(img.src)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
  return { data: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' }
}

export function SnapSolve() {
  const [mode, setMode] = useState<Mode>('snap')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  // Snap state
  const [preview, setPreview] = useState<string | null>(null)
  const imgData = useRef<{ data: string; mediaType: string } | null>(null)
  const [note, setNote] = useState('')

  // Ask state
  const [question, setQuestion] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRec | null>(null)
  const canSpeak = !!getSpeechRecognition()

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setResult(null)
    try {
      setPreview(URL.createObjectURL(file))
      imgData.current = await fileToDownscaledBase64(file)
    } catch {
      setError('Could not read that image. Try another photo.')
    }
  }

  async function solve() {
    if (!imgData.current || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    setLocked(false)
    try {
      const r = await fetch('/api/ai/snap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageBase64: imgData.current.data, mediaType: imgData.current.mediaType, note }),
      })
      const data = await r.json()
      if (r.status === 403 && data.requiresUpgrade) { setLocked(true); return }
      if (!r.ok) { setError(data.error || 'Could not solve that.'); return }
      setResult(data.solution)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleMic() {
    const SR = getSpeechRecognition()
    if (!SR) return
    if (listening) { recRef.current?.stop(); return }
    const rec = new SR()
    rec.lang = 'en-NG'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      setQuestion(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  async function ask() {
    const q = question.trim()
    if (!q || loading) return
    if (listening) recRef.current?.stop()
    setLoading(true)
    setError(null)
    setResult(null)
    setLocked(false)
    try {
      const r = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: q }),
      })
      const data = await r.json()
      if (r.status === 403 && data.requiresUpgrade) { setLocked(true); return }
      if (!r.ok) { setError(data.error || 'Could not answer that.'); return }
      setResult(data.answer)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="inline-flex p-1 rounded-xl bg-muted mb-5">
        {(['snap', 'ask'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-black transition-colors ${mode === m ? 'bg-card text-ink-900 shadow-brand' : 'text-muted-foreground'}`}
          >
            {m === 'snap' ? 'Snap & Solve' : 'Voice Ask'}
          </button>
        ))}
      </div>

      {mode === 'snap' ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          {preview ? (
            <div className="relative mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your question" className="w-full max-h-80 object-contain rounded-xl border border-border bg-ink-50" />
              <button onClick={() => { setPreview(null); imgData.current = null; setResult(null) }} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-ink-900/80 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 py-12 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-ink-900 transition-colors mb-4">
              <Camera className="w-9 h-9 text-gold-500" />
              <span className="font-bold text-ink-900">Take a photo or upload</span>
              <span className="text-xs text-muted-foreground">One clear question works best</span>
              <input type="file" accept="image/*" capture="environment" onChange={onPickImage} className="hidden" />
            </label>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional: add a note (e.g. 'just part b')"
            className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-4"
          />
          <Button onClick={solve} disabled={!preview || loading} variant="accent" className="w-full rounded-xl font-black h-12">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Solve it</>}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex gap-2 mb-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={canSpeak ? 'Tap the mic and speak, or type your question…' : 'Type your question…'}
              rows={3}
              className="flex-1 rounded-xl border border-input bg-background p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {canSpeak && (
              <button
                onClick={toggleMic}
                className={`w-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${listening ? 'bg-destructive text-white animate-pulse' : 'bg-ink-900 text-gold-400'}`}
                title={listening ? 'Stop' : 'Speak'}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          <Button onClick={ask} disabled={!question.trim() || loading} variant="accent" className="w-full rounded-xl font-black h-12">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Ask the tutor</>}
          </Button>
          {!canSpeak && <p className="text-[11px] text-muted-foreground mt-2">Voice input isn’t supported in this browser — typing works everywhere.</p>}
        </div>
      )}

      {/* Result */}
      {locked ? (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-5 text-center">
          <Lock className="w-6 h-6 text-gold-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-ink-900 mb-3">This is a Premium Plus feature.</p>
          <Button asChild variant="accent" size="sm" className="rounded-lg font-black"><Link href="/upgrade">Get Premium Plus</Link></Button>
        </div>
      ) : error ? (
        <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>
      ) : result ? (
        <div className="mt-5 rounded-2xl bg-gold-50 border border-gold-200 p-5">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gold-700 mb-2"><ImageIcon className="w-3.5 h-3.5" /> Solution</p>
          <div className="text-sm text-ink-900 leading-relaxed whitespace-pre-line"><MathText>{result}</MathText></div>
        </div>
      ) : null}
    </div>
  )
}
