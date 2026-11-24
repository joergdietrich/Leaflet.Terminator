import * as L from 'leaflet';

/* Terminator.js -- Overlay day/night region on a Leaflet map */

function julian(date) {
	/* Calculate the present UTC Julian Date. Function is valid after
	 * the beginning of the UNIX epoch 1970-01-01 and ignores leap
	 * seconds. */
	return (date / 86400000) + 2440587.5;
}

function GMST(julianDay) {
	/* Calculate Greenwich Mean Sidereal Time according to
		 http://aa.usno.navy.mil/faq/docs/GAST.php */
	var d = julianDay - 2451545.0;
	// Low precision equation is good enough for our purposes.
	return (18.697374558 + 24.06570982441908 * d) % 24;
}

export class Terminator extends L.Polygon {
	constructor(options) {
		super([], options);
		this.version = '2.1.0';
		this._R2D = 180 / Math.PI;
		this._D2R = Math.PI / 180;
		this.setLatLngs(this._compute(this.options.time));
	}

	setTime(date) {
		this.options.time = date;
		return this.setLatLngs(this._compute(date));
	}

	setSunAltitude(altitude) {
		this.options.sunAltitude = altitude;
		return this.setLatLngs(this._compute(this.options.time));
	}

	_sunEclipticPosition(julianDay) {
		/* Compute the position of the Sun in ecliptic coordinates at
			 julianDay.  Following
			 http://en.wikipedia.org/wiki/Position_of_the_Sun */
		// Days since start of J2000.0
		var n = julianDay - 2451545.0;
		// mean longitude of the Sun
		var L = 280.460 + 0.9856474 * n;
		L %= 360;
		// mean anomaly of the Sun
		var g = 357.528 + 0.9856003 * n;
		g %= 360;
		// ecliptic longitude of Sun
		var lambda = L + 1.915 * Math.sin(g * this._D2R) +
			0.02 * Math.sin(2 * g * this._D2R);
		// distance from Sun in AU
		var R = 1.00014 - 0.01671 * Math.cos(g * this._D2R) -
			0.0014 * Math.cos(2 * g * this._D2R);
		return {lambda: lambda, R: R};
	}

	_eclipticObliquity(julianDay) {
		// Following the short term expression in
		// http://en.wikipedia.org/wiki/Axial_tilt#Obliquity_of_the_ecliptic_.28Earth.27s_axial_tilt.29
		var n = julianDay - 2451545.0;
		// Julian centuries since J2000.0
		var T = n / 36525;
		var epsilon = 23.43929111 -
			T * (46.836769 / 3600
				- T * (0.0001831 / 3600
					+ T * (0.00200340 / 3600
						- T * (0.576e-6 / 3600
							- T * 4.34e-8 / 3600))));
		return epsilon;
	}

	_sunEquatorialPosition(sunEclLng, eclObliq) {
		/* Compute the Sun's equatorial position from its ecliptic
		 * position. Inputs are expected in degrees. Outputs are in
		 * degrees as well. */
		var alpha = Math.atan(Math.cos(eclObliq * this._D2R)
			* Math.tan(sunEclLng * this._D2R)) * this._R2D;
		var delta = Math.asin(Math.sin(eclObliq * this._D2R)
			* Math.sin(sunEclLng * this._D2R)) * this._R2D;

		var lQuadrant = Math.floor(sunEclLng / 90) * 90;
		var raQuadrant = Math.floor(alpha / 90) * 90;
		alpha = alpha + (lQuadrant - raQuadrant);

		return {alpha: alpha, delta: delta};
	}

	_shadowEdge(center, radius) {
		/* Trace the circle of angular radius `radius` around `center`
		 * ([lat, lng], degrees). Longitudes are unwrapped, so they
		 * change continuously along the ring. */
		var lat0 = center[0] * this._D2R;
		var rho = radius * this._D2R;
		var n = Math.round(360 * this.options.resolution);
		var ring = [];
		for (var i = 0; i < n; i++) {
			var theta = 2 * Math.PI * i / n;
			var lat = Math.asin(Math.sin(lat0) * Math.cos(rho) +
				Math.cos(lat0) * Math.sin(rho) * Math.cos(theta));
			var dLng = Math.atan2(Math.sin(theta) * Math.sin(rho) * Math.cos(lat0),
				Math.cos(rho) - Math.sin(lat0) * Math.sin(lat)) * this._R2D;
			var lng = center[1] + dLng;
			if (i > 0) {
				lng += Math.round((ring[i - 1][1] - lng) / 360) * 360;
			}
			ring.push([lat * this._R2D, lng]);
		}
		return ring;
	}

	_compute(time) {
		var today = time ? new Date(time) : new Date();
		var julianDay = julian(today);
		var gst = GMST(julianDay);

		var sunEclPos = this._sunEclipticPosition(julianDay);
		var eclObliq = this._eclipticObliquity(julianDay);
		var sunEqPos = this._sunEquatorialPosition(sunEclPos.lambda, eclObliq);

		// Shade is the cap where the Sun is below sunAltitude: radius
		// 90° + sunAltitude around the antisolar point

		var h = this.options.sunAltitude;
		var delta = sunEqPos.delta;
		var antisolarLng = ((sunEqPos.alpha - 15 * gst + 180) % 360 + 540) % 360 - 180;
		var ring = this._shadowEdge([-delta, antisolarLng], 90 + h);

		var lo = -this.options.longitudeRange / 2;
		var hi = this.options.longitudeRange / 2;
		var hasNorth = delta < h;
		var hasSouth = delta > -h;

		if (hasNorth !== hasSouth) {
			return this._wrapToPole(ring, hasNorth ? 90 : -90, lo, hi);
		}

		var rings = this._tile(ring, lo, hi);
		if (!hasNorth) {
			return rings.map(function (r) { return [r]; });
		}

		// Both poles are shaded: the sunlit island is a hole in a
		// rectangle wide enough to contain every copy of it

		var lngs = [].concat.apply([], rings).map(function (p) { return p[1]; });
		var west = Math.min(lo, Math.min.apply(null, lngs));
		var east = Math.max(hi, Math.max.apply(null, lngs));
		return [[[-90, west], [90, west], [90, east], [-90, east]]].concat(rings);
	}

	_tile(ring, lo, hi) {
		/* Copy a closed ring at every 360° shift that overlaps [lo, hi]. */
		var lngs = ring.map(function (p) { return p[1]; });
		var min = Math.min.apply(null, lngs);
		var max = Math.max.apply(null, lngs);
		var rings = [];
		for (var k = Math.ceil((lo - max) / 360); k <= Math.floor((hi - min) / 360); k++) {
			rings.push(ring.map(function (p) { return [p[0], p[1] + 360 * k]; }));
		}
		return rings;
	}

	_wrapToPole(ring, pole, lo, hi) {
		/* Turn a ring that circles a pole into one edge spanning
		 * [lo, hi], closed through that pole. */
		var edge = ring.slice().sort(function (a, b) { return a[1] - b[1]; });
		var first = edge[0][1];
		var points = [];
		for (var k = Math.floor((lo - first) / 360) - 1; first + 360 * k <= hi + 360; k++) {
			edge.forEach(function (p) { points.push([p[0], p[1] + 360 * k]); });
		}

		var latLng = [[pole, lo], [this._latAt(points, lo), lo]];
		points.forEach(function (p) {
			if (p[1] > lo && p[1] < hi) { latLng.push(p); }
		});
		latLng.push([this._latAt(points, hi), hi], [pole, hi]);
		return latLng;
	}

	_latAt(points, lng) {
		/* Interpolate latitude at lng along points sorted by longitude. */
		var i = points.findIndex(function (p) { return p[1] >= lng; });
		var a = points[i - 1], b = points[i];
		return a[0] + (b[0] - a[0]) * (lng - a[1]) / (b[1] - a[1]);
	}
}

// 1.x keeps defaults on the prototype; without its own copy, mergeOptions would change every L.Polygon
if (L.version.startsWith('1.')) {
	Terminator.prototype.options = Object.create(L.Polygon.prototype.options);
}

Terminator.mergeOptions({
	interactive: false, // Disable "clickable" mouse pointer
	stroke: false, // Shade only; color and opacity apply if stroke is enabled
	color: '#000',
	opacity: 0.5,
	fillColor: '#000',
	fillOpacity: 0.5,
	smoothFactor: 1, // Leaflet 2 lowered the default to 0.5
	resolution: 2,
	longitudeRange: 720,
	sunAltitude: -0.833 // Sunrise/sunset: refraction plus the Sun's upper limb
});

export default function terminator(options) {
	return new Terminator(options);
}
