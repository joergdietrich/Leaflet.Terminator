Leaflet.Terminator
==================

Overlay day and night regions on a Leaflet Earth map.

Demo: http://joergdietrich.github.io/Leaflet.Terminator/

Leaflet.Terminator extends the Polygon class and works with Leaflet 1.9
and Leaflet 2. Adding the terminator to a leaflet map is as easy as 

```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/@joergdietrich/leaflet.terminator"></script>
```
```js
var map = L.map('map').addLayer(L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png'));
L.terminator().addTo(map)
```

With Leaflet 2, load `leaflet-global.js` instead of `leaflet.js` to keep
using script tags and the global `L`:

```html
<script src="https://unpkg.com/leaflet@2.0.0-beta.5/dist/leaflet-global.js"></script>
<script src="https://unpkg.com/@joergdietrich/leaflet.terminator"></script>
```
```js
var map = new L.Map('map').addLayer(new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png'));
L.terminator().addTo(map)
```

Or as an ES module with npm (Leaflet 1.9 or 2):

```js
import * as L from 'leaflet';
import {Terminator} from '@joergdietrich/leaflet.terminator';

var map = new L.Map('map').addLayer(new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png'));
new Terminator().addTo(map);
```

The default export `terminator()` is a factory that does the same as
`new Terminator()`.


In addition to all Polygon options, Leaflet.Terminator has a new
option `resolution`, which gives the step size at which the terminator
points are computed. The step size is 1°/resolution, i.e. higher
resolution values have smaller step sizes and more points in the
polygon. The default value is 2.

Leaflet.Terminator computes the terminator from longitudes -360° to +360°
(a range of 720°), covering the Earth twice. To limit the terminator
longitude range, the `longitudeRange` option is available.

```js
var sunlightOverlay = L.terminator({resolution: 5, longitudeRange:360});
```

The `sunAltitude` option sets the Sun's altitude in degrees below which
the map is shaded. The default is -0.833°, the standard definition of
sunrise and sunset, which accounts for atmospheric refraction and the
Sun's upper limb. Set it to 0 for the purely geometric terminator that
earlier versions drew.

| Boundary | `sunAltitude` |
|---|---|
| Golden hour | 6 |
| Geometric terminator | 0 |
| Sunrise/sunset | -0.833 (default) |
| Civil twilight | -6 |
| Nautical twilight | -12 |
| Astronomical twilight | -18 |

Stacking several layers with a low opacity gives a twilight gradient:

```js
[-0.833, -6, -12, -18].forEach(function(altitude) {
	L.terminator({sunAltitude: altitude, fillOpacity: 0.15, stroke: false}).addTo(map);
});
```

`setSunAltitude()` changes the altitude of an existing layer.

You can pass the `time` option in the constructor or use the `setTime()`
method to control the reference time and date for the terminator; the
value can be anything accepted by the `Date()` constructor. By default,
the current time will be used.

In the same way, you can use the `setTime()` method without an argument
to refresh the terminator to the current time. This can be done
automatically, for example using a timer:

```js
var map = L.map('map').addLayer(L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
var terminator = L.terminator().addTo(map);
setInterval(function() {
	terminator.setTime();
}, 60000); // Every minute

```

If you don't like background timers running even when the page is
inactive, you can also set the terminator to be refreshed only when the
user interacts with the map:

```js
var map = L.map('map').addLayer(L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
var terminator = L.terminator().addTo(map);
map.on('zoomstart movestart popupopen', function(e) {
	terminator.setTime();
});
```

You can customize and complete this code by listing
additional map interaction events, described in the Leaflet
[documentation](https://leafletjs.com/reference.html#map-event).
