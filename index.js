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
		this.version = '2.0.0';
		this._R2D = 180 / Math.PI;
		this._D2R = Math.PI / 180;
		this.setLatLngs(this._compute(this.options.time));
	}

	setTime(date) {
		this.options.time = date;
		return this.setLatLngs(this._compute(date));
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

	_hourAngle(lng, sunPos, gst) {
		/* Compute the hour angle of the sun for a longitude on
		 * Earth. Return the hour angle in degrees. */
		var lst = gst + lng / 15;
		return lst * 15 - sunPos.alpha;
	}

	_latitude(ha, sunPos) {
		/* For a given hour angle and sun position, compute the
		 * latitude of the terminator in degrees. */
		var lat = Math.atan(-Math.cos(ha * this._D2R) /
			Math.tan(sunPos.delta * this._D2R)) * this._R2D;
		return lat;
	}

	_compute(time) {
		var today = time ? new Date(time) : new Date();
		var julianDay = julian(today);
		var gst = GMST(julianDay);
		var latLng = [];

		var sunEclPos = this._sunEclipticPosition(julianDay);
		var eclObliq = this._eclipticObliquity(julianDay);
		var sunEqPos = this._sunEquatorialPosition(sunEclPos.lambda, eclObliq);
		for (var i = 0; i <= this.options.longitudeRange * this.options.resolution; i++) {
			var lng = -this.options.longitudeRange/2 + i / this.options.resolution;
			var ha = this._hourAngle(lng, sunEqPos, gst);
			latLng[i + 1] = [this._latitude(ha, sunEqPos), lng];
		}
		if (sunEqPos.delta < 0) {
			latLng[0] = [90, -this.options.longitudeRange/2];
			latLng[latLng.length] = [90, this.options.longitudeRange/2];
		} else {
			latLng[0] = [-90, -this.options.longitudeRange/2];
			latLng[latLng.length] = [-90, this.options.longitudeRange/2];
		}
		return latLng;
	}
}

// 1.x keeps defaults on the prototype; without its own copy, mergeOptions would change every L.Polygon
if (L.version.startsWith('1.')) {
	Terminator.prototype.options = Object.create(L.Polygon.prototype.options);
}

Terminator.mergeOptions({
	interactive: false, // Disable "clickable" mouse pointer
	color: '#000',
	opacity: 0.5,
	fillColor: '#000',
	fillOpacity: 0.5,
	smoothFactor: 1, // Leaflet 2 lowered the default to 0.5
	resolution: 2,
	longitudeRange: 720
});

export default function terminator(options) {
	return new Terminator(options);
}
