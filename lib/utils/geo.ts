import type { UniversityConfig } from "@/lib/constants/universities";

/**
 * Calculates the great-circle distance between two coordinates using the
 * Haversine formula. Returns kilometres.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface UniversityProximityResult {
  within: boolean;
  /** Raw GPS distance to the closest campus zone, in km */
  distanceKm: number;
  /** The campus zone label that was closest */
  closestZoneLabel: string;
  /** The radius used for the pass/fail check (zone radius + GPS accuracy tolerance) */
  effectiveRadiusKm: number;
  /** The GPS accuracy the server factored in, in metres */
  accuracyUsedM: number;
}

/**
 * Determines whether a GPS coordinate is within the boundaries of a university.
 *
 * Multi-zone aware: checks every zone defined on the university and passes if
 * the user is within ANY zone. This handles campuses with multiple sites
 * (main campus, medical school, satellite hostels, etc.).
 *
 * Accuracy-aware: the GPS accuracy reported by the device (accuracyM) is
 * added to the zone radius before comparison, so a user standing just inside
 * the gate is not falsely rejected because their phone's GPS fix drifted 300m.
 * Accuracy is clamped to 1 500 m to avoid completely defeating the check.
 */
export function checkUniversityProximity(
  lat: number,
  lng: number,
  accuracyM: number,
  uniConfig: UniversityConfig,
): UniversityProximityResult {
  // Clamp to a sensible ceiling — accepting >1.5 km of GPS drift defeats the check
  const clampedAccuracyKm = Math.min(accuracyM, 1500) / 1000;

  // Build a flat list of zones to check. If none defined, fall back to the
  // top-level coordinates so old configs continue to work unchanged.
  const zones =
    uniConfig.zones && uniConfig.zones.length > 0
      ? uniConfig.zones
      : [
          {
            label: uniConfig.name,
            coordinates: uniConfig.coordinates,
            radiusKm: uniConfig.radiusKm,
          },
        ];

  let best: UniversityProximityResult | null = null;

  for (const zone of zones) {
    const distKm = calculateDistance(
      lat,
      lng,
      zone.coordinates.lat,
      zone.coordinates.lng,
    );
    const effectiveRadius = zone.radiusKm + clampedAccuracyKm;
    const within = distKm <= effectiveRadius;

    // Track the closest zone across all iterations
    if (!best || distKm < best.distanceKm) {
      best = {
        within,
        distanceKm: distKm,
        closestZoneLabel: zone.label,
        effectiveRadiusKm: effectiveRadius,
        accuracyUsedM: Math.min(accuracyM, 1500),
      };
    }
  }

  return best!;
}
