export default {
  input: 'index.js',
  output: {
    file: 'L.Terminator.js',
    format: 'iife'
  },
  external: ['L'],
  globals: {
    'leaflet': 'L',
  }
}
