// lib/validations.ts

export function validateBioPrompt(text: string): {
  valid: boolean;
  error?: string;
} {
  // 1. Kill all digits (0-9)
  if (/\d/.test(text)) {
    return { valid: false, error: "Numbers are not allowed in prompts." };
  }

  // 2. Kill social media keywords and sneaky links
  const socialRegex =
    /(ig|snap|sc|insta|whatsapp|t\.me|wa\.me|twitter|onlyfans|link in bio|@|\.com|\.ng)/i;
  if (socialRegex.test(text)) {
    return {
      valid: false,
      error: "External handles and links are prohibited.",
    };
  }

  // 3. Kill spelled-out numbers (Spammers try: "zero eight one")
  const spelledNumbersRegex =
    /(zero|one|two|three|four|five|six|seven|eight|nine)\s*(zero|one|two|three|four|five|six|seven|eight|nine)/i;
  if (spelledNumbersRegex.test(text)) {
    return { valid: false, error: "Bypassing number filters is prohibited." };
  }

  // 4. Kill Emoji Spam (Max 1 emoji allowed to prevent emoji-phone-numbers)
  // This regex matches standard emojis.
  const emojis = text.match(/\p{Emoji_Presentation}/gu);
  if (emojis && emojis.length > 1) {
    return {
      valid: false,
      error: "Keep it clean. Maximum of 1 emoji allowed.",
    };
  }

  // 5. Length limits (Keep it punchy)
  if (text.length > 80) {
    return { valid: false, error: "Keep your answer under 80 characters." };
  }

  return { valid: true };
}
