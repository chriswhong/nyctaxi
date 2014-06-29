queue()
.defer(d3.xml, "wiggle.svg", "image/svg+xml")
.await(ready);

function ready(error, xml) {

  //Adding our svg file to HTML document
  var importedNode = document.importNode(xml.documentElement, true);
  d3.select("#pathAnimation").node().appendChild(importedNode);

  var svg = d3.select("svg");

  var path = svg.select("path#wiggle").call(transition);
  var startPoint = pathStartPoint(path);

  var marker = svg.append("circle");
  marker.attr("r", 7)
    .attr("id", "marker")
    .attr("transform", "translate(" + startPoint + ")");

  //Get path start point for placing marker
  function pathStartPoint(path) {
    var d = path.attr("d"),
    dsplitted = d.split(" ");
    return dsplitted[1];
  }

  function transition(path) {
    path.transition()
        .duration(7500)
        .attrTween("stroke-dasharray", tweenDash)
        .each("end", function() { d3.select(this).call(transition); });// infinite loop
  }

  function tweenDash() {
    var l = path.node().getTotalLength();
    var i = d3.interpolateString("0," + l, l + "," + l); // interpolation of stroke-dasharray style attr
    return function(t) {
      var marker = d3.select("#marker");
      var p = path.node().getPointAtLength(t * l);
      marker.attr("transform", "translate(" + p.x + "," + p.y + ")");//move marker
      return i(t);
    }
  }
}