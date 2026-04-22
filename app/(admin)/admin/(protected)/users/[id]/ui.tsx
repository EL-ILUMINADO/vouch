export function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4 space-y-2">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ?? "bg-zinc-700/60"}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
          {label}
        </p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
      {children}
    </h2>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-xs font-semibold text-zinc-500 shrink-0 w-36">
        {label}
      </span>
      <span className="text-sm text-zinc-200 text-right min-w-0 wrap-break-word">
        {value ?? <span className="text-zinc-600 italic">—</span>}
      </span>
    </div>
  );
}
