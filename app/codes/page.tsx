import { db } from "@/db";
import { vouchCodes, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { CopyCode } from "./copy-code";
import { SUPPORTED_UNIVERSITIES } from "@/lib/constants/universities";
import { Users, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  // Fetch all public, unused codes with just enough issuer info
  const rows = await db
    .select({
      code: vouchCodes.code,
      issuerName: users.name,
      issuerDept: users.department,
      issuerUniversity: users.university,
      issuerBioHeadline: users.bio_headline,
    })
    .from(vouchCodes)
    .innerJoin(users, eq(vouchCodes.issuerId, users.id))
    .where(and(eq(vouchCodes.isUsed, false), eq(vouchCodes.isPublic, true)));

  // Group by university
  const byUniversity = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = byUniversity.get(row.issuerUniversity) ?? [];
    group.push(row);
    byUniversity.set(row.issuerUniversity, group);
  }

  const totalAvailable = rows.length;

  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-lg border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight">
            vouch<span className="text-rose-500">.</span>
          </span>
        </Link>
        <Link
          href="/onboarding/vouch"
          className="h-9 px-5 rounded-full bg-rose-500 text-white font-bold text-xs uppercase tracking-widest flex items-center hover:bg-rose-600 transition-colors"
        >
          Join →
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Open Codes
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-tight">
            Get your entry code.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            Every person on Vouch can share their codes with the community. Grab
            one, use it to register — the issuer stays anonymous.
          </p>

          {/* Stats pill */}
          <div className="inline-flex items-center gap-2 mt-2 bg-muted px-4 py-2 rounded-full">
            <Ticket className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-bold text-foreground">
              {totalAvailable} code{totalAvailable !== 1 ? "s" : ""} available
            </span>
          </div>
        </header>

        {totalAvailable === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-muted-foreground/40">
            <Ticket className="w-12 h-12 stroke-1" />
            <p className="text-sm font-medium">No codes available right now.</p>
            <p className="text-xs">Check back later or ask a friend.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(byUniversity.entries()).map(([uniId, codes]) => {
              const uniName =
                SUPPORTED_UNIVERSITIES.find((u) => u.id === uniId)?.name ??
                uniId;

              return (
                <section key={uniId} className="space-y-3">
                  {/* University heading */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {uniName}
                      </h2>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-bold text-muted-foreground/60">
                      {codes.length} available
                    </span>
                  </div>

                  {/* Code cards */}
                  <div className="space-y-2">
                    {codes.map((row) => {
                      // Mask identity: "Ada O." instead of full name
                      const parts = row.issuerName.trim().split(/\s+/);
                      const maskedName =
                        parts.length >= 2
                          ? `${parts[0]} ${parts[parts.length - 1][0]}.`
                          : parts[0];

                      return (
                        <div
                          key={row.code}
                          className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
                        >
                          {/* Avatar initial */}
                          <div className="w-10 h-10 shrink-0 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 font-black text-base">
                            {parts[0][0]}
                          </div>

                          {/* Issuer info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground">
                                {maskedName}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                                {row.issuerDept}
                              </span>
                            </div>
                            {row.issuerBioHeadline && (
                              <p className="text-[11px] text-muted-foreground italic mt-0.5 truncate">
                                &ldquo;{row.issuerBioHeadline}&rdquo;
                              </p>
                            )}
                            {/* The code itself */}
                            <code className="mt-1.5 inline-block font-mono font-bold text-sm text-foreground tracking-wider">
                              {row.code}
                            </code>
                          </div>

                          {/* Copy button */}
                          <CopyCode code={row.code} />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="pt-4 text-center space-y-2 border-t border-border">
          <p className="text-xs text-muted-foreground">Already have a code?</p>
          <Link
            href="/onboarding/vouch"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-rose-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-rose-600 transition-colors"
          >
            Register now →
          </Link>
        </div>
      </div>
    </main>
  );
}
