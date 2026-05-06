import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Note: Middleware already handles this, but server components should also check
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="h-16 border-b border-white/5 flex items-center px-8 bg-black/20 backdrop-blur-md">
        <span className="font-bold text-indigo-400">VoiceDesk Dashboard</span>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button className="text-sm px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-all">
            Sign Out
          </button>
        </div>
      </nav>
      
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">Welcome, Doctor</h1>
          <p className="text-gray-400 mt-1">Your AI receptionist is currently standing by.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Calls Today</h3>
            <p className="text-4xl font-bold text-white">12</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Appointments Scheduled</h3>
            <p className="text-4xl font-bold text-white">5</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">AI Confidence Score</h3>
            <p className="text-4xl font-bold text-green-400">98%</p>
          </div>
        </div>
        
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
          </div>
          <div className="p-12 text-center">
            <p className="text-gray-500">Call logs will appear here once Twilio integration is active.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
