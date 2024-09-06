
// Define global variables
const colors = ['#ffba08','#faa307','#f48c06','#dc2f02','#d00000','#9d0208']
// Load the GeoJSON data.
// let geojson = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson";
const geojson = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

// Create Map
  function createFeatures(earthquakeData) {

    function getColor(depth) {
      if (depth<10) return colors[0];
      else if (depth<30) return colors[1];
      else if (depth<50) return colors[2];
      else if (depth<70) return colors[3];
      else if (depth<90) return colors[4];
      else return colors[5];
    }

    function calculateRadius(magnitude) {
      // Ensure the magnitude is non-negative and apply transformations
      const scaleFactor = 3; // Adjust this factor to change circle sizes
      const transformedMagnitude = 3**(magnitude); // ln(M + 1)
      return scaleFactor * Math.sqrt(transformedMagnitude); // sqrt(ln(M + 1))
    }

    function createCircles(feature, latlng) {
      return L.circleMarker(latlng, {
        color: getColor(feature.geometry.coordinates[2]),
        radius: calculateRadius(feature.properties.mag),
        fillOpacity: 0.6,
        weight: 1,
      });
    }
    
    function onEachFeature(feature, layer) {
      layer.bindPopup(`<h4>${feature.properties.title}</h4><p>${new Date(feature.properties.time)}</p>`);
    }
  
    // Create a GeoJSON layer that contains the features array on the earthquakeData object.
    // Run the onEachFeature function once for each piece of data in the array.
    let earthquakes = L.geoJSON(earthquakeData, {
      pointToLayer: createCircles,
      onEachFeature: onEachFeature
    });
  
    // Send our earthquakes layer to the createMap function/
    createMap(earthquakes);
  }

  function createMap(earthquakes) {

    // Create the base layers.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
  
    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });
  
    // Create a baseMaps object.
    let baseMaps = {
      "Street Map": street,
      "Topographic Map": topo
    };
  
    // Create an overlay object to hold our overlay.
    let overlayMaps = {
      Earthquakes: earthquakes
    };
  
    // Create our map, giving it the streetmap and earthquakes layers to display on load.
    let myMap = L.map("map", {
      center: [37.09, -95.71],
      zoom: 4,
      layers: [street, earthquakes]
    });
  
    // Create a layer control.
    // Pass it our baseMaps and overlayMaps.
    // Add the layer control to the map.
    L.control.layers(baseMaps, overlayMaps, {collapsed:false}).addTo(myMap);
    createLegend(myMap);
  }

  function createLegend(map) {
    let legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
      let div = L.DomUtil.create("div", "legend leaflet-control-layers leaflet-control-layers-expanded");
      let range = [-10, 10, 30, 50, 70, 90];
      div.innerHTML = '<b>Depth Legend</b><br>'

        // Loop through the ranges and generate a label with a colored square for each interval
        for (let i = 0; i < range.length; i++) {
            div.innerHTML +=
                '<i style="background-color:' + colors[i] + '; width: 18px; height: 18px; float: left; margin-right: 8px; opacity: 0.7;"></i> ' +
                range[i] + (range[i + 1] ? ' &ndash; ' + range[i + 1] + ' km<br>' : '+' + ' km');
        }
        return div;
    };
    // Adding the legend to the map
    legend.addTo(map);
  }
  
  // Get the data with d3.
  d3.json(geojson).then(function(data) {
    console.log(data);
    createFeatures(data.features);
  });