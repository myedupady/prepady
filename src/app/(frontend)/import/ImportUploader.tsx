'use client'

import { useState } from 'react'
import { Upload, FileDown, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const HEADERS = 'type,exam,subject,topic,difficulty,year,variant,question,optionA,optionB,optionC,optionD,optionE,correct,marking_scheme,max_marks,explanation,video_url,image,status,source_ref'
const SAMPLE = `${HEADERS}
mcq,JAMB / UTME,English Language,Comprehension,2,2019,A,"The author's main purpose is to...",Inform,Persuade,Entertain,Describe,,B,,1,,,,published,JAMB-2019-ENG-Q1
mcq,JAMB / UTME,Mathematics,Algebra,2,2019,A,"Solve 2x + 3 = 7",x = 1,x = 2,x = 3,x = 4,,B,,1,"Subtract 3 then divide by 2.",,,published,JAMB-2019-MTH-Q1`

interface Result {
  ok?: boolean; total?: number; created?: number; updated?: number; skipped?: number; invalid?: number
  errors?: string[]; imagesNote?: string | null; error?: string
}

export function ImportUploader() {
  const [csv, setCsv] = useState('')
  const [publish, setPublish] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsv(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prepady-questions-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function submit() {
    if (!csv.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const r = await fetch('/api/admin/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csv, publish }),
      })
      setResult(await r.json())
    } catch {
      setResult({ error: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border-2 border-border bg-background text-sm font-bold text-ink-900 hover:border-ink-900 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Choose CSV file
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          </label>
          <Button type="button" onClick={downloadTemplate} variant="outline" className="rounded-xl font-bold"><FileDown className="w-4 h-4" /> Template</Button>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900 ml-auto">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="w-4 h-4 accent-gold-600" />
            Publish immediately
          </label>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="…or paste CSV here (first row = column headers)."
          rows={10}
          className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">Columns: <span className="font-mono">{HEADERS}</span></p>
          <Button onClick={submit} disabled={!csv.trim() || loading} variant="accent" className="rounded-xl font-black">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Import</>}
          </Button>
        </div>
      </div>

      {result && (
        <div className={`rounded-2xl border p-5 ${result.error ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}>
          {result.error ? (
            <p className="flex items-center gap-2 text-sm font-bold text-destructive"><AlertTriangle className="w-4 h-4" /> {result.error}</p>
          ) : (
            <>
              <p className="flex items-center gap-2 font-black text-ink-900 mb-2"><CheckCircle2 className="w-5 h-5 text-success" /> Import complete</p>
              <p className="text-sm text-muted-foreground">
                {result.created} created · {result.updated} updated · {result.skipped} skipped · {result.invalid} invalid (of {result.total} rows).
              </p>
              {result.imagesNote && <p className="text-xs text-gold-700 mt-2">{result.imagesNote}</p>}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-3 max-h-56 overflow-auto rounded-lg bg-background border border-border p-3">
                  {result.errors.map((e, i) => <p key={i} className="text-xs text-destructive font-mono">{e}</p>)}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
