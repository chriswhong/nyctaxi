var fs = require('fs');
var express    = require('express');
var app        = express(); 
var csv = require('fast-csv');
var polyline = require('polyline');

var port = process.env.PORT || 3000;    // set our port
var rawData = []

var stream = fs.createReadStream("output.csv");

var featureCollection = {
  type:"FeatureCollection",
  features:[]
};

csv
.fromStream(stream, {
    headers: true
})
.on("record", function (data) {
    rawData.push(data);
})
.on("end", function (){




for(var i=0;i<rawData.length;i++) {
    coordinates = rawData[i].tripPolyline;
    coordinates2 = rawData[i].nextPolyline;
    coordinates = polyline.decode(coordinates);
    coordinates2 = polyline.decode(coordinates2);

    var feature = {
        type:"Feature",
        properties:{},
        geometry:{
          type:"LineString",
          coordinates:[]
        }
      }

    var feature2 = {
        type:"Feature",
        properties:{},
        geometry:{
          type:"LineString",
          coordinates:[]
        }
      }

    feature.properties.passengers = rawData[i].passengers;
    feature.properties.fare = rawData[i].fare;
    feature.properties.paymenttype = rawData[i].paymenttype;
    feature.properties.surcharge = rawData[i].surcharge;
    feature.properties.mtatax = rawData[i].tip;
    feature.properties.tolls = rawData[i].tolls;
    feature.properties.total = rawData[i].total;
    feature.properties.pickuptime = rawData[i].pickuptime;
    feature.properties.dropofftime = rawData[i].dropofftime;
    feature.properties.nextpickuptime = rawData[i].nextpickuptime;
    feature.properties.key = rawData[i].key;
    feature.properties.hasfare = true;

    feature2.properties.key = rawData[i].key;
    feature2.properties.hasfare = false;

   

    for(var j=0;j<coordinates.length;j++){
      console.log("Coordinates " + coordinates[j]);
      var coord = [coordinates[j][1],coordinates[j][0]]
      //create a feature
      feature.geometry.coordinates.push(coord);
    };

    for(var j=0;j<coordinates2.length;j++){
      console.log("Coordinates " + coordinates2[j]);
      var coord = [coordinates2[j][1],coordinates2[j][0]]
      //create a feature
      feature2.geometry.coordinates.push(coord);
    };




    featureCollection.features.push(feature);
    featureCollection.features.push(feature2);
}

});

      

var router = express.Router();


app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });


router.get('/trip', function(req, res, next) {
  res.json(featureCollection);
  //next();
});

app.use('/', router);




app.listen(port);
console.log('Listening on port ' + port);
