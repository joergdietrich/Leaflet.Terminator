export default {
	input: 'index.js',
	output: {
		format: 'umd',
		file: 'L.Terminator.js',
		name: 'L.terminator',
		globals: {
			'leaflet': 'L'
		}
	},
	external: ['leaflet']
}
