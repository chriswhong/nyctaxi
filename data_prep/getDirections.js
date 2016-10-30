var fs = require('fs');
var csv = require('fast-csv');
var request = require("request")
var polyline = require('polyline');

var inputFile = process.argv[2];

var stream = fs.createReadStream(inputFile);
var outputArray=[];

var rawData = [];
var previousMedallion = null;

var taxiCount = -1;

var apiCallArray = [];
csv
.fromStream(stream, {
    headers: true
})
.on("record", function (data) {
    
    if (data.medallion != previousMedallion) {
        
        taxiCount++;
        rawData[taxiCount]=[];
        //console.log("i: " + taxiCount);    

    } 
    rawData[taxiCount].push(data);
    previousMedallion = data.medallion;

})
.on("end", function () {

    for (r in rawData){

    //console.log(rawData[r]);
    var apiBase = "https://maps.googleapis.com/maps/api/directions/json?",
    apiKeyStr = "&key=AIzaSyAOZmSuvn9Fzgx075mBoTaLthKi4w-7VCE"

    var numCalls = Math.ceil(rawData[r].length / 4);
    console.log(rawData[r][0].medallion);
    console.log('Number of API calls for taxi # '+ r +  ": " + numCalls + "(" +rawData[r].length + ")");


        

        //loop through each batch of trips, 4 full/empty cycles per call, ending the start of the 5th trip

        for (var i = 0; i < numCalls; i++) {
           
                console.log("I:"+i);
                console.log('Building api Call ' + i + ' for taxi ' + r);

                var waypoints = [];
            //loop through each trip
            for (var j = 0; j < 5; j++) {
                var key = j + (4 * i);
                var d = rawData[r][key];
                //console.log(d);
                console.log("key " + key);
                //console.log(j+(4*i));
                //if there aren't 4 full trips for this call, end early
                //this was not including the last trip, so
                //added a dummy trip (duplicate of last trip)
                //to the source CSV.. TODO: figure this out later.
                //console.log(key);
                if (rawData[r][(key + 1)] == null) {
                    j = 4;
                } else {
                    //each trip except the last should know when the pickup time of the next trip is
                    d.nextpickuptime = rawData[r][key + 1].pickuptime;
                };

                //console.log("D is " + d);
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

                //console.log(d);

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
            var apiCallObj = {
                "call":fullApiCall,
                "index":i,
                "trip":r
            }
            apiCallArray.push(apiCallObj);
            //apiCall(fullApiCall,i,r);
            
            
            }
        }
        console.log("ApicallArray Length: " + apiCallArray.length);
        
        callLoop(0);
    });


function callLoop(i) {
     
    var call = apiCallArray[i].call,
    index = apiCallArray[i].index,
    r = apiCallArray[i].trip;


            request({
                url: call,
                json: true
            }, function (error, response, body) {

                if (!error && response.statusCode === 200) {
                   
                    console.log(body);

                    console.log("Called " + call + " with index " + index )
                    console.log("Legs for this call: " + body.routes[0].legs.length) 
                    var legs = body.routes[0].legs;
                    //loop throught the legs
                    for (var j = 0; j < body.routes[0].legs.length/2; j++) {
                        var k = j + (4 * index);
                        console.log("Index: " + index);
                        console.log("Leg: " + j);
                        console.log("Key: " + k);
                        //console.log(legs[(j*2)]);
                        console.log(r);
                        var d = rawData[r][k];
                        d.key = k;
                        d.trippolyline = getPolyline(legs[(j*2)]);
                        if(legs[(j*2)+1]){
                            d.nextpolyline = getPolyline(legs[(j*2)+1]);
                        }
                        
                        outputArray.push(d);
                    }
                }
                      i++;
    if( i < apiCallArray.length ){
        setTimeout( callLoop(i), 1500 );
    } else {
        console.log("Hello");
        console.log(outputArray.length);
        writeToFile();
    }
            });
}


function writeToFile() {
     outputArray.sort(function(a,b){
                            if (a.key > b.key)
                                return 1;
                            if (a.key < b.key)
                                return -1;
                            return 0;
                        });

                        
                            var ws = fs.createWriteStream("output101.csv");
                            csv
                               .write(outputArray, {headers: true})
                               .pipe(ws);
                        
}


function apiCall(call,index,taxiNumber) {

      //make the API call!
           

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
