export interface CampusZone {
  /** Human-readable label shown in error messages */
  label: string;
  coordinates: { lat: number; lng: number };
  /**
   * Verification radius for this zone in km (before GPS accuracy tolerance is
   * added). Keep this tight — the server adds the device's reported accuracy
   * on top of this value at runtime.
   */
  radiusKm: number;
}

export interface UniversityConfig {
  id: string;
  name: string;
  domain: string;
  /**
   * Primary campus coordinates. Used as fallback when `zones` is absent.
   * When `zones` is provided this field is ignored by checkUniversityProximity.
   */
  coordinates: { lat: number; lng: number };
  /** Fallback radius — only used when `zones` is absent */
  radiusKm: number;
  /**
   * Discrete campus zones. Define one entry per physical site (main campus,
   * medical school, satellite hostels, etc.). A user passes verification if
   * they are within ANY zone.
   *
   * HOW TO SET radiusKm PER ZONE:
   *   Stand at the furthest legitimate point on that site, record the GPS
   *   coordinate, measure the distance to the zone centre — that is your
   *   radiusKm. Add ~0.2 km of margin for GPS noise on clear-sky days.
   *   The server adds the device's reported accuracy on top automatically.
   */
  zones?: CampusZone[];
}

/** The inner exclusion ring — signals inside this radius are not shown on radar */
export const RADAR_MIN_KM = 0.5;

/** Radar max range — only users within this distance of YOU appear */
export const RADAR_MAX_KM = 1.5;

/** Hard cap on the number of signals returned per radar sweep */
export const RADAR_MAX_SIGNALS = 25;

export const SUPPORTED_UNIVERSITIES: UniversityConfig[] = [
  {
    id: "uniben",
    name: "University of Benin",
    domain: "uniben.edu",
    // Fallback (used only if zones array is empty)
    coordinates: { lat: 6.3749, lng: 5.6218 },
    radiusKm: 3.0,
    zones: [
      {
        // Main Ugbowo campus — geographic centre of the built-up academic area.
        // TODO: verify by standing at the geographic centre with a clear-sky GPS
        // fix and recording the coordinate. Adjust radiusKm to reach all gates.
        label: "Main Campus (Ugbowo)",
        coordinates: { lat: 6.3749, lng: 5.6218 },
        radiusKm: 2.8,
      },
      {
        // College of Medicine / Teaching Hospital cluster near Uselu.
        // TODO: confirm coordinate on-site.
        label: "College of Medicine",
        coordinates: { lat: 6.385, lng: 5.6345 },
        radiusKm: 1.2,
      },
    ],
  },
  {
    id: "unilag",
    name: "University of Lagos",
    domain: "unilag.edu.ng",
    // Akoka main campus centre
    coordinates: { lat: 6.5157, lng: 3.3897 },
    radiusKm: 2.0,
    zones: [
      {
        label: "Main Campus (Akoka)",
        coordinates: { lat: 6.5157, lng: 3.3897 },
        radiusKm: 2.0,
      },
      {
        // College of Medicine, Idi-Araba
        label: "College of Medicine (Idi-Araba)",
        coordinates: { lat: 6.5069, lng: 3.3583 },
        radiusKm: 0.8,
      },
    ],
  },
];
