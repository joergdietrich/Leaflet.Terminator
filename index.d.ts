import * as L from "leaflet";

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

  /**
   * Sun altitude in degrees below which the map is shaded, e.g. 0 for
   * the geometric terminator, -6/-12/-18 for civil/nautical/astronomical
   * twilight, +6 for golden hour
   * @default -0.833 (sunrise/sunset, including refraction)
   */
  sunAltitude?: number;
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
 * import {LeafletMap} from 'leaflet';
 * import {Terminator} from '@joergdietrich/leaflet.terminator';
 *
 * const map = new LeafletMap('map').setView([0, 0], 2);
 * const terminatorLayer = new Terminator({
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
  options: L.Polygon["options"] & TerminatorOptions;

  /**
   * Create a new Terminator instance
   * @param options - Configuration options
   */
  constructor(options?: TerminatorOptions);

  /**
   * Update the terminator position for a specific time
   * @param date - Date/time for which to calculate terminator position; the current time if omitted
   */
  setTime(date?: Date | string | number): this;

  /**
   * Change the sun altitude below which the map is shaded
   * @param altitude - Sun altitude in degrees
   */
  setSunAltitude(altitude: number): this;

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
   * Trace a circle of given angular radius around a center point
   * @param center - [latitude, longitude] in degrees
   * @param radius - Angular radius in degrees
   * @returns Ring of [latitude, longitude] pairs with unwrapped longitudes
   * @private
   */
  private _shadowEdge(center: [number, number], radius: number): [number, number][];

  /**
   * Copy a closed ring at every 360° shift that overlaps [lo, hi]
   * @private
   */
  private _tile(ring: [number, number][], lo: number, hi: number): [number, number][][];

  /**
   * Turn a ring that circles a pole into an edge across [lo, hi], closed through the pole
   * @private
   */
  private _wrapToPole(
    ring: [number, number][],
    pole: number,
    lo: number,
    hi: number
  ): [number, number][];

  /**
   * Interpolate latitude at a longitude along points sorted by longitude
   * @private
   */
  private _latAt(points: [number, number][], lng: number): number;

  /**
   * Compute the shaded region for the given time
   * @param time - Time for calculation (optional)
   * @returns A ring, rings, or a ring with holes, depending on which poles are shaded
   * @private
   */
  private _compute(
    time?: Date | string | number
  ): L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][];
}

/**
 * Factory function to create a new Terminator instance
 * @param options - Configuration options
 * @returns New Terminator instance
 *
 * @example
 * ```typescript
 * import terminator from '@joergdietrich/leaflet.terminator';
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
