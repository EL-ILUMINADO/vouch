import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";

interface Prediction {
  className: "Neutral" | "Drawing" | "Hentai" | "Porn" | "Sexy";
  probability: number;
}
let model: Awaited<ReturnType<typeof nsfwjs.load>> | null = null;

export async function scanImage(
  file: File,
): Promise<{ isSafe: boolean; reason?: string }> {
  if (!model) {
    await tf.ready();
    model = await nsfwjs.load("MobileNetV2Mid");
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = async () => {
      if (!model)
        return resolve({ isSafe: false, reason: "Model unavailable" });

      const predictions = (await model.classify(img)) as Prediction[];
      URL.revokeObjectURL(objectUrl);

      const score = (cls: Prediction["className"]) =>
        predictions.find((p) => p.className === cls)?.probability ?? 0;

      const neutral = score("Neutral");
      const drawing = score("Drawing");
      const hentai = score("Hentai");
      const porn = score("Porn");
      const sexy = score("Sexy");

      console.log(`[NSFW Scan] "${file.name}":`, {
        Neutral: `${(neutral * 100).toFixed(1)}%`,
        Drawing: `${(drawing * 100).toFixed(1)}%`,
        Hentai: `${(hentai * 100).toFixed(1)}%`,
        Porn: `${(porn * 100).toFixed(1)}%`,
        Sexy: `${(sexy * 100).toFixed(1)}%`,
      });

      // Reject artwork/illustrations — real student photos should score low on
      // Drawing. Anything ≥ 40% is almost certainly anime, manga, or cartoon art.
      if (drawing >= 0.4)
        return resolve({
          isSafe: false,
          reason: `Not a real photo — appears to be artwork or illustration (${(drawing * 100).toFixed(0)}% confidence)`,
        });

      // Hard explicit checks — 20% threshold gives the model enough room to
      // stop flagging beach/gym photos while still catching genuine violations.
      if (porn >= 0.2)
        return resolve({
          isSafe: false,
          reason: `Explicit content detected (${(porn * 100).toFixed(0)}% confidence)`,
        });
      if (hentai >= 0.2)
        return resolve({
          isSafe: false,
          reason: `Explicit illustrated content detected (${(hentai * 100).toFixed(0)}% confidence)`,
        });

      // Combined explicit signal — catches cases where both scores are elevated
      // but individually just under the per-category threshold.
      const combinedExplicit = porn + hentai;
      if (combinedExplicit >= 0.35)
        return resolve({
          isSafe: false,
          reason: `Explicit content detected (combined score: ${(combinedExplicit * 100).toFixed(0)}%)`,
        });

      // 55% threshold means only clearly suggestive content is blocked —
      // gym selfies, party shots, and beach photos pass comfortably.
      if (sexy >= 0.55)
        return resolve({
          isSafe: false,
          reason: `Suggestive content detected (${(sexy * 100).toFixed(0)}% confidence)`,
        });

      resolve({ isSafe: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.warn(`[NSFW Scan] Failed to load image: "${file.name}"`);
      resolve({ isSafe: false, reason: "Image could not be loaded" });
    };

    img.src = objectUrl;
  });
}
