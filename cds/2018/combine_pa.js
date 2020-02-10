var fs = require('fs');
var path = require('path');

var folders = fs.readdirSync('.').filter(f => f.startsWith('PA-'));

var pa = { type: 'FeatureCollection', features: [] };

for (var i = 0; i < folders.length; i++) {
  var file = path.join(__dirname, folders[i], 'shape.geojson');
  var contents = JSON.parse(fs.readFileSync(file, 'utf8'));
  pa.features.push(contents);
}

fs.writeFileSync('PA.geojson', JSON.stringify(contents), 'utf8');
