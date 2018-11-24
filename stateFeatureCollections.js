#!/usr/bin/env node

/**
 * Script to generate single sldl/sldu GeoJSONs with all a state's regions.
 */

var fs = require('fs');
var path = require('path');
var pj = function() { return path.join.apply(null, arguments); }

var statesDir = pj(__dirname, 'states');
var states = fs.readdirSync(statesDir);
var fiftys = states.filter(function (state) {
  try {
    var hasUpper = fs.statSync(pj(statesDir, state, 'sldu')).isDirectory();
    var hasLower = fs.statSync(pj(statesDir, state, 'sldl')).isDirectory();
    return hasUpper && hasLower;
  } catch (e) { return false; }
});

console.log("Found", fiftys.length, "states to process.");

function compressRegion(region) {
  var g_ = region.geometry;
  if (g_.type.toLowerCase() === 'polygon') {
    g_.coordinates = g_.coordinates.map(function (polygon) {
      polygon.map(function (point) {
        point[0] = parseFloat(point[0].toFixed(3));
        point[1] = parseFloat(point[1].toFixed(3));
      });
      return polygon.filter((el, i, a) => (i % 2 === 0));
    });
  } else if (g_.type.toLowerCase() === 'multipolygon') {
    g_.coordinates = g_.coordinates.map(function (mpolygon) {
      mpolygon.map(function (polygon) {
        polygon.map(function (point) {
          point[0] = parseFloat(point[0].toFixed(3));
          point[1] = parseFloat(point[1].toFixed(3));
        });
      });
      return mpolygon.filter((el, i, a) => (i % 2 === 0));
    });
  }
  return region;
}

// console.log(compressRegion(JSON.parse(
//   fs.readFileSync(pj(statesDir, 'AK', 'sldl', '16.geojson'), 'utf-8'))
// ));

function combineRegions(dir, regionNames) {
  return regionNames.reduce(function (gJ, d) {
    var district = JSON.parse(fs.readFileSync(pj(dir, d), 'utf-8'));
    district = compressRegion(district);
    return gJ.features.push(district), gJ;
  }, { type: 'FeatureCollection', features: [] });
}

function reduceState(state) {
  console.log("Upper: Reading");
  var upperDir = pj(statesDir, state, 'sldu');
  var upperDs = fs.readdirSync(upperDir).filter(n => n !== 'sldu.geojson');
  var upperGeoJSON = combineRegions(upperDir, upperDs);
  console.log("Upper: Writing");
  fs.writeFileSync(pj(upperDir, 'sldu.geojson'), JSON.stringify(upperGeoJSON));
  
  console.log("Lower: Reading");
  var lowerDir = pj(statesDir, state, 'sldl');
  var lowerDs = fs.readdirSync(lowerDir).filter(n => n !== 'sldl.geojson');
  var lowerGeoJSON = combineRegions(lowerDir, lowerDs);
  console.log("Lower: Writing");
  fs.writeFileSync(pj(lowerDir, 'sldl.geojson'), JSON.stringify(lowerGeoJSON));
}

fiftys.forEach(function (state) {
  console.log("Processing state", state);
  reduceState(state);
});
