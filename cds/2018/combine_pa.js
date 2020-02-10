var fs = require('fs');
var path = require('path');

var folders = fs.readdirSync('.').filter(f => f.startsWith('PA-'));

var pa = { type: 'FeatureCollection', features: [] };

function reviver(field, value) {
  if (Array.isArray(value) && value.length > 100) {
    var oldvalue = value;
    value = [];
    for (var j = 0, k = 0; j < oldvalue.length; j++) {
      if ((j + 1) % 8 == 0)
        continue;
      value[k++] = oldvalue[j];
    }
  }

  else if (Array.isArray(value) && value.length > 0 && !isNaN(value[0])) {
    for (var i = 0; i < value.length; i++) {
      value[i] = new Number(parseFloat(value[i]).toFixed(5));
    }
  }

  return value;
}

for (var i = 0; i < folders.length; i++) {
  var file = path.join(__dirname, folders[i], 'shape.geojson');
  var contents = JSON.parse(fs.readFileSync(file, 'utf8'), reviver);
  pa.features.push(contents);
}

fs.writeFileSync('PA.geojson', JSON.stringify(pa), 'utf8');
