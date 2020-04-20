///////////mapbox API

mapboxgl.accessToken =
    'pk.eyJ1IjoiZXRvaWxlMzciLCJhIjoiY2szdWtzdmtpMDF0bzNudDgxeHR1dzdydSJ9._czhr3b4gablNdvs_nxC1Q';
var map = new mapboxgl.Map({
    container: "map",
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-71.1097, 42.3736],
    zoom: 14
});


// set the global variables 

var hovered = null;
var tpl_factors = ['awe', 'joy', 'relax']
var tpl_scores = {}
var tpl_weights = {}

for (var i = 0; i < tpl_factors.length; i++) {
    tpl_scores[tpl_factors[i]] = 5
    tpl_weights[tpl_factors[i]] = 5
}



//loading mapbox API 

map.on("load", function () {
    var layers = map.getStyle().layers;

    //pointer shape
    map.on('mouseenter', 'street', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'street', function () {
        map.getCanvas().style.cursor = 'crosshair';
    });

    for (var i = 0; i < tpl_factors.length; i++) {
        // get element
        let ele = $('#range_' + tpl_factors[i])

        // get element value
        ele.val(tpl_weights[tpl_factors[i]])
    }

    // get values of clicked element from JSON format
    map.on('click', 'street', function (e) {
        var displayProperties = e.features[0].properties.Street;
        var astreet = e.features[0].properties.art_n;
        var jstreet = e.features[0].properties.food_n;
        var rstreet = e.features[0].properties.park_n;
        
        tpl_scores['awe'] = 5
        tpl_scores['joy'] = 5
        tpl_scores['relax'] = 5

        // register score to the global score container(global)
        tpl_scores['awe'] = astreet * 5 + jstreet * 5 + rstreet * 0;
        tpl_scores['joy'] = astreet * 0.5 + jstreet * 9 + rstreet * 0.5;
        tpl_scores['relax'] = astreet * 2 + jstreet * 1 + rstreet * 7;

        // render graph
        render_graph();
        render_score();

        //removing quotation marks from JSON
        document.getElementById('streetname').innerHTML = JSON.stringify(displayProperties).replace(/\"/g, "")
    });



    //set global variables 
    var avalue, jvalue, rvalue;

    var labelLayerId;
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }


    /////////////DRAWING A MAP IN MAPBOX

    //add data
    map.addSource("data", {
        'type': "geojson",
        'data': "https://gist.githubusercontent.com/sue-kim/09bcb00a67e8e0fe97831d4f9f3a744c/raw/957ba64ae200750ad2f29c2379640c0d53243891/json"

    });

    //street lines
    map.addLayer({
        'id': "street",
        'type': "line",
        'source': "data",


        'paint': {
            "line-width": 0,
            "line-color": "rgba(198,8,81, 0.35)",
            "line-dasharray": [0.5, 2]
        },
        'layout': {
            "line-cap": "round",
            "line-join": "round",
            "line-round-limit": 2
        }
    });


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

            // use an 'interpolate' expression to add a smooth transition effect to the
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
            'fill-extrusion-opacity': .3
        }
    }, labelLayerId);

    render_graph();
    render_score();
});

//update the values when the slider moves 
function handleRangeUpdated(e) {
    avalue = document.getElementById("range_awe").value;
    jvalue = document.getElementById("range_joy").value;
    rvalue = document.getElementById("range_relax").value;

    map.setPaintProperty("street", "line-width",
        ["+",
            ["+",
                ["*", Number(avalue) * 7 / 2, ["number", ["get", "art_n"]]],
                ["*", Number(avalue) * 2 / 2, ["number", ["get", "food_n"]]],
                ["*", Number(avalue) * 1 / 2, ["number", ["get", "park_n"]]]
            ],
            ["+",
                ["*", Number(jvalue) * 2.5 / 2, ["number", ["get", "art_n"]]],
                ["*", Number(jvalue) * 6.5 / 2, ["number", ["get", "food_n"]]],
                ["*", Number(jvalue) * 1 / 2, ["number", ["get", "park_n"]]]
            ],
            ["+",
                ["*", Number(rvalue) * 2 / 2, ["number", ["get", "art_n"]]],
                ["*", Number(rvalue) * 1 / 2, ["number", ["get", "food_n"]]],
                ["*", Number(rvalue) * 7 / 2, ["number", ["get", "park_n"]]]
            ]
        ]
    );
}
range_awe.addEventListener("mousemove", handleRangeUpdated)
range_joy.addEventListener("mousemove", handleRangeUpdated)
range_relax.addEventListener("mousemove", handleRangeUpdated)



function range_change() {
    tpl_update_weights()
    render_score()
}


var myRadarChart;


//rendering radar graph 
function render_graph() {
    var ctx = document.getElementById('myChart');
    if (myRadarChart) {
        myRadarChart.destroy();
    }
    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['🤩', '😍', '😌'],
            datasets: [{
                backgroundColor: 'rgba(255, 99, 132,0.2)',
                borderColor: 'rgba(255, 99, 132,1)',
                pointBackgroundColor: 'rgba(255, 99, 132,1)',

                data: [tpl_scores.awe, tpl_scores.joy, tpl_scores.relax]

            }]
        },
        options: {
            scale: {

                ticks: {
                    display: false,
                    min: 0,
                    max: 9,
                    stepSize: 3
                },
                pointLabels: {
                    fontSize: 18

                },
            },
            legend: {
                display: false
            },
        }
    });
}


//rendering the score
function render_score() {
    var new_score = 0
    for (var i = 0; i < tpl_factors.length; i++) {
        new_score += tpl_weights[tpl_factors[i]] * tpl_scores[tpl_factors[i]]
    }
    $('#street_score').text(Math.floor(new_score * 100) / 100)
}


function tpl_update_weights() {
    let eles = []

    for (var i = 0; i < tpl_factors.length; i++) {
        // get element
        let ele = $('#range_' + tpl_factors[i])

        // get element value
        tpl_weights[tpl_factors[i]] = parseFloat(ele.val())
    }
}