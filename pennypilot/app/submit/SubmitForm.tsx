'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronDown } from 'lucide-react'
import { submitReportSchema } from '@/lib/validators'
import { RETAILER_OPTIONS, CATEGORY_OPTIONS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import PhotoUpload from '@/components/PhotoUpload'
import type { Store } from '@/lib/supabase/types'

interface SubmitFormProps {
  stores: Pick<Store, 'id' | 'retailer' | 'name' | 'city' | 'state'>[]
  userId: string
}

type FormErrors = Partial<Record<string, string>>

export default function SubmitForm({ stores, userId }: SubmitFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [addingStore, setAddingStore] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')

  // Form state
  const [sku, setSku] = useState('')
  const [modelNumber, setModelNumber] = useState('')
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('')
  const [storeId, setStoreId] = useState('')

  // New store fields
  const [newRetailer, setNewRetailer] = useState<string>('home_depot')
  const [storeNumber, setStoreNumber] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeCity, setStoreCity] = useState('')
  const [storeState, setStoreState] = useState('')
  const [storeZip, setStoreZip] = useState('')
  const [storeLat, setStoreLat] = useState('')
  const [storeLng, setStoreLng] = useState('')

  function detectLocation() {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setStoreLat(coords.latitude.toFixed(6))
      setStoreLng(coords.longitude.toFixed(6))
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerError('')

    const raw = {
      sku: sku || undefined,
      model_number: modelNumber || undefined,
      item_name: itemName,
      category,
      store_id: addingStore ? undefined : storeId || undefined,
      new_store: addingStore
        ? {
            retailer: newRetailer as any,
            store_number: storeNumber || undefined,
            name: storeName,
            address: storeAddress,
            city: storeCity,
            state: storeState,
            zip: storeZip,
            lat: parseFloat(storeLat),
            lng: parseFloat(storeLng),
          }
        : undefined,
      photo_url: photoUrl || undefined,
    }

    const parsed = submitReportSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: FormErrors = {}
      parsed.error.issues.forEach(issue => {
        fieldErrors[issue.path.join('.')] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Resolve store
      let resolvedStoreId = parsed.data.store_id!
      if (parsed.data.new_store) {
        const { data: newStore, error } = await supabase
          .from('stores')
          .insert(parsed.data.new_store as any)
          .select('id')
          .single()
        if (error) throw error
        resolvedStoreId = (newStore as any).id
      }

      // 2. Upsert item by SKU / model number
      const itemPayload = {
        sku: parsed.data.sku ?? null,
        model_number: parsed.data.model_number ?? null,
        name: parsed.data.item_name,
        category: parsed.data.category,
        created_by: userId,
      }

      // Check if item already exists
      const skuQuery = parsed.data.sku
        ? supabase.from('items').select('id').eq('sku', parsed.data.sku)
        : supabase.from('items').select('id').eq('model_number', parsed.data.model_number!)

      const { data: existing } = await skuQuery.maybeSingle()

      let itemId: string
      if (existing) {
        itemId = (existing as any).id
      } else {
        const { data: newItem, error } = await supabase.from('items').insert(itemPayload as any).select('id').single()
        if (error) throw error
        itemId = (newItem as any).id
      }

      // 3. Create report
      const { data: report, error: reportError } = await supabase
        .from('penny_reports')
        .insert({
          item_id: itemId,
          store_id: resolvedStoreId,
          reported_price: 0.01,
          photo_url: parsed.data.photo_url || null,
          reported_by: userId,
        } as any)
        .select('id')
        .single()

      if (reportError) throw reportError

      router.push(`/report/${(report as any).id}`)
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Item info */}
      <div className="card p-4 space-y-4">
        <h2 className="text-sm font-semibold text-ink">Item details</h2>

        <div>
          <label htmlFor="sku" className="label">SKU <span className="text-ink-faint font-normal">(or model number)</span></label>
          <input id="sku" className="input" value={sku} onChange={e => setSku(e.target.value)}
            placeholder="e.g. 1001541689" autoCorrect="off" autoCapitalize="off" />
          {errors.sku && <p className="error-text">{errors.sku}</p>}
        </div>

        <div>
          <label htmlFor="model_number" className="label">Model number <span className="text-ink-faint font-normal">(optional)</span></label>
          <input id="model_number" className="input" value={modelNumber} onChange={e => setModelNumber(e.target.value)}
            placeholder="e.g. GE-LED60W-A19" autoCorrect="off" autoCapitalize="off" />
        </div>

        <div>
          <label htmlFor="item_name" className="label">Item name</label>
          <input id="item_name" className="input" value={itemName} onChange={e => setItemName(e.target.value)}
            placeholder="e.g. GE 60W LED Bulb 4-Pack" required />
          {errors.item_name && <p className="error-text">{errors.item_name}</p>}
        </div>

        <div>
          <label htmlFor="category" className="label">Category</label>
          <div className="relative">
            <select id="category" className="input appearance-none pr-8" value={category}
              onChange={e => setCategory(e.target.value)}>
              <option value="">Select a category…</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          </div>
          {errors.category && <p className="error-text">{errors.category}</p>}
        </div>
      </div>

      {/* Store */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Store</h2>
          <button type="button" onClick={() => setAddingStore(v => !v)}
            className="text-xs font-medium text-penny">
            {addingStore ? '← Use existing' : '+ Add new store'}
          </button>
        </div>

        {!addingStore ? (
          <div>
            <label htmlFor="store_id" className="label">Select store</label>
            <div className="relative">
              <select id="store_id" className="input appearance-none pr-8" value={storeId}
                onChange={e => setStoreId(e.target.value)}>
                <option value="">Choose a store…</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.city}, {s.state}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            </div>
            {errors['store_id'] && <p className="error-text">{errors['store_id']}</p>}
            {stores.length === 0 && (
              <p className="mt-2 text-xs text-ink-muted">No stores yet — add one above.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="new_retailer" className="label">Retailer</label>
              <div className="relative">
                <select id="new_retailer" className="input appearance-none pr-8" value={newRetailer}
                  onChange={e => setNewRetailer(e.target.value)}>
                  {RETAILER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
              </div>
            </div>
            <div>
              <label htmlFor="store_number" className="label">Store number <span className="text-ink-faint font-normal">(optional)</span></label>
              <input id="store_number" className="input" value={storeNumber} onChange={e => setStoreNumber(e.target.value)} placeholder="e.g. 0123" />
            </div>
            <div>
              <label htmlFor="store_name" className="label">Store name</label>
              <input id="store_name" className="input" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="e.g. Home Depot - Austin North" required />
              {errors['new_store.name'] && <p className="error-text">{errors['new_store.name']}</p>}
            </div>
            <div>
              <label htmlFor="store_address" className="label">Address</label>
              <input id="store_address" className="input" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="1234 Main St" />
              {errors['new_store.address'] && <p className="error-text">{errors['new_store.address']}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="store_city" className="label">City</label>
                <input id="store_city" className="input" value={storeCity} onChange={e => setStoreCity(e.target.value)} placeholder="Austin" />
              </div>
              <div>
                <label htmlFor="store_state" className="label">State</label>
                <input id="store_state" className="input" value={storeState} onChange={e => setStoreState(e.target.value.toUpperCase())} placeholder="TX" maxLength={2} />
                {errors['new_store.state'] && <p className="error-text">{errors['new_store.state']}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="store_zip" className="label">ZIP code</label>
              <input id="store_zip" className="input" value={storeZip} onChange={e => setStoreZip(e.target.value)} placeholder="78701" />
              {errors['new_store.zip'] && <p className="error-text">{errors['new_store.zip']}</p>}
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label mb-0">Coordinates</span>
                <button type="button" onClick={detectLocation}
                  className="text-xs font-medium text-penny">
                  Use my location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" value={storeLat} onChange={e => setStoreLat(e.target.value)} placeholder="Latitude" />
                <input className="input" value={storeLng} onChange={e => setStoreLng(e.target.value)} placeholder="Longitude" />
              </div>
              <p className="mt-1 text-xs text-ink-faint">Used for distance sorting &mdash; tap &ldquo;Use my location&rdquo; when you&apos;re at the store.</p>
              {errors['new_store.lat'] && <p className="error-text">{errors['new_store.lat']}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Photo */}
      <div className="card p-4">
        <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
      </div>

      {serverError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {loading ? 'Submitting…' : 'Submit find'}
      </button>

      <p className="text-center text-xs text-ink-faint">
        Penny pricing is unofficial. Only submit genuine finds; false reports hurt the community.
      </p>
    </form>
  )
}
