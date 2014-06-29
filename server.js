var fs = require('fs');
var express    = require('express');
var app        = express(); 
var csv = require('fast-csv');
var polyline = require('polyline');

var port = process.env.PORT || 3000; 		// set our port
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
		coordinates = polyline.decode(coordinates);
		console.log(i);
		console.log(coordinates);

		var feature = {
      	type:"Feature",
      	properties:{},
      	geometry:{
      		type:"LineString",
      		coordinates:[]
      	}
      }

    for(var j=0;j<coordinates.length;j++){
    	console.log("Coordinates " + coordinates[j]);
    	var coord = [coordinates[j][1],coordinates[j][0]]
      //create a feature
      feature.geometry.coordinates.push(coord);
    };
    featureCollection.features.push(feature);
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
	next();
});

app.use('/', router);




app.listen(port);
console.log('Listening on port ' + port);
