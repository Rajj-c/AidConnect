import Link from 'next/link';
import VideoBackground from '@/components/VideoBackground';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white selection:bg-black selection:text-white pb-40">
      <VideoBackground />
      
      {/* Navigation Bar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="text-3xl tracking-tight font-headline text-black">
          AidConnect<sup className="text-sm border-none ml-[2px]">®</sup>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-body text-sm">
          <Link href="/" className="text-black transition-colors hover:text-black/70">Overview</Link>
          <Link href="/dashboard" className="text-[#6F6F6F] transition-colors hover:text-black">Dashboard</Link>
          <Link href="/dashboard/reports" className="text-[#6F6F6F] transition-colors hover:text-black">Field Logs</Link>
          <Link href="/dashboard/volunteers" className="text-[#6F6F6F] transition-colors hover:text-black">Volunteers</Link>
          <Link href="/dashboard/impact" className="text-[#6F6F6F] transition-colors hover:text-black">Impact</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold font-body text-black hover:text-black/70 transition-colors">
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="rounded-full px-6 py-2.5 text-sm bg-black/80 text-white hover:scale-[1.03] transition-transform duration-300 shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] backdrop-blur-md border border-white/20"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ paddingTop: 'calc(8rem - 75px)' }}>
        <h1 className="text-5xl sm:text-7xl md:text-8xl max-w-7xl font-normal font-headline text-black leading-[0.95] tracking-[-2.46px] animate-fade-rise opacity-0">
          Through <span className="italic text-[#6F6F6F]">chaos,</span> we coordinate <span className="italic text-[#6F6F6F]">compassion.</span>
        </h1>
        <p className="text-base sm:text-lg max-w-2xl mt-8 text-[#6F6F6F] font-body leading-relaxed animate-fade-rise-delay opacity-0">
          Connecting local NGOs with dedicated volunteers. We transform scattered field data into prioritized action, orchestrating real-time relief when it matters most.
        </p>
        
        <Link 
          href="/signup"
          className="rounded-full px-14 py-5 text-base mt-12 bg-black/80 text-white hover:scale-[1.03] transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-xl border border-white/20 animate-fade-rise-delay-2 opacity-0"
        >
          Get Started
        </Link>
      </main>
    </div>
  );
}
