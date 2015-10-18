var fs = require('fs');
var AS3JS = require('as3js');

global.AS3JS = require('as3js/lib/as3');

var as3js = new AS3JS();
var sourceText = as3js.compile({
  srcPaths: ['./as3'],
  silent: false,
  verbose: false,
  entry: "com.mcleodgaming.elevator.Main",
  entryMode: "instance",
  ignoreFlash: true
}).compiledSource;
if (fs.existsSync('elevator.js'))
{
  fs.unlinkSync('elevator.js');
}

// Prepend the output with the AS3JS library

var as3jslib = fs.readFileSync('node_modules/as3js/lib/as3.js');

fs.writeFileSync('elevator.js', as3jslib + '\n' + sourceText, "UTF-8", {flags: 'w+'});