import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ReportCard from '@/components/ReportCard'
import EmptyState from '@/components/ui/EmptyState'
import ProfileUsername from './ProfileUsername'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [profileResult, reportsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any)
      .from('penny_reports')
      .select(`*, item:items(*), store:stores(*), vote_counts:report_votes(vote)`)
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const profile = profileResult.data as import('@/lib/supabase/types').Profile | null
  const myReports = reportsResult.data as any[] | null

  const reports = (myReports ?? []).map((r: any) => {
    const votes: { vote: string }[] = r.vote_counts ?? []
    return {
      ...r,
      vote_counts: {
        confirm: votes.filter(v => v.vote === 'confirm').length,
        dispute: votes.filter(v => v.vote === 'dispute').length,
      },
    }
  })

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-ink">Profile</h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="btn-ghost flex items-center gap-1.5 text-sm text-ink-muted"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4 pb-8 space-y-4">
        {/* Profile card */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-penny/10 text-2xl font-bold text-penny">
              {(profile?.username ?? user.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-ink-muted">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 text-amber-500" aria-hidden />
                <span className="font-semibold text-ink">{profile?.reputation_score ?? 0}</span>
                <span className="text-ink-faint">reputation</span>
              </div>
            </div>
          </div>

          <ProfileUsername currentUsername={profile?.username ?? null} userId={user.id} />
        </div>

        {/* My reports */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">My finds ({reports.length})</h2>
          {reports.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No finds yet"
              description="Submit your first penny find to start building reputation!"
              action={<Link href="/submit" className="btn-primary">Submit a find</Link>}
            />
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
