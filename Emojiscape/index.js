const key = 'pk.eyJ1IjoiZXRvaWxlMzciLCJhIjoiY2szdWtzdmtpMDF0bzNudDgxeHR1dzdydSJ9._czhr3b4gablNdvs_nxC1Q';
///////////mapbox API
mapboxgl.accessToken = key;
var map = new mapboxgl.Map({
  container: "map",
  style: 'mapbox://styles/etoile37/ck49gt7hz01q41cqbueahvw5b',
  center: [-71.059158, 42.360195],
  zoom: 18
});



var emoji_dict = { 'joy': '<i class="far fa-laugh-squint"></i>', 
    'sadness': '<i class="far fa-sad-tear"></i>',
    'anger':'<i class="far fa-angry"></i>', 
    'analytical':' <i class="far fa-meh"></i>',
    'confident':'<i class="far fa-smile"></i>',
    'tentative':'<i class="far fa-meh-rolling-eyes"></i>',
    'fear':'<i class="far fa-flushed"></i>'}

var filterEl = document.getElementById('feature-filter');
var listingEl = document.getElementById('feature-listing');

var overlay = document.getElementById('emoji');

// Holds visible point features for filtering
var emotions = [];
// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  className: 'popup', closeButton: false
});




// document.getElementById('slider').addEventListener('input', function(e) {
//   var hour = parseInt(e.target.value);
//   // update the map
//   map.setFilter('time', ['==', ['number', ['get', 'Hour']], hour]);

//   // converting 0-23 hour to AMPM format
//   var ampm = hour >= 12 ? 'PM' : 'AM';
//   var hour12 = hour % 12 ? hour % 12 : 12;

//   // update text in the UI
//   document.getElementById('active-hour').innerText = hour12 + ampm;
// });




map.on('load', () => {
  map.addSource("data", {
    'type': 'geojson',
    'data': 'https://gist.githubusercontent.com/Suekim37/f8317d8458a37e2f952f96e75c0793ee/raw/a9744de2970b820422497a0b1b7cc4806057c8d2/final_dataset_n.geojson'
  });

  map.addLayer({
      'id': 'emotion',
      'source': 'data',
      'type': 'symbol',

      'paint': {
        'icon-opacity':0.5
      },
        layout: {
        "icon-image": [
          'match',
          ["get", "tone"],
          'joy',  'happy',
          'analytical', 'neutral',
          'sadness', 'crying',
          'anger',  'angry',
          'confident', 'cool',
          'tentative',  'wondering',
          'fear',  'baffled',  'happy'
        ],
        "icon-padding": 0,
        "icon-allow-overlap": true,
        "icon-size":[
          'interpolate',['linear'],['zoom'],
          
          15,["*",['get', "score"], 0.2],
          20,["*",['get', "score"], 1]
        ]
      
      }
    }),
    //highlighted when hovering
    map.addLayer({
      'id': 'emotion-highlighted',
      'source': 'data',
      'type': 'symbol',
      
      'paint': {
        'icon-opacity':1
      },
      layout: {
        "icon-image": [
          'match',
          ["get", "tone"],
          'joy',  'happy',
          'analytical', 'neutral',
          'sadness', 'crying',
          'anger',  'angry',
          'confident', 'cool',
          'tentative',  'wondering',
          'fear',  'baffled',  'happy'
        ],
        "icon-padding": 0,
        "icon-allow-overlap": true,
        "icon-size":[
          'interpolate',['linear'],['zoom'],
          
          15,["*",['get', "score"], 0.3],
          20,["*",['get', "score"], 1.1]
        ]
          }
    }),



    //3d buildings extrusion
    map.addLayer({
      'id': '3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#f6f6f6',

        // buildings as the user zooms in
        'fill-extrusion-height': [
          "interpolate", ["linear"],
          ["zoom"],
          15, 0,
          15.05, ["get", "height"]
        ],
        'fill-extrusion-base': [
          "interpolate", ["linear"],
          ["zoom"],
          15, 0,
          15.05, ["get", "min_height"]
        ],
        'fill-extrusion-opacity': 0.6
      },
    
    });


  map.on('moveend', function () {
    var features = map.queryRenderedFeatures({
      layers: ['emotion']
    });

    if (features) {
      var uniqueFeatures = getUniqueFeatures(features, 'location_name');
      // Populate features for the listing overlay.
      renderListings(uniqueFeatures);

      // Clear the input container
      filterEl.value = '';
      emotions = uniqueFeatures;
    }
  });

  map.on('mousemove', 'emotion', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    // Populate the popup and set its coordinates based on the feature.
    var feature = e.features[0];
    popup
      .setLngLat(feature.geometry.coordinates)
      .setText( 
        feature.properties.caption
      )
      .addTo(map);

    overlay.innerHTML = '';


    var hoveredtitle = document.createElement('div');
    hoveredtitle.textContent = feature.properties.location_name.substring(0,28);
    hoveredtitle.style.cssText = "font-weight: bold; text-align: center;"

    var hoveredtone = document.createElement('span');
    hoveredtone.innerHTML= emoji_dict[feature.properties.tone];
    hoveredtone.className =" fa-5x";
    hoveredtone.style.cssText = "color:#999999; padding-left:3.5rem; text-align: center;"

    var hoveredscore = document.createElement('span');
    hoveredscore.textContent = Math.round(feature.properties.score * 100)/10;
    hoveredscore.style.cssText = "color:#c9c9c9;  font-size: 2.5rem ; padding-left:1rem;text-align: center;"

    var hoveredtext = document.createElement('div');
    hoveredtext.className =" caption";
    hoveredtext.textContent =  feature.properties.caption;
    hoveredtext.style.cssText = "color:#999999; font-size:0.7rem; padding-top:0.5rem;"

    var hoveredlikes = document.createElement('div');
    hoveredlikes.className =" likes";
    hoveredlikes.innerHTML = ' <i class="fas fa-heart pr-1"></i>'+feature.properties.likes_count;
    hoveredlikes.style.cssText = "color:#999999; font-size:0.7rem; text-align:center; "

    overlay.appendChild(hoveredtone);
    overlay.appendChild(hoveredscore);
    overlay.appendChild(hoveredtitle);
    overlay.appendChild(hoveredtext);
    overlay.appendChild(hoveredlikes);
    overlay.style.display = 'block';

    // Add features to the highlighted layer.
    map.setFilter('emotion-highlighted', ['in', 'location_name',
      feature.properties.location_name
    ]);

  });


  map.on('mouseleave', 'emotion', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
    map.setFilter('emotion-highlighted', ['in', 'location_name', '']);

  });

  filterEl.addEventListener('keyup', function (e) {
    var value = normalize(e.target.value);

    // Filter visible features that don 't match the input value.
    var filtered = emotions.filter(function (feature) {
      var location_name = normalize(feature.properties.location_name);
      return location_name.indexOf(value) > -1;
    });

    // Populate the sidebar with filtered results
    renderListings(filtered);

    // // Set the filter to populate features into the layer. 
    map.setFilter('emotion', ['match', ['get', 'location_name'],
      filtered.map(function (feature) {
        return feature.properties.location_name;
      }), true, false
    ]);

  });
      // Call this function on initialization
    // passing an empty array to render an empty state
    renderListings([]);
});


function renderListings(features) {
  // Clear any existing listings
  listingEl.innerHTML = '';
  if (features.length) {
    features.forEach(function (feature) {
      var prop = feature.properties;
      var item = document.createElement('a');
      item.target = '_blank';
      item.textContent = prop.location_name;
      item.addEventListener('mouseover', function () {
        // Highlight corresponding feature on the map
        popup
          .setLngLat(feature.geometry.coordinates)
          .setText(feature.properties.location_name)
          .addTo(map);

        map.setFilter('emotion-highlighted', ['in', 'location_name',
          feature.properties.location_name
        ]);
      });

      //fly to the clicked location
      item.addEventListener('click', function () {
        map.flyTo({
          center:feature.geometry.coordinates,
          essential:true,
          zoom:20
        });

      });
      listingEl.appendChild(item);
    });

    // Show the filter input
    filterEl.parentNode.style.display = 'block';
  } else {
    var empty = document.createElement('p');
    empty.textContent = 'Drag the map to populate results';
    listingEl.appendChild(empty);

    // Hide the filter input
    filterEl.parentNode.style.display = 'none';

    // remove features filter
    map.setFilter('emotion', ['has', 'location_name']);
  }
}


function normalize(string) {
  return string.trim().toLowerCase();
}

function getUniqueFeatures(array, comparatorProperty) {
  var existingFeatureKeys = {};
  var uniqueFeatures = array.filter(function (el) {
    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
      return false;
    } else {
      existingFeatureKeys[el.properties[comparatorProperty]] = true;
      return true;
    }
  });
  return uniqueFeatures;
}