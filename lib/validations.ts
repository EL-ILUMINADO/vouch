// \b around short abbreviations so "sc" doesn't block "science",
// "ig" doesn't block "significant", "insta" doesn't block "instantly", etc.
const SOCIAL_REGEX =
  /\b(ig|snap|sc|insta)\b|whatsapp|t\.me|wa\.me|twitter|onlyfans|link in bio|@|\.com|\.ng/i;

// \b stops "one" inside "someone"/"bone" from firing; \s* catches "zerozero" jammed together.
const SPELLED_NUMBERS_REGEX =
  /\b(zero|one|two|three|four|five|six|seven|eight|nine)\s*(zero|one|two|three|four|five|six|seven|eight|nine)\b/i;

export function validateBio(text: string): { valid: boolean; error?: string } {
  if (/\d/.test(text))
    return {
      valid: false,
      error: "No numbers allowed — spell nothing out either.",
    };

  if (SOCIAL_REGEX.test(text))
    return {
      valid: false,
      error:
        "No social handles or links — let your personality do the talking.",
    };

  if (SPELLED_NUMBERS_REGEX.test(text))
    return {
      valid: false,
      error: "Spelling out numbers isn't allowed — we see you 👀.",
    };

  const emojis = text.match(/\p{Emoji_Presentation}/gu);
  if (emojis && emojis.length > 1)
    return { valid: false, error: "One emoji max — less is more." };

  return { valid: true };
}

export function validateBioPrompt(text: string): {
  valid: boolean;
  error?: string;
} {
  if (/\d/.test(text))
    return { valid: false, error: "No numbers allowed in prompts." };

  if (SOCIAL_REGEX.test(text))
    return {
      valid: false,
      error: "No social handles or links allowed.",
    };

  if (SPELLED_NUMBERS_REGEX.test(text))
    return {
      valid: false,
      error: "Spelling out numbers isn't allowed — we see you 👀.",
    };

  const emojis = text.match(/\p{Emoji_Presentation}/gu);
  if (emojis && emojis.length > 1)
    return { valid: false, error: "One emoji max — keep it clean." };

  if (text.length > 80)
    return { valid: false, error: "Keep your answer under 80 characters." };

  return { valid: true };
}
