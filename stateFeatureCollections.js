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

console.log("Found", fiftys.length, "states' w/ Upper + Lower houses.");

function compressRegion(region, places) {
  places = places || 3;
  var g_ = region.geometry;
  if (g_.type.toLowerCase() === 'polygon') {
    g_.coordinates = g_.coordinates.map(function (polygon) {
      polygon.map(function (point) {
        point[0] = parseFloat(point[0].toFixed(places));
        point[1] = parseFloat(point[1].toFixed(places));
      });
      return polygon.filter((el, i, a) => (i % 2 === 0));
    });
  } else if (g_.type.toLowerCase() === 'multipolygon') {
    g_.coordinates = g_.coordinates.map(function (mpolygon) {
      mpolygon.map(function (polygon) {
        polygon.map(function (point) {
          point[0] = parseFloat(point[0].toFixed(places));
          point[1] = parseFloat(point[1].toFixed(places));
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

console.log("Done processing State-level regions");

var cdsDir = pj(__dirname, 'cds', '2016');
var districtFolders = fs.readdirSync(cdsDir).filter(f => {
  try { return fs.statSync(pj(cdsDir, f)).isDirectory(); }
  catch (e) { return false; }
});
var states = districtFolders.map(d => d.substr(0, 2));
states = states.filter((state, pos) => (states.indexOf(state) === pos));

function combineStateCDs(state) {
  var stateCDs = districtFolders.filter(d => d.startsWith(state));
  var stateGeoJSON = stateCDs.map(function (cd) {
    var region = fs.readFileSync(pj(cdsDir, cd, 'shape.geojson'), 'utf-8');
    var regionJSON = JSON.parse(region);
    regionJSON = compressRegion(regionJSON, 5);
    return regionJSON;
  }).reduce(function (stateGeoJSON, region) {
    stateGeoJSON.features.push(region);
    return stateGeoJSON;
  }, { type: 'FeatureCollection', features: [] });

  var dest = pj(cdsDir, state + '.geojson');
  fs.writeFileSync(dest, JSON.stringify(stateGeoJSON));
}

states.forEach(function (state) {
  console.log("Processing state", state);
  combineStateCDs(state);
});

console.log("Done processing State Congressional District regions");
