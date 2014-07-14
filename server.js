var fs = require('fs'),
express = require('express'),
app = express(), 
polyline = require('polyline'),
sqlite3 = require("sqlite3");



var port = process.env.PORT || 3000;    // set our port

var db = new sqlite3.Database('db');

var summary = [];


var featureCollection = {
  type:"FeatureCollection",
  features:[]
};

var router = express.Router();

app.use(express.static(__dirname + '/public'));

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

router.get('/trip', function(req, res, next) {

  var getMedallion = "select medallion from `trips` order by random() limit 1";

  db.serialize(function() {
db.each(getMedallion, function(err, result) {  //pick a medallion at random
  console.log("Getting trips for Medallion " + result.medallion);
  if (err) { console.log(err); }
getRows(result.medallion,function(rows){ //get all rows for our medallion
createGeojson(rows,function(geojson){ //convert polylines to geojson
  console.log("Sending Results");
res.json(geojson); //send the response
});
});  
});
});
});

app.use('/', router);

app.listen(port);
console.log('Listening on port ' + port);


//functions
function getRows(medallion,callback) {
  var statement = "select * from 'trips' where medallion = '" + medallion + "'";

  summary = [];

  db.serialize(function() {
    db.each(statement, function(err, result) {
      if (err) { console.log(err); }

      summary.push(result);
    },function(){
      console.log(summary.length + " rows found for this medallion");
      callback(summary);
    });
  });


}

function createGeojson(rawData,callback){

  featureCollection.features = [];

  for(var i=0;i<rawData.length;i++) {
    coordinates = rawData[i].trippolyline;
    coordinates2 = rawData[i].nextpolyline;
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

    feature.properties.medallion = rawData[i].medallion;
    feature.properties.passengers = rawData[i].passengers;
    feature.properties.fare = rawData[i].fare;
    feature.properties.paymenttype = rawData[i].paymenttype;
    feature.properties.surcharge = rawData[i].surcharge;
    feature.properties.mtatax = rawData[i].mtatax;
    feature.properties.tip = rawData[i].tip;
    feature.properties.tolls = rawData[i].tolls;
    feature.properties.total = rawData[i].total;
    feature.properties.pickuptime = rawData[i].pickuptime;
    feature.properties.dropofftime = rawData[i].dropofftime;
    feature.properties.nextpickuptime = rawData[i].nextpickuptime;
    feature.properties.key = rawData[i].key;
    feature.properties.hasfare = true;



    feature2.properties.pickuptime = rawData[i].dropofftime;
    feature2.properties.dropofftime = rawData[i].nextpickuptime;
    feature2.properties.key = rawData[i].key;
    feature2.properties.hasfare = false;



    for(var j=0;j<coordinates.length;j++){

      var coord = [coordinates[j][1],coordinates[j][0]]
//create a feature
feature.geometry.coordinates.push(coord);
};

for(var j=0;j<coordinates2.length;j++){

  var coord = [coordinates2[j][1],coordinates2[j][0]]
//create a feature
feature2.geometry.coordinates.push(coord);
};




featureCollection.features.push(feature);
featureCollection.features.push(feature2);
}

callback(featureCollection);

}
