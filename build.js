var fs = require('fs');
var AS3JS = require('as3js');

var as3js = new AS3JS();
var sourceText = as3js.compile({
  srcPaths: ['./as3'],
  silent: false,
  verbose: false,
  entry: "new:com.mcleodgaming.elevator.Main"
}).compiledSource;
if (fs.existsSync('elevator.js'))
{
  fs.unlinkSync('elevator.js');
}
fs.writeFileSync('elevator.js', sourceText, "UTF-8", {flags: 'w+'});