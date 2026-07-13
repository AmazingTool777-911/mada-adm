export const CURRENT_LOCATION_TRACKING_PROFILE_DESCRIPTION =
  `Snapshot locks your current coordinates permanently. Tracking profiles update your position and look up Fokontany boundaries dynamically as you move.`;

export const CURRENT_LOCATION_TRACKING_HIGH_ACCURACY_GPS_DESCRIPTION =
  `Forces your device to look for precise hardware GPS coordinates instead of network triangulation. This provides the tightest boundary matching but will consume significantly more battery power.`;

export enum CurrentLocationTrackingProfile {
  Snapshot = "snapshot",
  Walking = "walking",
  Driving = "driving",
  Precision = "precision",
}

export const CURRENT_LOCATION_TRACKING_DURATION_BY_PROFILE = new Map<
  CurrentLocationTrackingProfile,
  number
>([
  [CurrentLocationTrackingProfile.Walking, 30_000],
  [CurrentLocationTrackingProfile.Driving, 10_000],
  [CurrentLocationTrackingProfile.Precision, 4_000],
]);

function convertCurrentLocationTrackingProfileToSeconds(
  profile: CurrentLocationTrackingProfile,
): number {
  return Number(
    (CURRENT_LOCATION_TRACKING_DURATION_BY_PROFILE.get(profile)! / 1000)
      .toFixed(1),
  );
}

export const TRACKING_PROFILE_FREQUENCY_OPTIONS: {
  label: string;
  value: CurrentLocationTrackingProfile;
}[] = [
  {
    label: "📍 Snapshot (Static)",
    value: CurrentLocationTrackingProfile.Snapshot,
  },
  {
    label: `🚶 Walking Profile (Updates every ${
      convertCurrentLocationTrackingProfileToSeconds(
        CurrentLocationTrackingProfile.Walking,
      )
    }s)`,
    value: CurrentLocationTrackingProfile.Walking,
  },
  {
    label: `🚗 Driving Profile (Updates every ${
      convertCurrentLocationTrackingProfileToSeconds(
        CurrentLocationTrackingProfile.Driving,
      )
    }s)`,
    value: CurrentLocationTrackingProfile.Driving,
  },
  {
    label: `⚡ Precision Profile (Updates every ${
      convertCurrentLocationTrackingProfileToSeconds(
        CurrentLocationTrackingProfile.Precision,
      )
    }s)`,
    value: CurrentLocationTrackingProfile.Precision,
  },
];

export enum GeographicCoordinateOutputFormat {
  DecimalDegrees = "DD",
  DegreesDecimalMinutes = "DDM",
  DegreesMinutesSeconds = "DMS",
  MilitaryGridReferenceSystem = "MGRS",
  UniversalTransverseMercator = "UTM",
}

export const GEOGRAPHIC_COORDINATE_OUTPUT_FORMAT_OPTIONS: {
  label: string;
  value: GeographicCoordinateOutputFormat;
}[] = [
  {
    label: "Decimal Degrees (DD)",
    value: GeographicCoordinateOutputFormat.DecimalDegrees,
  },
  {
    label: "Degrees Decimal Minutes (DDM)",
    value: GeographicCoordinateOutputFormat.DegreesDecimalMinutes,
  },
  {
    label: "Degrees Minutes Seconds (DMS)",
    value: GeographicCoordinateOutputFormat.DegreesMinutesSeconds,
  },
  {
    label: "Military Grid Reference System (MGRS)",
    value: GeographicCoordinateOutputFormat.MilitaryGridReferenceSystem,
  },
  {
    label: "Universal Transverse Mercator (UTM)",
    value: GeographicCoordinateOutputFormat.UniversalTransverseMercator,
  },
];

export const UNSUPPORTED_GEOLOCATION_ERROR_MESSAGE =
  "Geolocation is not supported by this browser.";
