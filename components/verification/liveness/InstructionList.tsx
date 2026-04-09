"use client";

interface InstructionListProps {
  instructions: string[];
}

/**
 * Displays the 3 randomly-picked liveness instructions the user must perform
 * while the camera is recording.
 *
 * Each item has a numbered badge that matches the codebase's existing badge
 * style (small zinc circle). The list is intentionally static — it does not
 * check off instructions as the user performs them. Liveness verification is
 * purely visual and happens server-side during the security review.
 */
export function InstructionList({ instructions }: InstructionListProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
        Perform these actions on camera
      </p>
      <ol className="space-y-2">
        {instructions.map((inst, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-sm text-zinc-200">{inst}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
