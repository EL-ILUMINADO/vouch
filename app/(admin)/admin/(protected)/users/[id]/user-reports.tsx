import Link from "next/link";
import { Flag } from "lucide-react";
import { SectionHeading } from "./ui";
import { REPORT_STATUS_STYLE, REPORT_REASON_LABEL } from "./constants";
import { fmtDate } from "./utils";

type Report = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  adminNote: string | null;
  createdAt: Date | string;
  reviewedAt: Date | string | null;
  reporterId: string;
};

export function UserReports({
  reportRows,
  reporterMap,
}: {
  reportRows: Report[];
  reporterMap: Map<string, { id: string; name: string }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flag className="w-3.5 h-3.5 text-zinc-500" />
        <SectionHeading>
          Reports Against This User ({reportRows.length})
        </SectionHeading>
      </div>

      {reportRows.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-600 text-sm">
          No reports on record.
        </div>
      ) : (
        <div className="space-y-3">
          {reportRows.map((r) => {
            const reporter = reporterMap.get(r.reporterId);
            return (
              <div
                key={r.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${REPORT_STATUS_STYLE[r.status] ?? ""}`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                    <span className="text-xs font-semibold text-zinc-300">
                      {REPORT_REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">
                    {fmtDate(r.createdAt)}
                  </span>
                </div>

                {r.description && (
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {r.description}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 text-xs text-zinc-600">
                  <span>
                    Reported by{" "}
                    {reporter ? (
                      <Link
                        href={`/admin/users/${r.reporterId}`}
                        className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                      >
                        {reporter.name}
                      </Link>
                    ) : (
                      "Deleted User"
                    )}
                  </span>
                  {r.reviewedAt && (
                    <span>Reviewed {fmtDate(r.reviewedAt)}</span>
                  )}
                </div>

                {r.adminNote && (
                  <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                      Admin Note
                    </p>
                    <p className="text-xs text-zinc-300">{r.adminNote}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
