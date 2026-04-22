import { SectionHeading } from "./ui";

type ProfileUser = {
  bio_headline: string | null;
  interests: string[] | null;
  intent: string | null;
  social_energy: string | null;
  energy_vibe: string | null;
  relationship_style: string | null;
  conflict_style: string | null;
  lifestyle_snapshot: string | null;
  deal_breakers: string | null;
  relationship_vision: string | null;
  prompt_question: string | null;
  prompt_answer: string | null;
  onboarding_answers: unknown;
};

export function UserProfileContent({ user }: { user: ProfileUser }) {
  const answers =
    (user.onboarding_answers as Record<string, string | null>) ?? {};

  const isEmpty =
    !user.bio_headline &&
    (user.interests ?? []).length === 0 &&
    !user.intent &&
    !user.prompt_question &&
    !answers.passion_signal;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
      <SectionHeading>Profile Content</SectionHeading>

      {isEmpty && (
        <p className="text-sm text-zinc-600 italic">
          This user has not filled in any profile content yet.
        </p>
      )}

      {user.bio_headline && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Bio
          </p>
          <p className="text-sm text-zinc-200 italic leading-relaxed border-l-2 border-zinc-600 pl-3">
            &ldquo;{user.bio_headline}&rdquo;
          </p>
        </div>
      )}

      {(user.interests ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Interests ({user.interests!.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {user.interests!.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {(user.intent ||
        user.social_energy ||
        user.energy_vibe ||
        user.relationship_style ||
        user.conflict_style) && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Vibe
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {(
              [
                ["Intent", user.intent],
                ["Social energy", user.social_energy],
                ["Energy vibe", user.energy_vibe],
                ["Relationship style", user.relationship_style],
                ["Conflict style", user.conflict_style],
              ] as [string, string | null][]
            )
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-[10px] text-zinc-600 w-28 shrink-0 mt-0.5">
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">
                    {value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {(user.lifestyle_snapshot ||
        user.deal_breakers ||
        user.relationship_vision) && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Story
          </p>
          {(
            [
              ["Lifestyle snapshot", user.lifestyle_snapshot],
              ["Deal-breakers", user.deal_breakers],
              ["Relationship vision", user.relationship_vision],
            ] as [string, string | null][]
          )
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label} className="space-y-0.5">
                <p className="text-[10px] text-zinc-600 font-semibold">
                  {label}
                </p>
                <p className="text-sm text-zinc-300">{value}</p>
              </div>
            ))}
        </div>
      )}

      {user.prompt_question && (
        <div className="bg-zinc-800/50 rounded-xl p-4 space-y-1.5">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
            {user.prompt_question}
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {user.prompt_answer || (
              <span className="italic text-zinc-600">No answer yet.</span>
            )}
          </p>
        </div>
      )}

      {(
        [
          ["I could talk for hours about…", answers.passion_signal],
          ["People tend to misread me as…", answers.misunderstood_trait],
          ["What I'm actively working on…", answers.growth_focus],
          ["My typical weekend…", answers.weekend_activity],
          ["What genuinely makes me happy…", answers.happiness_trigger],
        ] as [string, string | null][]
      )
        .filter(([, v]) => v)
        .map(([label, value]) => (
          <div key={label} className="space-y-0.5">
            <p className="text-[10px] text-zinc-600 font-semibold">{label}</p>
            <p className="text-sm text-zinc-300">{value}</p>
          </div>
        ))}
    </div>
  );
}
