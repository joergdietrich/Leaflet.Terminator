// Smoke test: the ES module on Leaflet 2, and the script build on Leaflet 1 and 2

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function browser() {
	const dom = new JSDOM('<div id="map"></div>', {pretendToBeVisual: true, runScripts: 'outside-only'});
	dom.window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
	return dom.window;
}

function check(L, terminator, label) {
	const t = terminator({color: 'red', longitudeRange: 360, time: '2013-06-20T21:00:00Z'});
	const map = new L.Map('map',{renderer: new L.SVG()}).setView([0, 0], 1);
	t.addTo(map);

	assert.ok(t instanceof L.Polygon, `${label}: is a Polygon`);
	assert.equal(t.options.color, 'red', `${label}: user option applied`);
	assert.equal(t.options.resolution, 2, `${label}: plugin default applied`);
	assert.equal(t.options.interactive, false, `${label}: Path default overridden`);
	assert.equal(t.options.smoothFactor, 1, `${label}: smoothFactor pinned`);
	assert.equal(t.options.fillColor, '#000', `${label}: fillColor default`);
	assert.equal(t.getLatLngs()[0].length, 360 * 2 + 3, `${label}: polygon computed`);
	assert.ok(map.hasLayer(t), `${label}: added to map`);

	const polygonDefaults = L.Polygon.defaultOptions ?? L.Polygon.prototype.options;
	assert.equal(polygonDefaults.resolution, undefined, `${label}: Polygon defaults untouched`);

	const before = t.getLatLngs()[0][100].lat;
	t.setTime('2013-12-21T09:00:00Z');
	assert.notEqual(t.getLatLngs()[0][100].lat, before, `${label}: setTime recomputes`);

	console.log(`ok  ${label} (Leaflet ${L.version})`);
}

// ES module, Leaflet 2

const window = browser();
Object.assign(globalThis, {
	window, document: window.document, HTMLElement: window.HTMLElement, getComputedStyle: window.getComputedStyle,
	ResizeObserver: window.ResizeObserver,
	requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: window.cancelAnimationFrame
});
const L2 = await import('leaflet');
const {default: terminator} = await import('../index.js');
check(L2, terminator, 'ES module');

// Script build, Leaflet 1 and 2

for (const [label, leaflet] of [
	['script, 1.x', 'node_modules/leaflet-v1/dist/leaflet-src.js'],
	['script, 2.x', 'node_modules/leaflet/dist/leaflet-global.js']
]) {
	const w = browser();
	w.eval(read(leaflet));
	w.eval(read('L.Terminator.js'));
	check(w.L, w.L.terminator, label);
	assert.equal(w.L.Terminator, w.L.terminator().constructor, `${label}: class exposed`);
}
