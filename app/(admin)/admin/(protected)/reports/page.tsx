import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { dismissReport, markReportReviewed, banReportedUser } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-900/50 text-amber-400 border-amber-800",
  reviewed: "bg-blue-900/50 text-blue-400 border-blue-800",
  dismissed: "bg-zinc-800 text-zinc-500 border-zinc-700",
  action_taken: "bg-red-900/50 text-red-400 border-red-800",
};

const REASON_LABEL: Record<string, string> = {
  harassment: "Harassment",
  fake_profile: "Fake Profile",
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  other: "Other",
};

async function getAllReports() {
  const allReports = await db
    .select({
      id: reports.id,
      reason: reports.reason,
      description: reports.description,
      status: reports.status,
      createdAt: reports.createdAt,
      reviewedAt: reports.reviewedAt,
      reporterId: reports.reporterId,
      reportedUserId: reports.reportedUserId,
      messageSnapshot: reports.messageSnapshot,
    })
    .from(reports)
    .orderBy(desc(reports.createdAt));

  if (allReports.length === 0) return [];

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      warningCount: users.warningCount,
      isBanned: users.isBanned,
    })
    .from(users);

  const userMap = new Map(userRows.map((u) => [u.id, u]));

  return allReports.map((r) => ({
    ...r,
    reporter: userMap.get(r.reporterId),
    reportedUser: userMap.get(r.reportedUserId),
  }));
}

export default async function ReportsPage() {
  const allReports = await getAllReports();
  const pending = allReports.filter((r) => r.status === "pending");
  const rest = allReports.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Reports</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {pending.length} pending · {allReports.length} total
        </p>
      </div>

      {allReports.length === 0 ? (
        <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-12 text-center">
          <p className="text-zinc-400 font-medium">No reports filed yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...pending, ...rest].map((report) => (
            <div
              key={report.id}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold">
                      {REASON_LABEL[report.reason] ?? report.reason}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[report.status] ?? ""}`}
                    >
                      {report.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>
                      <span className="text-zinc-400">Reporter:</span>{" "}
                      {report.reporter?.name ?? "Unknown"}{" "}
                      <span className="text-zinc-600">
                        ({report.reporter?.email})
                      </span>
                    </p>
                    <p className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-400">Reported:</span>{" "}
                      {report.reportedUser?.name ?? "Unknown"}{" "}
                      <span className="text-zinc-600">
                        ({report.reportedUser?.email})
                      </span>
                      {report.reportedUser?.isBanned ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-red-900/50 text-red-400 border-red-800">
                          BANNED
                        </span>
                      ) : (report.reportedUser?.warningCount ?? 0) > 0 ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            (report.reportedUser?.warningCount ?? 0) >= 2
                              ? "bg-red-900/50 text-red-400 border-red-800"
                              : "bg-amber-900/50 text-amber-400 border-amber-800"
                          }`}
                        >
                          ⚠️ {report.reportedUser?.warningCount}/3 warnings
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {report.description && (
                    <p className="text-sm text-zinc-300 bg-zinc-900/50 rounded-lg p-3 mt-1">
                      {report.description}
                    </p>
                  )}
                </div>
                <p className="text-zinc-600 text-xs shrink-0">
                  {new Date(report.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Message Snapshot */}
              {report.messageSnapshot && report.messageSnapshot.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Conversation Snapshot ({report.messageSnapshot.length}{" "}
                    messages)
                  </p>
                  <div className="bg-zinc-900/70 border border-zinc-700/40 rounded-xl p-3 space-y-2 max-h-72 overflow-y-auto">
                    {report.messageSnapshot.map((msg, i) => {
                      const isReporter = msg.senderId === report.reporterId;
                      return (
                        <div
                          key={i}
                          className={`flex gap-2 ${isReporter ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`max-w-[75%] space-y-0.5 ${isReporter ? "items-end" : "items-start"} flex flex-col`}
                          >
                            <span className="text-[10px] text-zinc-500 font-medium px-1">
                              {msg.senderName}
                              {isReporter && (
                                <span className="text-zinc-600">
                                  {" "}
                                  (reporter)
                                </span>
                              )}
                            </span>
                            <div
                              className={`px-3 py-1.5 rounded-xl text-sm ${
                                isReporter
                                  ? "bg-zinc-700 text-zinc-100 rounded-tr-none"
                                  : "bg-zinc-800 text-zinc-200 rounded-tl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[9px] text-zinc-600 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              {report.status === "pending" && (
                <div className="flex gap-2 flex-wrap pt-1">
                  <form
                    action={markReportReviewed.bind(
                      null,
                      report.id,
                      report.reportedUserId,
                    )}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-blue-700 hover:bg-blue-600 text-white font-bold"
                    >
                      Mark Reviewed
                    </Button>
                  </form>
                  <form action={dismissReport.bind(null, report.id)}>
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="border-zinc-600 text-zinc-400 hover:bg-zinc-700 hover:text-white font-bold"
                    >
                      Dismiss
                    </Button>
                  </form>
                  {report.reportedUserId && (
                    <form
                      action={banReportedUser.bind(
                        null,
                        report.id,
                        report.reportedUserId,
                      )}
                    >
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-red-700 hover:bg-red-600 text-white font-bold"
                      >
                        Ban User
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
