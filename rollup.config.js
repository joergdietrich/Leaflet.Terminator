export default {
	input: 'global.js',
	output: {
		format: 'iife',
		file: 'L.Terminator.js',
		globals: {
			'leaflet': 'L'
		}
	},
	external: ['leaflet']
}
