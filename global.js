// Entry for the script build: attaches the plugin to the global L

import terminator, {Terminator} from './index.js';

window.L.Terminator = Terminator;
window.L.terminator = terminator;
