import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CodeVisibilityToggle, CopyButtonClient } from "./account-actions";

interface CodesViewProps {
  userCodes: { id: string; code: string; isUsed: boolean; isPublic: boolean }[];
  availableCodesCount: number;
}

export function CodesView({ userCodes, availableCodesCount }: CodesViewProps) {
  return (
    <main className="min-h-screen bg-background pb-24 p-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="w-10 h-10 bg-card rounded-full border border-border flex flex-col items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-black tracking-tight">Vouch Codes</h1>
          <div className="w-10 h-10" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold text-muted-foreground">
              {availableCodesCount} remaining
            </span>
          </div>

          {userCodes.length > 0 ? (
            <div className="space-y-3">
              {userCodes.map(({ id, code, isUsed, isPublic }) => (
                <div
                  key={code}
                  className={`bg-card p-5 rounded-3xl border flex justify-between items-center gap-2 transition-opacity shadow-sm ${isUsed ? "border-border opacity-50" : "border-rose-200 dark:border-rose-500/20"}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <code
                      className={`font-mono text-lg font-black tracking-wider ${isUsed ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {code}
                    </code>
                    {isUsed ? (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-muted px-2 py-1 rounded-full text-muted-foreground ml-1">
                        Used
                      </span>
                    ) : (
                      <>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full ml-1">
                          Active
                        </span>
                        <CodeVisibilityToggle
                          codeId={id}
                          initialIsPublic={isPublic}
                        />
                      </>
                    )}
                  </div>
                  {!isUsed && <CopyButtonClient text={code} />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic px-2">
              No codes available.
            </p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed px-2 mt-4 text-center">
            Share these with friends. You are permanently responsible for the
            behavior of anyone you vouch for onto the platform.
          </p>
        </div>
      </div>
    </main>
  );
}
