var timeFactor = 5; //number of minutes in real life to a second in the viz
$('.timeFactor').html(timeFactor); //Displays the timeFactor in the UI.
var tweenToggle = 0;
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/cwhong.map-hziyh867/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});


var topLeft,bottomRight;

var time = moment();
var map = L.map('map',{ zoomControl:false })
.addLayer(mapboxTiles)
.setView([40.7127, -74.0059], 14);


var running = {
    "fare":0,
    "surcharge":0,
    "mtatax":0,
    "tolls":0,
    "tip":0,
    "total":0,
    "passengers":0
} ;



var svg = d3.select(map.getPanes().overlayPane).append("svg"),
g = svg.append("g").attr("class", "leaflet-zoom-hide");


//area chart
var margin = {top: 30, right: 20, bottom: 20, left: 40},
areaChartWidth = $(window).width() - margin.left - margin.right -40,
areaChartHeight = 140 - margin.top - margin.bottom;

var parseDate = d3.time.format("%d-%b-%y").parse;

var x = d3.scale.linear()
.range([0, areaChartWidth]);

var y = d3.scale.linear()
.range([areaChartHeight, 0]);

var xAxis = d3.svg.axis()
.scale(x)
.orient("bottom");

var yAxis = d3.svg.axis()
.scale(y)
.orient("left")
.ticks(4);

var area = d3.svg.area()
.x(function(d) { return x(d.time); })
.y0(areaChartHeight)
.y1(function(d) { return y(d.runningFare); });

var areaChartSvg = d3.select(".areaChartBox").append("svg")
.attr("width", areaChartWidth + margin.left + margin.right)
.attr("height", areaChartHeight + margin.top + margin.bottom)
.attr("class","areaChart")
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var markerLine = areaChartSvg.append('line')
.attr('x1', 0)
.attr('y1', 0)
.attr('x2', 0) 
.attr('y2', areaChartHeight )
.attr("class","markerLine");

var dummyData = [];



x.domain([0, 24]);
y.domain([0, 600]);

var chartPath = areaChartSvg.append("path")
.datum(dummyData)
.attr("class", "area");
//.attr("d", area);

areaChartSvg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + areaChartHeight + ")")
.call(xAxis)
.append("text")
.attr("y", 9)
.attr("x", 39)
.attr("dy", ".71em")
.style("text-anchor", "end")
.text("Hour");

areaChartSvg.append("g")
.attr("class", "y axis")
.call(yAxis)
.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 6)
.attr("dy", ".71em")
.style("text-anchor", "end")
.text("Fares ($)");



//end area chart

//listeners 

$('.slower').click(function(){
    if(timeFactor > 1){
        timeFactor -= 1;  
    };

    $('.timeFactor').html(timeFactor);

});

$('.faster').click(function(){
    timeFactor += 1;
    $('.timeFactor').html(timeFactor);

});

$('.reload').click(function(){
    location.reload();
});

$('.about').click(function(){
    $('.aboutPopup').fadeIn();
});

$('.asterisks').click(function(){
    $('.asterisksPopup').fadeIn();
});

$('.attribution').click(function(){
    $('.attributionPopup').fadeIn();
});

$('.aboutPopup .panel-heading>.glyphicon').click(function(){
    $('.aboutPopup').fadeOut();
});

$('.asterisksPopup .panel-heading>.glyphicon').click(function(){
    $('.asterisksPopup').fadeOut();
});

$('.attributionPopup .panel-heading>.glyphicon').click(function(){
    $('.attributionPopup').fadeOut();
});

var transform = d3.geo.transform({
    point: projectPoint
}),
d3path = d3.geo.path().projection(transform);

var timer;

function updateTimer() {
    time.add('minutes',1);
    $('.readableTime').text(time.format('h:mm a'));
    $('.date').text(time.format('dddd, MMMM Do YYYY'));
    timer = setTimeout(function(){updateTimer()},(1000/timeFactor));
}



d3.json('/trip', function (data) {

    console.log("Loaded data for medallion: " + data.features[0].properties.medallion);


    var feature = g.selectAll("path")
    .data(data.features)
    .enter().append("path")
    .attr("class", function (d) {

        if (d.properties.hasfare == true) {
            return "trip" + (d.properties.key * 2) + " " + d.properties.hasfare;
        } else {
            return "trip" + ((d.properties.key * 2) + 1) + " " + d.properties.hasfare;
        }
    })
    .attr("style", "opacity:0");

    var pointsArray = [];
    var points = g.selectAll(".point")
    .data(pointsArray);


//.attr("style","opacity:0");



var marker = g.append("circle");
marker.attr("r", 5)
.attr("id", "marker");
//.attr("transform", "translate(" + startPoint + ")");

//Get path start point for placing marker



//var string = JSON.stringify(j);


map.on("viewreset", reset);
reset();

var i = 0;

function iterate() {

    var chartInterval = 0;

    var emptyData = [];

    var emptyPath = areaChartSvg.append("path")
    .datum(emptyData)
    .attr("class", "empty");



    var path = svg.select("path.trip" + i)
    .attr("style", "opacity:.7")
    .call(transition);



    function pathStartPoint(path) {
        var d = path.attr('d');

        dsplitted = d.split("L")[0].slice(1).split(",");
        var point = []
        point[0]=parseInt(dsplitted[0]);
        point[1]=parseInt(dsplitted[1]);

        return point;
    }


    var startPoint = pathStartPoint(path);
    marker.attr("transform", "translate(" + startPoint[0] + "," + startPoint[1] + ")");


path.each(function(d){

//add the translation of the map's g element
startPoint[0] = startPoint[0]; //+ topLeft[0];
startPoint[1] = startPoint[1]; //+ topLeft[1];
var newLatLon = coordToLatLon(startPoint);
pointsArray.push([newLatLon.lng,newLatLon.lat,d.properties.hasfare]);


points = g.selectAll(".point")
.data(pointsArray)
.enter()
.append('circle')
.attr("r",5)
.attr("class",function(d){
    if(d[2]) {
        return "startPoint point";
    } else {
        return "endPoint point";
    }
})
.attr("transform",function(d){
    return translatePoint(d);  
});

if(d.properties.hasfare) { //transition marker to show full taxi
    marker
    .transition()
    .duration(500)
    .attr("r",5)
    .attr('style','opacity:1');







} else { //Transition marker to show empty taxi

    marker
    .transition()
    .duration(500)
    .attr("r",40)
    .attr('style','opacity:.3');

}
});




function transition(path) {

    g.selectAll

    path.transition()
    .duration(function(d){
        //calculate seconds
        var start = Date.parse(d.properties.pickuptime),
        finish = Date.parse(d.properties.dropofftime),
        duration = finish - start;

        duration = duration/60000; //convert to minutes

        duration = duration * (1/timeFactor) * 1000;


        time = moment(d.properties.pickuptime.toString());



        $('.readableTime').text(time.format('h:mm a'));


        return (duration);
})
    .attrTween("stroke-dasharray", tweenDash)
    .each("end", function (d) {

        if(d.properties.hasfare) {

            running.fare += parseFloat(d.properties.fare);
            running.surcharge += parseFloat(d.properties.surcharge);
            running.mtatax += parseFloat(d.properties.mtatax);
            running.tip += parseFloat(d.properties.tip);
            running.tolls += parseFloat(d.properties.tolls);
            running.total += parseFloat(d.properties.total);
            running.passengers += parseFloat(d.properties.passengers);



            for(var p = 0;p<d.properties.passengers;p++){
                $('.passengerGlyphs').append('<span class="glyphicon glyphicon-user"></span>');
            }

            updateRunning();



        };
        i++;

        var nextPath = svg.select("path.trip" + i);
        if (nextPath[0][0]==null){
            clearTimeout(timer);
        } else {
            iterate(); 
        }


    });

}

function tweenDash(d) {

    var l = path.node().getTotalLength();
var i = d3.interpolateString("0," + l, l + "," + l); // interpolation of stroke-dasharray style attr
return function (t) {
    var marker = d3.select("#marker");
    var p = path.node().getPointAtLength(t * l);
marker.attr("transform", "translate(" + p.x + "," + p.y + ")");//move marker


if (tweenToggle == 0) {
    tweenToggle = 1;
    var newCenter = map.layerPointToLatLng(new L.Point(p.x,p.y));

    map.panTo(newCenter, 14);
} else {
    tweenToggle = 0;
}


//update chart data every X frames
if(chartInterval == 5){

    chartInterval = 0;



    var decimalHour = parseInt(time.format('H')) + parseFloat(time.format('m')/60)




    if(isNaN(d.properties.fare)){
        d.properties.fare = 0; 
    }

    var incrementalFare = d.properties.fare*t;


    dummyData.push({
        "time": decimalHour,
        "runningFare": running.fare + parseFloat(incrementalFare)
    });


chartPath.attr("d", area); //redraw area chart
if(d.properties.hasfare == false) { //draw purple area for nonfare time
    emptyData.push({
        "time": decimalHour,
        "runningFare": running.fare + parseFloat(incrementalFare)
    });

    emptyPath.attr("d", area);
}

markerLine
.attr('x1', x(decimalHour))
.attr('x2', x(decimalHour));




} else {
    chartInterval++;
}


return i(t);
}
}

}

updateRunning();

$('#begin').click(function(){
    $('.overlay').fadeOut(250);
    $('.box').fadeIn(250);
    setTimeout(function(){
        updateTimer();
        iterate();
    },500);

});


function updateRunning() {
    $('.runningFare').text('$'+running.fare.toFixed(2));
    $('.runningSurcharge').text('$'+running.surcharge.toFixed(2));
    $('.runningTax').text('$'+running.mtatax.toFixed(2));
    $('.runningTip').text('$'+running.tip.toFixed(2));
    $('.runningTolls').text('$'+running.tolls.toFixed(2));
    $('.runningTotal').text('$'+running.total.toFixed(2));
    $('.runningPassengers').text(running.passengers);
}

// Reposition the SVG to cover the features.
function reset() {
    var bounds = d3path.bounds(data);
    topLeft = bounds[0],
    bottomRight = bounds[1];

    svg.attr("width", bottomRight[0] - topLeft[0] + 100)
    .attr("height", bottomRight[1] - topLeft[1] + 100)
    .style("left", topLeft[0]-50 + "px")
    .style("top", topLeft[1]-50 + "px");

    g.attr("transform", "translate(" + (-topLeft[0]+50) + "," + (-topLeft[1]+50)+ ")");

    feature.attr("d", d3path);

    //TODO: Figure out why this doesn't work as points.attr...
    g.selectAll(".point")
    .attr("transform",function(d){
        return translatePoint(d);
    });


}




});
// Use Leaflet to implement a D3 geometric transformation.
function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

function translatePoint(d) {
    var point = map.latLngToLayerPoint(new L.LatLng(d[1],d[0]));  

    return "translate(" + point.x + "," + point.y + ")";
}

function coordToLatLon(coord) {
var point = map.layerPointToLatLng(new L.Point(coord[0],coord[1]));
return point;
}

