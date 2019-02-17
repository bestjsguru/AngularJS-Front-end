truedashApp.directive('tuOrdermap',   [function (){
        return {
            restrict: 'E',
            transclude: true,
            scope:{
              ordersList:'='
            },
            template:'<div id="map"></div>',
            replace:true,
            link: function (scope, elem, attrs){
              d3.select(window).on("resize", throttle);

              var zoom = d3.behavior.zoom()
                  .scaleExtent([1, 9])
                  .on("zoom", move);

              var sales = scope.ordersList.map(function(city) {return city[4];})

              var linearScale = d3.scale.linear().domain([d3.min(sales), d3.max(sales)]).range([3, 10]);

              var width  = elem[0].offsetWidth;
              var height = width / 2;

              var topo, projection, path, svg, g;

              var graticule = d3.geo.graticule();

              var tooltip = d3.select(elem[0]).append("div").attr("class", "tooltip hidden");

              setup(width,height);

              function setup(width, height){
                projection = d3.geo.mercator()
                  .translate([(width/2), (height/2)])
                  .scale( width / 2 / Math.PI)
                  /*.center([0, 5 ])
                  .rotate([-180,0])*/;

                path = d3.geo.path().projection(projection);

                svg = d3.select(elem[0]).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .call(zoom)
                    .on("click", click)
                    .append("g");

                g = svg.append("g");

              }

              d3.json("content/nonBower/world-topo-min.json", function(error, world) {

                var countries = topojson.feature(world, world.objects.countries).features;

                topo = countries;
                draw(topo);

              });

              function draw(topo) {

                svg.append("path")
                   .datum(graticule)
                   .attr("class", "graticule")
                   .attr("d", path);


                g.append("path")
                 .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
                 .attr("class", "equator")
                 .attr("d", path);


                var country = g.selectAll(".country").data(topo);

                country.enter().insert("path")
                    .attr("class", "country")
                    .attr("d", path)
                    .attr("id", function(d,i) { return d.id; })
                    .attr("title", function(d,i) { return d.properties.name; })
                    .style("fill", function(d, i) { return 'grey'; });

                //offsets for tooltips
                var offsetL = elem[0].offsetLeft + 20;
                var offsetT = elem[0].offsetTop + 10;

                g.selectAll("circle")
                 .data(scope.ordersList)
                 .enter()
                 .append("circle")
                 .attr("cx", function(d) {
                    return projection([d[2], d[3]])[0];
                 })
                 .attr("cy", function(d) {
                    return projection([d[2], d[3]])[1];
                 })
                 .attr("title", function(d){return d[0]})
                 .attr("r", function(d){return linearScale(d[4]);})
                 .style("fill", "red");
              }

              function redraw() {
                width = elem[0].offsetWidth;
                height = width / 2;
                d3.select('svg circle').remove();
                d3.select('svg').remove();
                setup(width, height);
                draw(topo);
              }


              function move() {
                g.attr("transform", "translate(" +
                  d3.event.translate.join(",") +  ")scale(" + d3.event.scale + ")");
                g.selectAll("circle").attr("r", function(d) {return linearScale(d[4]) / d3.event.scale});
                d3.selectAll(".country").style("stroke-width", 1.5 / d3.event.scale);

              }

              var throttleTimer;
              function throttle() {
                window.clearTimeout(throttleTimer);
                  throttleTimer = window.setTimeout(function() {
                    redraw();
                  }, 200);
              }

              //geo translation on mouse click in map
              function click() {
              }
        }
      }
    }]);
