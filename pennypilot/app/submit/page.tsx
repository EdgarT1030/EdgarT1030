import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubmitForm from './SubmitForm'

export default async function SubmitPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch existing stores for the dropdown
  const { data: stores } = await supabase
    .from('stores')
    .select('id, retailer, name, city, state')
    .order('name')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-lg">
          <h1 className="text-lg font-bold text-ink">Submit a Find</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
        <SubmitForm stores={stores ?? []} userId={user.id} />
      </div>
    </div>
  )
}
