export default {
  name: 'leaflet.terminator',
  input: 'index.js',
  output: {
    file: 'L.Terminator.js',
    format: 'iife'
  },
  external: ['leaflet'],
  globals: {
    'leaflet': 'L',
  }
}
