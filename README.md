Leaflet.Terminator
==================

Overlay day and night regions on a Leaflet Earth map.

Demo: http://joergdietrich.github.io/Leaflet.Terminator/

Leaflet.Terminator extends the Polygon class. Adding the terminator to a leaflet map is as easy as 

    L.terminator().addTo(map)

In addition to all Polygon options, Leaflet.Terminator has a new
option "resolution", which gives the step size at which the terminator
points are computed. The step size is 1°/resolution, i.e. higher
resolution values have smaller step sizes and more points in the
polygon. The default value is 2.
