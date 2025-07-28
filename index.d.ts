import * as L from "leaflet";

/**
 * Calculate the present UTC Julian Date
 * @param date - Date in milliseconds since Unix epoch
 * @returns Julian day number
 */
export declare function julian(date: number): number;

/**
 * Calculate Greenwich Mean Sidereal Time
 * @param julianDay - Julian day number
 * @returns GMST in hours (0-24)
 */
export declare function GMST(julianDay: number): number;

/**
 * Options for configuring the Terminator overlay
 */
export interface TerminatorOptions extends L.PolylineOptions {
  /**
   * Resolution for calculating terminator points (points per degree)
   * Higher values create smoother curves but use more computation
   * @default 2
   */
  resolution?: number;

  /**
   * Longitude range in degrees for terminator calculation
   * @default 720
   */
  longitudeRange?: number;

  /**
   * Time for which to calculate the terminator position
   * If not provided, uses current time
   */
  time?: Date | string | number;
}

/**
 * Sun's position in ecliptic coordinates
 */
export interface SunEclipticPosition {
  /** Ecliptic longitude in degrees */
  lambda: number;
  /** Distance from Sun in AU */
  R: number;
}

/**
 * Sun's position in equatorial coordinates
 */
export interface SunEquatorialPosition {
  /** Right ascension in degrees */
  alpha: number;
  /** Declination in degrees */
  delta: number;
}

/**
 * Leaflet overlay that displays the day/night terminator on a map
 *
 * @example
 * ```typescript
 * import L from 'leaflet';
 * import terminator from 'terminator';
 *
 * const map = L.map('map').setView([0, 0], 2);
 * const terminatorLayer = terminator({
 *   color: '#ff0000',
 *   fillOpacity: 0.3,
 *   time: new Date()
 * });
 * terminatorLayer.addTo(map);
 * ```
 */
export declare class Terminator extends L.Polygon {
  /** Library version */
  readonly version: string;

  /** Radians to degrees conversion factor */
  private readonly _R2D: number;

  /** Degrees to radians conversion factor */
  private readonly _D2R: number;

  /** Configuration options */
  options: TerminatorOptions;

  /**
   * Create a new Terminator instance
   * @param options - Configuration options
   */
  constructor(options?: TerminatorOptions);

  /**
   * Initialize the terminator with given options
   * @param options - Configuration options
   */
  initialize(options?: TerminatorOptions): void;

  /**
   * Update the terminator position for a specific time
   * @param date - Date/time for which to calculate terminator position
   */
  setTime(date: Date | string | number): void;

  /**
   * Calculate the Sun's position in ecliptic coordinates
   * @param julianDay - Julian day number
   * @returns Sun's ecliptic position
   * @private
   */
  private _sunEclipticPosition(julianDay: number): SunEclipticPosition;

  /**
   * Calculate the obliquity of the ecliptic (Earth's axial tilt)
   * @param julianDay - Julian day number
   * @returns Obliquity in degrees
   * @private
   */
  private _eclipticObliquity(julianDay: number): number;

  /**
   * Convert Sun's ecliptic position to equatorial coordinates
   * @param sunEclLng - Sun's ecliptic longitude in degrees
   * @param eclObliq - Ecliptic obliquity in degrees
   * @returns Sun's equatorial position
   * @private
   */
  private _sunEquatorialPosition(
    sunEclLng: number,
    eclObliq: number
  ): SunEquatorialPosition;

  /**
   * Calculate the hour angle of the Sun for a given longitude
   * @param lng - Longitude in degrees
   * @param sunPos - Sun's equatorial position
   * @param gst - Greenwich Sidereal Time in hours
   * @returns Hour angle in degrees
   * @private
   */
  private _hourAngle(
    lng: number,
    sunPos: SunEquatorialPosition,
    gst: number
  ): number;

  /**
   * Calculate latitude of terminator for given hour angle and sun position
   * @param ha - Hour angle in degrees
   * @param sunPos - Sun's equatorial position
   * @returns Latitude in degrees
   * @private
   */
  private _latitude(ha: number, sunPos: SunEquatorialPosition): number;

  /**
   * Compute the terminator coordinates for the given time
   * @param time - Time for calculation (optional)
   * @returns Array of [latitude, longitude] coordinate pairs
   * @private
   */
  private _compute(time?: Date | string | number): L.LatLngExpression[];
}

/**
 * Factory function to create a new Terminator instance
 * @param options - Configuration options
 * @returns New Terminator instance
 *
 * @example
 * ```typescript
 * import terminator from 'terminator';
 *
 * const nightOverlay = terminator({
 *   fillColor: '#000066',
 *   fillOpacity: 0.4,
 *   resolution: 4
 * });
 * ```
 */
declare function terminator(options?: TerminatorOptions): Terminator;

export default terminator;
