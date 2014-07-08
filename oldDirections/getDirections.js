var fs = require('fs');
var csv = require('fast-csv');
var request = require("request")
var polyline = require('polyline');

var stream = fs.createReadStream("results-20140628-082717.csv");
var outputArray=[];

var rawData = [];



csv
.fromStream(stream, {
    headers: true
})
.on("record", function (data) {
    rawData.push(data);
})
.on("end", function () {

    var apiBase = "https://maps.googleapis.com/maps/api/directions/json?",
    apiKeyStr = "&key=AIzaSyAOZmSuvn9Fzgx075mBoTaLthKi4w-7VCE"

    var numCalls = Math.ceil(rawData.length / 4);
    console.log('Number of API calls: ' + numCalls);


        //generate api calls for 0-9, 9-18, 18-27 etc

        //loop through each batch of trips, 4 full/empty cycles per call, ending the start of the 5th trip
        for (var i = 0; i < numCalls; i++) {
            //for (var i = 0; i < 1; i++) {
                console.log('Api Call ' + i);

                var waypoints = [];
            //loop through each trip
            for (var j = 0; j < 5; j++) {
                var key = j + (4 * i);
                var d = rawData[key];
                console.log("key " + key);
                //console.log(j+(4*i));
                //if there aren't 4 full trips for this call, end early
                //this was not including the last trip, so
                //added a dummy trip (duplicate of last trip)
                //to the source CSV.. TODO: figure this out later.
                if (rawData[key + 1] == null) {
                    j = 4;
                } else {
                    //each trip except the last should know when the pickup time of the next trip is
                    d.nextpickuptime = rawData[key + 1].pickuptime;
                };


                //build the appropriate part of the api call based on which trip
                switch (j) {
                    case 0:
                    var origin = 'origin=' + d.pickupy + ',' + d.pickupx;
                    var waypoint = [d.dropoffy, d.dropoffx]
                    waypoints.push(waypoint);
                    break;

                    case 4:
                    var destination = '&destination=' + d.pickupy + ',' + d.pickupx;
                    break;

                    default:
                    waypoints.push([d.pickupy, d.pickupx]);
                    waypoints.push([d.dropoffy, d.dropoffx]);
                }

                console.log(d);

            } // loop through each trip
            //console.log(origin);
            var waypointStr = "&waypoints=";

            for (w in waypoints) {
                //console.log(waypoints[w]);
                waypointStr = waypointStr + waypoints[w][0] + ',' + waypoints[w][1];
                if (w != waypoints.length - 1) {
                    //console.log("hey!");
                    waypointStr = waypointStr + '|'
                };
            };
            //console.log(waypointStr);

            //console.log(destination);

            var fullApiCall = apiBase + origin + destination + waypointStr + apiKeyStr;
            console.log(fullApiCall);
            apiCall(fullApiCall,i);

        }



    });


function apiCall(call,index) {
      //make the API call!
            
            request({
                url: call,
                json: true
            }, function (error, response, body) {

                if (!error && response.statusCode === 200) {
                    console.log("Called " + call)
                    console.log("Legs for this call: " + body.routes[0].legs.length) 
                    var legs = body.routes[0].legs;

                    for (var j = 0; j < body.routes[0].legs.length/2; j++) {
                        var key = j + (4 * index);
                        console.log("Leg: " + j);
                        console.log("Key: " + key)
                        //console.log(legs[(j*2)]);
                        var d = rawData[key];
                        d.key = key;
                        d.trippolyline = getPolyline(legs[(j*2)]);
                        d.nextpolyline = getPolyline(legs[(j*2)+1]);

                        console.log(d);  //now write to csv?
                        outputArray.push(d);
                        
                        console.log(key);
                        console.log(rawData.length);


                        //sort outputArray by key first

                        outputArray.sort(function(a,b){
                            if (a.key > b.key)
                                return 1;
                            if (a.key < b.key)
                                return -1;
                            return 0;
                        });

                        if(key == rawData.length-2) {
                            var ws = fs.createWriteStream("output.csv");
                            csv
                               .write(outputArray, {headers: true})
                               .pipe(ws);
                        }
                      
                    }
                }
            });

            //api call
}

function getPolyline(leg){ //gets steps for leg, combines into one polyline
    //console.log(leg);
    var legPoints = [];
    for(s in leg.steps){
        var points = leg.steps[s].polyline.points;
        points = polyline.decode(points);
        for(p in points){
            legPoints.push(points[p]);
        }
    }

    legPolyline = polyline.encode(legPoints);
    return legPolyline;


}
