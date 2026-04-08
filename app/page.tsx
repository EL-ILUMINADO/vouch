import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const mockProfiles = [
  {
    initial: "A",
    name: "Ada, 21",
    detail: "Engineering · UNIBEN",
    gradient: "from-rose-400 to-pink-500",
    rotate: "-rotate-6",
    offset: "-left-2 top-6",
    emoji: "💫",
  },
  {
    initial: "K",
    name: "Kofi, 23",
    detail: "Medicine · UNILAG",
    gradient: "from-violet-400 to-purple-500",
    rotate: "rotate-5",
    offset: "-right-2 top-10",
    emoji: "✨",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-rose-50 via-background to-purple-50/40 dark:from-rose-950/20 dark:via-background dark:to-purple-950/20 text-foreground overflow-hidden relative">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-rose-300/20 dark:bg-rose-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-purple-300/20 dark:bg-purple-500/10 blur-3xl" />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            vouch
            <span className="text-rose-500">.</span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <ThemeToggle />
      </nav>

      {/* Hero */}
      <div className="relative z-10 px-6 pt-6 pb-12 max-w-sm mx-auto flex flex-col items-center text-center gap-8">
        {/* Floating profile cards */}
        <div className="relative w-full h-48 flex items-center justify-center">
          {mockProfiles.map((p) => (
            <div
              key={p.name}
              className={`absolute ${p.offset} ${p.rotate} bg-white dark:bg-card rounded-3xl px-4 py-3 shadow-lg border border-white dark:border-border flex items-center gap-3`}
            >
              <div
                className={`w-9 h-9 rounded-full bg-linear-to-br ${p.gradient} flex items-center justify-center text-white font-black text-sm shrink-0`}
              >
                {p.initial}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-none">{p.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {p.detail}
                </p>
              </div>
              <span className="text-base">{p.emoji}</span>
            </div>
          ))}

          {/* Centre card */}
          <div className="relative z-10 bg-white dark:bg-card rounded-3xl px-5 py-4 shadow-xl border border-rose-100 dark:border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-black shrink-0">
              Z
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Zara, 22</p>
              <p className="text-[10px] text-muted-foreground">Law · UNIBEN</p>
            </div>
            <span className="text-base">🌸</span>
          </div>

          {/* Floating heart */}
          <span className="absolute top-1 right-10 text-2xl animate-bounce select-none">
            💕
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-[2.75rem] font-black tracking-tight leading-[1.1]">
            Meet someone{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-400">
              real
            </span>{" "}
            on campus.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Vouch is the invite-only dating &amp; social app for Nigerian
            university students. Real people, real campus vibes.
          </p>
        </div>

        {/* Trust stats */}
        <div className="flex items-center gap-6 text-center">
          {[
            { value: "100%", label: "Verified" },
            { value: "Campus", label: "Only" },
            { value: "Free", label: "Always" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-6">
              {i > 0 && <div className="w-px h-8 bg-border" />}
              <div>
                <p className="text-xl font-black">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="w-full space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full h-14 text-sm font-bold rounded-2xl bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-rose-200/60 dark:shadow-none"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full h-14 text-sm font-bold rounded-2xl border-border hover:bg-accent group"
          >
            <Link href="/onboarding/vouch" className="flex items-center gap-2">
              <span>I have a Vouch Code</span>
              <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full group-hover:bg-rose-200 dark:group-hover:bg-rose-500/30 transition-colors">
                Join →
              </span>
            </Link>
          </Button>
        </div>

        {/* Trust note */}
        <p className="text-[11px] text-muted-foreground">
          🔒 Only students from verified universities can join.
        </p>
      </div>

      {/* Feature cards */}
      <div className="relative z-10 px-6 pb-16 max-w-sm mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: "🛡️",
              title: "Verified",
              desc: "Every profile is a real student",
            },
            {
              icon: "📍",
              title: "Nearby",
              desc: "Meet people on your campus",
            },
            {
              icon: "💌",
              title: "Vouched",
              desc: "Only invited students can join",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/70 dark:bg-card/70 backdrop-blur-sm rounded-2xl p-4 border border-white/80 dark:border-border text-center space-y-2"
            >
              <span className="text-2xl block">{f.icon}</span>
              <p className="text-xs font-bold">{f.title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-8">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Vouch · Made for students
        </p>
      </div>
    </main>
  );
}
