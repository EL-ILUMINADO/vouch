import { useState, useCallback } from "react";
import * as nsfwjs from "nsfwjs";

export const usePhotoScanner = () => {
  const [isModelLoading, setIsModelLoading] = useState(true);

  const scanImage = useCallback(async (imageElement: HTMLImageElement) => {
    // Load the model (We use the 'lite' version for speed)
    const model = await nsfwjs.load("MobileNetV2");
    setIsModelLoading(false);

    // The actual scan
    const predictions = await model.classify(imageElement);

    // We look for 'Neutral' vs 'Sexy/Porn/Hentai'
    const nsfwScores = predictions.filter((p) =>
      ["Porn", "Hentai", "Sexy"].includes(p.className),
    );

    const isExplicit = nsfwScores.some((p) => p.probability > 0.1); // 10% threshold
    return { isExplicit, predictions };
  }, []);

  return { scanImage, isModelLoading };
};
