var timeFactor = 5; //number of minutes in real life to a second in the viz
$('.timeFactor').html(timeFactor); //Displays the timeFactor in the UI.
var tweenToggle = 0;
var mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v3/cwhong.map-hziyh867/{z}/{x}/{y}.png', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var time = moment();
var map = L.map('map',{ zoomControl:false })
.addLayer(mapboxTiles)
.setView([40.7127, -74.0059], 14);


var runningFare = 0 ;

var svg = d3.select(map.getPanes().overlayPane).append("svg"),
g = svg.append("g").attr("class", "leaflet-zoom-hide");


//area chart
var margin = {top: 20, right: 10, bottom: 30, left: 50},
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

var areaChartSvg = d3.select(".overlay2").append("svg")
.attr("width", areaChartWidth + margin.left + margin.right)
.attr("height", areaChartHeight + margin.top + margin.bottom)
.attr("class","areaChart")
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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
    timeFactor -= 1;
    $('.timeFactor').html(timeFactor);

});

$('.faster').click(function(){
    timeFactor += 1;
    $('.timeFactor').html(timeFactor);

});




var transform = d3.geo.transform({
    point: projectPoint
}),
d3path = d3.geo.path().projection(transform);


function updateTimer() {
    time.add('minutes',1);
    $('.readableTime').text(time.format('h:mm a'));
    $('.date').text(time.format('dddd, MMMM Do YYYY'));
    setTimeout(function(){updateTimer()},(1000/timeFactor));
}



d3.json('http://localhost:3000/trip', function (data) {



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

        dsplitted = d.split("L")[0].slice(1);

        return dsplitted;
    }


    var startPoint = pathStartPoint(path);
    marker.attr("transform", "translate(" + startPoint + ")");
    
    path.each(function(d){
       g.append("circle")
        .attr("r", 5)
        .attr('class',function(){

           if(d.properties.hasfare) {
             return 'startPoint';
           } else {
             return 'endPoint';
           }
        })
        .attr("transform", "translate(" + startPoint + ")");

        if(d.properties.hasfare) {
            marker
            .transition()
            .duration(500)
            .attr("r",5)
            .attr('style','opacity:1');
        } else {

            marker
            .transition()
            .duration(500)
            .attr("r",40)
            .attr('style','opacity:.3');

        }
    });

    


    function transition(path) {
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
//console.log(d);
if(d.properties.hasfare) {
    runningFare += parseInt(d.properties.fare);
    $('.runningFare').text(runningFare);
};
i++;
iterate();
});

    }

    function tweenDash(d) {

        var l = path.node().getTotalLength();
var i = d3.interpolateString("0," + l, l + "," + l); // interpolation of stroke-dasharray style attr
return function (t) {
    var marker = d3.select("#marker");
    var p = path.node().getPointAtLength(t * l);
marker.attr("transform", "translate(" + p.x + "," + p.y + ")");//move marker

//console.log(tweenToggle);
if (tweenToggle == 0) {
    tweenToggle = 1;
    var newCenter = map.layerPointToLatLng(new L.Point(p.x,p.y));
//map.setView(newCenter, 14);
map.panTo(newCenter, 14);
} else {
    tweenToggle = 0;
}
//console.log(t);

//update chart data every X frames
if(chartInterval == 5){

    chartInterval = 0;



    var decimalHour = parseInt(time.format('H')) + parseFloat(time.format('m')/60)




if(isNaN(d.properties.fare)){
    d.properties.fare = 0; 
}

var incrementalFare = d.properties.fare*t;
//console.log(runningFare + " " + incrementalFare + " " + decimalHour); 


dummyData.push({
    "time": decimalHour,
    "runningFare": runningFare + parseFloat(incrementalFare)
});

//console.log(dummyData);

chartPath.attr("d", area); 
if(d.properties.hasfare == false) {
    emptyData.push({
        "time": decimalHour,
        "runningFare": runningFare + parseFloat(incrementalFare)
    });

    emptyPath.attr("d", area);
}

//at the end, write runningfare and decimalHour 



} else {
    chartInterval++;
}


return i(t);
}
}

}

$('#begin').click(function(){
    $('.overlay').fadeOut(2000);
    $('.overlay2').fadeIn(2000);
    setTimeout(function(){
        updateTimer();
        iterate();
    },2500);

});




// Reposition the SVG to cover the features.
function reset() {
    var bounds = d3path.bounds(data),
    topLeft = bounds[0],
    bottomRight = bounds[1];

    svg.attr("width", bottomRight[0] - topLeft[0] + 100)
    .attr("height", bottomRight[1] - topLeft[1] + 100)
    .style("left", topLeft[0]-50 + "px")
    .style("top", topLeft[1]-50 + "px");

    g.attr("transform", "translate(" + (-topLeft[0]+50) + "," + (-topLeft[1]+50)+ ")");

    feature.attr("d", d3path);
}




});
// Use Leaflet to implement a D3 geometric transformation.
function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}