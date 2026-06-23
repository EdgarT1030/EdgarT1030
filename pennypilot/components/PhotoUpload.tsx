'use client'

import { useState, useRef } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PhotoUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError('')
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('report-photos').upload(path, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('report-photos').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="label">Photo of scanner (optional)</label>

      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Scanner price tag" className="h-48 w-full rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-8
                     text-sm text-ink-muted hover:border-penny hover:text-penny transition-colors disabled:opacity-50"
          aria-label="Upload photo"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-6 w-6" aria-hidden />
          )}
          {uploading ? 'Uploading…' : 'Tap to upload photo'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        aria-hidden="true"
      />

      {error && <p className="error-text">{error}</p>}
      <p className="mt-1 text-xs text-ink-faint">
        A photo of the in-store scanner showing $0.01 greatly improves trust.
      </p>
    </div>
  )
}
