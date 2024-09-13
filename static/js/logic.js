
//----------------------------------------------------------------------//
// GLOBALS
//----------------------------------------------------------------------//
// Set list of colors for map
const colors = ['fbc127','f57d15','d44843','9f2a63','65156e','280b54']
// Set URL to estract geojson
// let geojson = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
const geojson = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
// Set initial zoom
const initZoom = 4;
// tectonic plates
const json = 'static/data/PB2002_boundaries.json';
//----------------------------------------------------------------------//
// FETCH DATA THEN RUN APP
//----------------------------------------------------------------------//
// Get the data with d3.
d3.json(geojson).then(function(data) {
  // console.log(data);
  d3.json(json).then(function(rows) {
    console.log(rows);
    createFeatures(data.features.sort((x,y)=>d3.ascending(y.properties.mag,x.properties.mag)),rows.features);
  });
});

//----------------------------------------------------------------------//
// FUNCTIONS
//----------------------------------------------------------------------//
function createFeatures(earthquakeData,tectonicData) {
  // function to assign colors
  function getColor(depth) {
    if (depth<10) return colors[0];
    else if (depth<30) return colors[1];
    else if (depth<50) return colors[2];
    else if (depth<70) return colors[3];
    else if (depth<90) return colors[4];
    else return colors[5];
  }
  // array to store markers
  let circleMarkers = []
  // function to create circles
  function createCircles(feature, latlng) {
    const marker = L.circleMarker(latlng, {
      color: `#${getColor(feature.geometry.coordinates[2])}`,
      radius: calculateRadius(feature.properties.mag,initZoom),
      fillOpacity: 0.4,
      weight: 1,
    });
    marker.mag = feature.properties.mag;
    circleMarkers.push(marker);
    return marker;
  }
  // function to bind popup to each geojson feature
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h1>M${feature.properties.mag}</h1><h4>${feature.properties.place}</h4><p>${new Date(feature.properties.time)}</p>`,
    { className:`popup-${getColor(feature.geometry.coordinates[2])}`});
  }
  // Create a GeoJSON layer that contains the features array on the tectonicData object.
  let tectonics = L.geoJSON(tectonicData, {
    'color':'black',
    'weight': 2,
    'opacity': 0.4
  });
  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  let earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: createCircles,
    onEachFeature: onEachFeature
  });
  // Send our earthquakes layer to the createMap function
  createMap(earthquakes,tectonics,circleMarkers);
}
//----------------------------------------------------------------------//
// Create map
function createMap(earthquakes,tectonics,circleMarkers) {
  // Create the base layers.
  let satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    minZoom: 0,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });
  var street = L.tileLayer('https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
    attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 0,
    maxZoom: 22,
    accessToken: ' m5Y4FMaF1cDbNvJ2BRVZfIW68vIcw3Ve3nM9d28vh1uSeckwb0QriuvQ5hsAnSLT'
  });
  var gray = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    minZoom: 0,
    maxZoom: 16
  });
  var terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
    maxZoom: 13
  });
  // Create a baseMaps object.
  let baseMaps = {
    "Street Map": street,
    "Minimal Map": gray,
    "Terrain Map": terrain,
    "Satelite Map" : satellite,
  }
  // Create an overlay object to hold our overlay.
  let overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonics
  }
  // Create our map, giving it the streetmap and earthquakes layers to display on load.
  let myMap = L.map("map", {
    center: [37.09, -95.71],
    zoom: initZoom,
    layers: [street, earthquakes, tectonics]
  });
  myMap.on('zoomend', function() {             
    var currentZoom = myMap.getZoom();
    console.log(currentZoom);
    circleMarkers.forEach(marker=>marker.setRadius(calculateRadius(marker.mag,currentZoom-1)));
  });
  // Create a layer control, pass it our baseMaps and overlayMaps,
  // then add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {collapsed:false}).addTo(myMap);
  // Send map to createLegend function
  createLegend(myMap);
}
//----------------------------------------------------------------------//
// Create legend
function createLegend(map) {
  let legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    let div = L.DomUtil.create("div", "legend leaflet-control-layers leaflet-control-layers-expanded");
    let range = [-10, 10, 30, 50, 70, 90];
    div.innerHTML = '<b>Depth Legend</b><br>'
    // Loop through the ranges and generate a label with a colored square for each interval
    for (let i = 0; i < range.length; i++) {
      div.innerHTML += `<i style="background-color:#${colors[i]};"></i>${range[i]} `
          + (range[i+1] ? '&ndash; '+range[i + 1]+' km<br>' : '+'+' km');
    }
    return div;
  };
  // Adding the legend to the map
  legend.addTo(map);
}
//----------------------------------------------------------------------//
// function to calculate radius
function calculateRadius(magnitude, zoom) {
  const transformedMagnitude = Math.sqrt(2.5**(magnitude+2));
  if (zoom>10) return 2**(zoom-11)*transformedMagnitude
  if (zoom>initZoom) return transformedMagnitude; // sqrt(ln(M + 1))
  return 2**(zoom-initZoom)*transformedMagnitude; // sqrt(ln(M + 1))
}