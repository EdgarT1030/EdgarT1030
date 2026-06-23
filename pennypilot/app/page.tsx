import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'
import type { ReportWithDetails, PredictionWithItem, Profile } from '@/lib/supabase/types'

async function fetchDashboardData() {
  const supabase = createClient()

  const [
    { data: { user } },
    { data: reportRows, error: repErr },
    { data: predRows  },
    { count: todayCount },
  ] = await Promise.all([
    supabase.auth.getUser(),

    (supabase as any)
      .from('penny_reports')
      .select('*, item:items(*), store:stores(*), vote_counts:report_votes(vote)')
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(60),

    (supabase as any)
      .from('predictions')
      .select('*, item:items(*)')
      .gte('score', 30)
      .order('score', { ascending: false })
      .limit(12),

    (supabase as any)
      .from('penny_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  if (repErr) console.error('[dashboard] reports fetch:', repErr.message)

  const reports: ReportWithDetails[] = (reportRows ?? []).map((r: any) => {
    const votes: { vote: string }[] = r.vote_counts ?? []
    return {
      ...r,
      vote_counts: {
        confirm: votes.filter((v) => v.vote === 'confirm').length,
        dispute:  votes.filter((v) => v.vote === 'dispute').length,
      },
    }
  })

  const predictions: PredictionWithItem[] = predRows ?? []

  let profile: Profile | null = null
  if (user) {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data ?? null
  }

  return { reports, predictions, profile, nearbyCount: todayCount ?? 0 }
}

export default async function DashboardPage() {
  const { reports, predictions, profile, nearbyCount } = await fetchDashboardData()

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        initialReports={reports}
        predictions={predictions}
        profile={profile}
        nearbyCount={nearbyCount}
      />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-4 space-y-5 animate-pulse">
      <div className="h-14 rounded-2xl bg-paper-muted" />
      <div className="h-52 rounded-2xl bg-paper-muted" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-paper-muted" />
        ))}
      </div>
    </div>
  )
}
