Leaflet.Terminator
==================

Overlay day and night regions on a Leaflet Earth map.

Demo: http://joergdietrich.github.io/Leaflet.Terminator/

Leaflet.Terminator extends the Polygon class. Adding the terminator to a leaflet map is as easy as 

```html
<script src="https://unpkg.com/leaflet"></script>
<script src="https://unpkg.com/@joergdietrich/leaflet.terminator"></script>
```
```js
var map = L.map('map').addLayer(L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
L.terminator().addTo(map)
```

Or with npm:

```js
import L from 'leaflet';
import terminator from '@joergdietrich/leaflet.terminator';

var map = L.map('map').addLayer(L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'))
terminator().addTo(map);
```


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
map.addEventListener('zoomstart movestart popupopen', function(e) {
	terminator.setTime();
});
```

You can customize and complete this code by listing
additional map interaction events, described in the Leaflet
[documentation](https://leafletjs.com/reference.html#map-event).
