export interface UniversityConfig {
  id: string;
  name: string;
  domain: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  /** How far from the campus center a user can be and still get GPS-verified */
  radiusKm: number;
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
    // Ugbowo main campus centre
    coordinates: { lat: 6.3583, lng: 5.621 },
    radiusKm: 3.5,
  },
  {
    id: "unilag",
    name: "University of Lagos",
    domain: "unilag.edu.ng",
    coordinates: { lat: 6.5157, lng: 3.3897 },
    radiusKm: 3.5,
  },
];
