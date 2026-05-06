import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            VoiceDesk AI
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-indigo-400 transition-colors" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium px-4 py-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all" href="/dashboard">
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-48 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
             <div className="absolute bottom-[0%] right-[-5%] w-[35%] h-[35%] bg-cyan-500/10 blur-[100px] rounded-full" />
          </div>
          
          <div className="container px-4 md:px-6 text-center space-y-8 relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              AI Receptionist for <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Modern Clinics
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-400 text-lg md:text-xl">
              Automate your clinic's front desk with our intelligent voice AI. 
              Handle calls, schedule appointments, and answer patient queries 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard" className="px-8 py-4 bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                Launch Dashboard
              </Link>
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all">
                View Documentation
              </button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-white/10 text-gray-500 text-sm">
        <p>© 2026 VoiceDesk AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="hover:text-indigo-400 transition-colors" href="#">Terms of Service</Link>
          <Link className="hover:text-indigo-400 transition-colors" href="#">Privacy</Link>
        </nav>
      </footer>
    </div>
  )
}
