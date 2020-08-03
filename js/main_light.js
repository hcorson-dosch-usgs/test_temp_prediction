(function(){
    
    // psuedo-global variables

    // variables for data join
    var flowArray = ['avg_ann_flow']

    // initial attribute
    var expressed = 'Space';

    // begin script when window loads
    window.onload = setMap();

    // timestep variable
    var timestep = 'year'

    // selection list for interaction
    var select_list = ['Space', 'Time']

    // create spatial data array
    var dataArraySpace = []
        
    // create temporal data array
    var dataArrayTime = []

    // margins, width and height for matrix chart
    var matrix_margin = {top: 20, right: 15, bottom: 15, left: 35},
        matrix_width = 500 - matrix_margin.left - matrix_margin.right,
        matrix_height = window.innerHeight - matrix_margin.top - matrix_margin.bottom;

    // *********************************************************************//
    function setMap(){
        // map frame dimensions
        var map_width = window.innerWidth * 0.4,
            map_height = window.innerHeight;
        
        //create new svg container for the map
        var map = d3.select("#drb_map")
            .append("svg")
            .attr("class", "map")
            .attr("width", map_width)
            .attr("height", map_height);

        //create Albers equal area conic projection centered on DRB
        var projection = d3.geoAlbers()
            .center([0, 40.558894445])
            .rotate([75.363333335, 0, 0])
            .parallels([39.9352537033, 41.1825351867])
            .scale(map_height*15)
            .translate([map_width / 2, map_height / 2]);


        var path = d3.geoPath()
            .projection(projection);
        
        // parallelize asynchronous data loading d3.json("data/Segments_subset_4per_smooth.json"),
        var promises = [d3.csv("data/segment_maflow.csv"),
                        // d3.csv("data/segment_year_counts_8019.csv"),
                        // d3.csv("data/segment_year_counts_order13_8019.csv"),
                        // d3.csv("data/segment_year_counts_order47_8019.csv"),
                        d3.csv("data/matrix_annual_obs.csv"), /* matrix_segment_yearmonth_counts */
                        d3.csv("data/obs_annual_count.csv"),
                        d3.json("data/segment_geojson.json"),
                        d3.json("data/observed_reach_station_coords.json"),
                        d3.json("data/NHDWaterbody_DelawareBay_pt6per_smooth.json")
                    ];
        Promise.all(promises).then(callback);

        // *********************************************************************//
        // Place callback function within setMap to make use of local variables
        function callback(data) {
            csv_flow = data[0];
            // csv_streamgraph = data[1];
            // csv_stackedarea = data[2];
            // csv_stackedarea2 = data[3];
            csv_matrix = data[1];
            csv_annual_count = data[2];
            json_segments = data[3];
            json_obs_stations = data[4];
            json_bay = data[5];

            console.log(map)
            console.log(csv_matrix)

            // translate topojsons
            var segments = json_segments.features; /* topojson.feature(json_segments, json_segments.objects.Segments_subset_4per_smooth).features */
            var stations = json_obs_stations.features;
            var bay = topojson.feature(json_bay, json_bay.objects.NHDWaterbody_DelawareBay_pt6per_smooth);

            // join csv data to geojson segments
            segments = joinData(segments, csv_flow);

            // check the results
            console.log('segments:')
            console.log(segments);
            console.log(stations);

            // stroke width scale
            var widthScale = makeWidthScale(csv_flow);

            // stroke color scale
            var colorScale = makeColorScale(segments);

            // add DRB segments to the map
            setSegments(segments, stations, bay, map, path, widthScale, colorScale);

            // create streamgraph chart
            // createStreamgraphChart(csv_streamgraph);

            // create stacked area chart
            // createStackedAreaChart(csv_stackedarea, csv_stackedarea2);

            // populate array of segments
            for (var i=0; i<segments.length; i++){
                var val = segments[i]['seg_id_nat'];
                dataArraySpace.push(val);
            };
            // populate array of times
            for (var i=0; i<csv_annual_count.length; i++){
                var val = csv_annual_count[i]['year'];
                dataArrayTime.push(val);
            };

            // create matrix
            createMatrix(csv_matrix, csv_annual_count, segments, timestep);

            // create dropdown
            createDropdown(select_list, csv_matrix, csv_annual_count, segments)

        };
    };

    // *********************************************************************//
    function joinData(segments, csv_flow){
        // loop through csv to assign each set of csv attribute values to a geojson polyline
        for (var i=0; i<csv_flow.length; i++){
            // define the current segment
            var csvSegment = csv_flow[i];
            // define the csv attribute field to use as the key
            var csvKey = csvSegment.seg_id_nat;

            // Loop through the geojson segments
            for (var a=0; a<segments.length; a++){
                // Pull the properties for the current geojson segment
                var geojsonProps = segments[a].properties;
                // set the geojson properties field to use as the key 
                var geojsonKey = segments[a].seg_id_nat; /* geojsonProps.seg_id_nat */
                // where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){
                    // assign all attributes and values
                    flowArray.forEach(function(attr){
                        // get csv attribute value, converting it to a float
                        var val = parseFloat(csvSegment[attr]);
                        // assign attribute and value to geojson properties
                        geojsonProps[attr] = val;
                    });
                };
            };
            
        };
        return segments;
    };


    // *********************************************************************//
    function makeWidthScale(data){
      
        // // graduated scale
        // set width classes
        var widthClasses = [
            0.6,
            0.9,
            1.2,
            1.4,
            1.7,
            2,
            2.3,
            2.6,
            3,
            3.5,
        ];

        // // graduated scale
        // create width scale generator for natural breaks classification
        var widthScale = d3.scaleThreshold()
            .range(widthClasses);
        
        // // BOTH METHODS
        // build array of all values of flow
        var domainArrayFlow = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i]['avg_ann_flow']);
            domainArrayFlow.push(val);
        };

        // // // linear scale //
        // var dataMax = Math.round(Math.max(...domainArrayFlow));

        // // // linear scale //
        // var widthScale = d3.scaleLinear()
        //     // set range of possible output values
        //     .range([0.3,3])
        //     // define range of input values
        //     .domain([0,dataMax]);

        // // graduated scale
        // cluster data using ckmeans clustering algoritm to create natural breaks
        var clusters = ss.ckmeans(domainArrayFlow, 10);
        console.log(clusters);

        // // graduated scale
        // reset domain array to cluster minimumns
        domainArrayFlow = clusters.map(function(d){
            return d3.min(d);
        });

        // // graduated scale
        // remove first value from domain array to create class breakpoints
        domainArrayFlow.shift();

        // // graduated scale
        // assign array of last 9 cluster minimums as domain
        widthScale.domain(domainArrayFlow);

        // // BOTH METHODS
        return widthScale;
    };

    // *********************************************************************//
    function makeColorScale(segments){
        // // graduated scale
        // // set color classes
        // var colorClasses = [
        //     '#f1eef6',
        //     '#bdc9e1',
        //     '#74a9cf',
        //     '#2b8cbe',
        //     '#045a8d'
        // ];



        // // graduated scale
        // create width scale generator for natural breaks classification
        // var colorScale = d3.scaleThreshold()
        //     .range(colorClasses);

        // build array of all values of the total count attribute
        var domainArrayColor = [];
        for (var i=0; i<segments.length; i++){
            var value = parseFloat(segments[i]['properties']['total_count']);
            if (value) {
                domainArrayColor.push(value);
            } else {
                continue
            } 
        };

        // // sequential color scale
        var obsMax = Math.round(Math.max(...domainArrayColor));

        console.log(domainArrayColor)

        // // sequential color scale
        var colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateOranges)
            .domain([0,obsMax])

        // // graduated scale
        // cluster data using ckmeans clustering algoritm to create natural breaks
        // var clusters = ss.ckmeans(domainArrayColor, 5);
        // console.log(clusters);

        // // // graduated scale
        // // reset domain array to cluster minimumns
        // domainArrayColor = clusters.map(function(d){
        //     return d3.min(d);
        // });

        // // // graduated scale
        // // remove first value from domain array to create class breakpoints
        // domainArrayColor.shift();

        // // // graduated scale
        // // assign array of last 4 cluster minimums as domain
        // colorScale.domain(domainArrayColor);

        // 
        return colorScale;
    };

    // *********************************************************************//
    function setSegments(segments, stations, bay, map, path, widthScale, colorScale){
            
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "delaware_bay")
            .attr("d", path);

        // set tooltip
        var tooltip = d3.select("#drb_map")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            // .style("background-color", "white")
            // .style("border", "solid")
            // .style("border-width", "2px")
            // .style("border-radius", "5px")
            .style("padding", "5px")


        // add drb segments to map
        var drb_segments = map.selectAll(".river_segments")
            // bind segments to each element to be created
            .data(segments)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // assign class for styling
            .attr("class", function(d){
                var seg_class = 'river_segments seg'
                seg_class += d.seg_id_nat
                for (key in d.properties.year_count) {
                    if (d.properties.year_count[key]) {
                        seg_class += " year" + key
                    }
                }
                return seg_class

                // return "river_segments seg" + d.seg_id_nat; /* d.properties.seg_id_nat */
            })
            // add filter
            // .attr("filter", "url(#shadow1)")
            // project segments
            .attr("d", path)
            // add stroke width based on widthScale function
            .style("stroke-width", function(d){
                var value = d.properties['avg_ann_flow'];
                if (value){
                    return widthScale(value);
                } else {
                    return "#ccc";
                }
            })
            .style("fill", "None")
            .on("mouseover", function(d) {
                mouseover(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial(d, tooltip, position);
            })
            .on("mouseleave", function(d) {
                mouseleave(d, tooltip);
            });
            // // set color based on colorScale function
            // .style("stroke", function(d){
            //     var value = d.properties['total_count'];
            //     if(value){
            //       return colorScale(value);
            //     } else {
            //       return "#ccc";
            //     };
            // });
        
        // // add drb segments to map
        // var drb_stations = map.selectAll(".obs_stations")
        //     // bind segments to each element to be created
        //     .data(stations)
        //     // create an element for each datum
        //     .enter()
        //     // append each element to the svg as a circle element
        //     .append("path")
        //     // assign class for styling
        //     .attr("class", function(d){
        //         return "obs_stations station" + d.id
        //     })
        //     // project points
        //     .attr("d", path)
        //     .attr("radius", 6)
        //     .style("fill", "Red")
        //     .style("stroke", "None")
            // .on("mouseover", function(d) {
            //     mouseover(d, tooltip);
            // })
            // .on("mousemove", function(d) {
            //     position = d3.mouse(this);
            //     mousemoveSegSpatial(d, tooltip, position);
            // })
            // .on("mouseleave", function(d) {
            //     mouseleave(d, tooltip);
            // });
            // // set color based on colorScale function
            // .style("stroke", function(d){
            //     var value = d.properties['total_count'];
            //     if(value){
            //       return colorScale(value);
            //     } else {
            //       return "#ccc";
            //     };
            // });
    };

    // *********************************************************************//
    function createMatrix(csv_matrix, csv_annual_count, segments, timestep){
        console.log("createMatrix:")
        console.log(segments)
        // var margin = {top: 20, right: 15, bottom: 15, left: 55},
        //     width = 500 - margin.left - margin.right,
        //     height = window.innerHeight - margin.top - margin.bottom;
        

        // append the svg object ot the body of the page
        var svgMatrix = d3.select("#matrixChart")
            .append("svg")
                .attr("width", matrix_width + matrix_margin.left + matrix_margin.right)
                .attr("height", matrix_height + matrix_margin.top + matrix_margin.bottom)
                .attr("class", "matrix")
            .append("g")
                .attr("class", "transformedMatrix")
                .attr("transform",
                    "translate(" + matrix_margin.left + "," + matrix_margin.top + ")");

        // read in data
        var myGroups = d3.map(csv_matrix, function(d){return d[timestep];}).keys() /* d.yearmonth if temporal interval = yearmonth */
        var myVars = d3.map(csv_matrix, function(d){return d.seg_id_nat;}).keys() /* d.seg_id_nat */

        // build array of all values of observation counts
        var domainArrayTemporalCounts = [];
        for (var i=0; i<csv_matrix.length; i++){
            var val = parseFloat(csv_matrix[i]['obs_count']);
            // if (val){
            domainArrayTemporalCounts.push(val);
            // } else {
                // continue
            // }
        };

        var temporalCountMax = Math.round(Math.max(...domainArrayTemporalCounts));
        console.log(temporalCountMax)

        // var temporalCountMin = Math.round(Math.min(...domainArrayTemporalCounts));
        // console.log(temporalCountMin)

        // build x scales
        var x = d3.scaleBand()
            .range([0,matrix_width])
            .domain(myGroups)
            .padding(0.05);

        // build y scales
        var y = d3.scaleBand()
            .range([matrix_height, 0])
            .domain(myVars)
            .padding(0.05);

        // color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateViridis) /* interpolatePlasma */
            .domain([temporalCountMax,1]) // if INVERTING color scale
            // .domain([1, temporalCountMax]) // if NOT INVERTING color scale
              
        // add the squares
        var matrixSquares = svgMatrix.selectAll('matrixSqs')
            .data(csv_matrix, function(d) {
                if (d.total_obs > 0) {
                    return d[timestep] +':'+ d.seg_id_nat; /* d.seg_id_nat */
                }
            }) 
            .enter()
            .filter(function (d){
                return d.obs_count > 0
            })
            .append("rect")
            .attr("x", function (d){
                return x(d.year)
            })
            .attr("y", function(d) { 
                return y(d.seg_id_nat)
            })
            .attr("rx", 1)
            .attr("ry", 1 )
            .attr("width", x.bandwidth())
            .attr("x", function(d) {
               return x(d[timestep])
            })
            .attr("height", y.bandwidth())
            .attr("class", function(d) { 
                return 'cell segment' + d.seg_id_nat + ' timestep' + d[timestep]
            })
            .style("fill", function(d) {
                return myColor(d.obs_count);
            })
            .style("stroke-width", 0)
            .style("stroke", "None") //"None"
            // .style("stroke", function(d){
            //     return myColor(d.obs_count);
            // })
            .style("opacity", 1);

        // add the rectangles
        createMatrixRectangles(csv_matrix, csv_annual_count, segments)

        // draw x axes
        svgMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + matrix_height + ")")
            .call(d3.axisBottom(x).tickSize(0).tickValues(['1980', '1990', '2000', '2010', '2019'])) /* '1980-01', '1990-01', '2000-01', '2010-01', '2019-01' */
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .call(d3.axisTop(x).tickSize(0))
            // .select(".domain").remove()

        // draw y axes
        svgMatrix.append("g")
            .style("font-size", 0)
            .call(d3.axisLeft(y).tickSize(0))
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + matrix_width + "," + 0 + ")")
            .call(d3.axisRight(y).tickSize(0))

    };

    // *********************************************************************//
    function createMatrixRectangles(csv_matrix, csv_annual_count, segments) {
        console.log("createMatrixRectangles:")
        console.log(segments)
        
        
        console.log(expressed)

        // create matrix recangles variable
        var transformedMatrix = d3.select(".transformedMatrix")
        // var matrixRectangles = svgMatrix.selectAll('matrixRect')

        // read in data
        var myGroups = d3.map(csv_matrix, function(d){return d[timestep];}).keys() /* d.yearmonth if temporal interval = yearmonth */
        var myVars = d3.map(csv_matrix, function(d){return d.seg_id_nat;}).keys() /* d.seg_id_nat */

        // var temporalCountMin = Math.round(Math.min(...domainArrayTemporalCounts));
        // console.log(temporalCountMin)

        // build x scales
        var xscale = d3.scaleBand()
            .range([0,matrix_width])
            .domain(myGroups)
            .padding(0.05);

        // build y scales
        var yscale = d3.scaleBand()
            .range([matrix_height, 0])
            .domain(myVars)
            .padding(0.05);

        // create a tooltip
        var tooltip = d3.select("#matrixChart")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            // .style("background-color", "white")
            // .style("border", "solid")
            // .style("border-width", "2px")
            // .style("border-radius", "5px")
            .style("padding", "5px")

        // revised build of spatial rectangles
        var matrixSpatialRectangles = transformedMatrix.selectAll('.matrixSpatialRect')           
            .data(segments)
            .enter()
            .append("rect")
            .attr("x", xscale("1980")) /* d.yearmonth if temporal interval = yearmonth */
            .attr("y", function(d) { return yscale(d.seg_id_nat) }) /* d.seg_id_nat */
            .attr("rx", 1)
            .attr("ry", 1)
            .attr("width", matrix_width)
            .attr("height", yscale.bandwidth() )
            .attr("class", function(d) { 
                return 'matrixSpatialRect seg' + d.seg_id_nat;
            })
            .style("fill", function(d) { 
                if (d.properties.total_count > 0) {
                    return "#ffffff";                   
                } else {
                    return "#ffffff";  /*"None"*/
                }
            })
            .style("stroke-width", 1)
            .style("stroke", "#ffffff")
            .style("opacity", function(d) {
                if (d.properties.total_count > 0) {
                    return 0;                   
                } else {
                    return 1; 
                }
            })
            // .on("click", function(d){
            //     clickRectSpatial(d, tooltip);
            // })
            .on("mouseover", function(d) {
                mouseover(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect(d, tooltip, position);
            })
            .on("mouseleave", function(d) {
                mouseleave(d, tooltip);
            })

        // revised build of temporal rectangles
        var matrixTemporalRectangles = transformedMatrix.selectAll('.matrixTemporalRect')
            .data(csv_annual_count)
            .enter()
            .append("rect")
            .attr("x", function(d){
                return xscale(d[timestep])
            }) 
            .attr("y", 0) /* function(d) { return yscale(0) } */
            .attr("rx", 1)
            .attr("ry", 1)
            .attr("width", xscale.bandwidth())
            .attr("height", matrix_height)
            .attr("class", function(d) { 
                return 'matrixTemporalRect time' + d.year;
            })
            .style("fill", "#ffffff")
            .style("stroke-width", 1)
            .style("stroke", "#ffffff")
            .style("opacity", 0)
            .on("mouseover", function(d) {
                mouseover(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect(d, tooltip, position);
            })
            .on("mouseleave", function(d) {
                mouseleave(d, tooltip);
            })
    };

    // *********************************************************************//
    function mousemoveRect(data, tooltip, position) {
        if (expressed == 'Space') {
            // console.log(data.properties.total_count)
            if (data.properties) {
                yoffset = position[1]+5
                tooltip
                    .html(data.properties.total_count + "<p>obs.")
                    // .html("Segment " + data.seg_id_nat)
                    .style("left", 10 + "px")
                    .style("top", yoffset + "px")
                    .style("text-align", "right");
            }

            // yoffset = position[1]+7
            // tooltip
            //     .html("Segment " + data.seg_id_nat)
            //     .style("left", -12 + "px")
            //     .style("top", yoffset + "px");

        } else if (expressed = 'Time') {
            if (data.total_annual_count) {
                xoffset = position[0]+10
                yoffset = position[1]-5
                tooltip
                    .html(data.year)
                    .style("left", xoffset + "px")
                    .style("top", yoffset + "px");
            }
            // console.log(data.properties.total_count)

            // xoffset = position[0]+25
            // yoffset = position[1]-5
            // tooltip
            //     .html(data.year)
            //     .style("left", xoffset + "px")
            //     .style("top", yoffset + "px");
        }
    };

    // *********************************************************************//
    function mousemoveSegSpatial(data, tooltip, position) {
        if (expressed == 'Space') {
            tooltip
                .html(data.properties.total_count + "<p>obs.")
                // .html("Segment " + data.seg_id_nat)
                .style("left", position[0]+35 + "px")
                .style("top", position[1]-25 + "px")
                .style("text-align", "left"); /* position[1]+110 */
        } //else if (expressed = 'Time') 
    };
    
    // *********************************************************************//
    function mouseover(data, tooltip) {
        if (expressed == 'Space') {
            console.log("spatial mouseover data: ")
            console.log(data)

            d3.selectAll(".matrixTemporalRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.properties) {
                tooltip
                    .style("opacity", 1);
                // d3.selectAll(".matrixTemporalRect")
                //     .style("opacity", 0)   
                d3.selectAll(".matrixSpatialRect")
                    .style("opacity", 0.8)
                    .style("stroke-width", 0);
                d3.selectAll(".matrixSpatialRect.seg" + data.seg_id_nat)
                    // .style("stroke", "red")
                    .style("stroke-width", 0.5)
                    // .style("fill", "#ffffff")
                    .style("opacity", function(data) {
                        if (data.properties.total_count > 0) { //properties.total_count
                            return 0;                   
                        } else {
                            return 1;
                        }
                    })
                    .style("stroke", function(data) {
                        if (data.properties.total_count > 0) {
                            return "None";                   
                        } else {
                            return "red";
                        }
                    })
                    .raise();
                d3.selectAll(".delaware_bay")
                    .style("fill", "#bdc8db")
                d3.selectAll(".river_segments")
                    .style("stroke", "#bdc8db")
                d3.selectAll(".river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "red")
                    .attr("opacity", 1)
                    .attr("filter", "url(#shadow1)")
                    .raise()

            } else {
                console.log("spatial mouseover, temporal data: ")
                console.log(data)
            }

            // tooltip
            //     .style("opacity", 1);
            // // d3.selectAll(".matrixTemporalRect")
            // //     .style("opacity", 0)   
            // d3.selectAll(".matrixSpatialRect")
            //     .style("opacity", 0.6)
            //     .style("stroke-width", 1);
            // d3.selectAll(".matrixSpatialRect.seg" + data.seg_id_nat)
            //     // .style("stroke", "red")
            //     .style("stroke-width", 0.5)
            //     // .style("fill", "#ffffff")
            //     .style("opacity", function(data) {
            //         if (data.properties.total_count > 0) { //properties.total_count
            //             return 0;                   
            //         } else {
            //             return 1;
            //         }
            //     })
            //     .style("stroke", function(data) {
            //         if (data.properties.total_count > 0) {
            //             return "None";                   
            //         } else {
            //             return "red";
            //         }
            //     });
            // d3.selectAll(".delaware_bay")
            //     .style("fill", "#bdc8db")
            // d3.selectAll(".river_segments")
            //     .style("stroke", "#bdc8db")
            // d3.selectAll(".river_segments.seg" + data.seg_id_nat)
            //     .style("stroke", "red")
            //     .attr("opacity", 1)
            //     .attr("filter", "url(#shadow1)")
            //     .raise()

        } else if (expressed = 'Time') {
            console.log("temporal mouseover data: ")
            console.log(data)

            d3.selectAll(".matrixSpatialRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.total_annual_count) {
                tooltip
                    .style("opacity", 1);
                // d3.selectAll(".cell")
                //     .style("opacity", 0.6)
                // d3.selectAll(".cell.timestep" + data.year)
                // d3.selectAll(".matrixSpatialRect")
                d3.selectAll(".matrixTemporalRect")
                    .style("opacity", 0.8)
                    .style("stroke-width", 0.5);
                d3.selectAll(".matrixTemporalRect.time" + data.year)
                    .style("stroke-width", 0.5)
                    .style("opacity", 0)
                d3.selectAll(".delaware_bay")
                    .style("fill", "#bdc8db")
                d3.selectAll(".river_segments")
                    .style("stroke", "#bdc8db")
                d3.selectAll(".river_segments.year" + data.year)
                    .style("stroke", "red")
                    .attr("opacity", 1)
                    // .attr("filter", "url(#shadow1)")
                    .raise()


            } else {
                console.log("temporal mouseover, spatial data: ")
                console.log(data)
            }

            // tooltip
            //     .style("opacity", 1);
            // // d3.selectAll(".cell")
            // //     .style("opacity", 0.6)
            // // d3.selectAll(".cell.timestep" + data.year)
            // // d3.selectAll(".matrixSpatialRect")
            // d3.selectAll(".matrixTemporalRect")
            //     .style("opacity", 0.6)
            //     .style("stroke-width", 0.5);
            // d3.selectAll(".matrixTemporalRect" + data.year)
            //     .style("stroke-width", 0.5)
            //     .style("opacity", 0)
            // d3.selectAll(".delaware_bay")
            //     .style("fill", "#bdc8db")
            // d3.selectAll(".river_segments")
            //     .style("stroke", "#bdc8db")
        }

            
    };

    // *********************************************************************//
    function mouseleave(data, tooltip) {
        if (expressed == 'Space') {
            console.log("spatial mouseleave data: ")
            console.log(data)

            d3.selectAll(".matrixTemporalRect")
                .style("fill", "#ffffff")

            if (data.properties) {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".matrixSpatialRect") /* .matrixRect.seg" + data.seg_id_nat */
                    .style("stroke", "#ffffff")
                    .style("fill", "#ffffff")
                    .style("stroke-width", 1)
                    .style("opacity", 0)
                d3.selectAll(".matrixSpatialRect" + data.seg_id_nat)
                    .lower()
                d3.selectAll(".delaware_bay")
                    .style("fill", "#6079a3")
                d3.selectAll(".river_segments")
                    .style("stroke", "#6079a3")
                d3.selectAll(".river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                    .attr("filter","None")
                    .lower()
                d3.selectAll("g")
                    .raise()
            } else {
               console.log("spatial mouseleave, temporal data: ")
               console.log(data)
            }

            // tooltip
            //     .style("opacity", 0)
            // d3.selectAll(".matrixSpatialRect") /* .matrixRect.seg" + data.seg_id_nat */
            //     .style("stroke", "None")
            //     .style("fill", "#ffffff")
            //     .style("stroke-width", 0.5)
            //     .style("opacity", 0)
            //     // .style("opacity", function(data) {
            //     //     if (data.properties.total_count > 0) {
            //     //         return 0;                   
            //     //     } else {
            //     //         return 1;
            //     //     }
            //     // })
            //     // .transition()
            //     // .delay(20)
            //     // .duration(500)
            // d3.selectAll(".delaware_bay")
            //     .style("fill", "#6079a3")
            // d3.selectAll(".river_segments")
            //     .style("stroke", "#6079a3")
            // d3.selectAll(".river_segments.seg" + data.seg_id_nat)
            //     .style("stroke", "#6079a3")
            //     .attr("opacity", 1)
            //     .attr("filter","None")

        } else if (expressed = 'Time') {
            console.log("temporal mouseleave data: ")
            console.log(data)

            d3.selectAll(".matrixSpatialRect")
                .style("fill", "#ffffff")

            if (data.total_annual_count)  {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".matrixTemporalRect") 
                    .style("stroke", "#ffffff")
                    .style("fill", "#ffffff")
                    .style("stroke-width", 1)
                    .style("opacity", 0)
                d3.selectAll(".delaware_bay")
                    .style("fill", "#6079a3")
                d3.selectAll(".river_segments")
                    .style("stroke", "#6079a3")
                    // .attr("opacity", 1)
                    // .attr("filter","None")
                d3.selectAll(".river_segments.year" + data.year)
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                    // .attr("filter","None")
                    .lower()
                
            } else {
                console.log("temporal mouseleave, spatial data:")
                console.log(data)
            }

            // tooltip
            //     .style("opacity", 0)
            // d3.selectAll(".matrixTemporalRect") 
            //     .style("stroke", "None")
            //     .style("fill", "#ffffff")
            //     .style("stroke-width", 0.5)
            //     .style("opacity", 0)
            // d3.selectAll(".delaware_bay")
            //     .style("fill", "#6079a3")
            // d3.selectAll(".river_segments")
            //     .style("stroke", "#6079a3")
            // d3.selectAll(".river_segments.seg" + data.seg_id_nat)
            //     .style("stroke", "#6079a3")
            //     .attr("opacity", 1)
            //     .attr("filter","None")
        }

    };

    // *********************************************************************//
    // function mouseleaveTemporal(data, tooltip) {

    // };

    // *********************************************************************//
    // function clickRectSpatial(data, tooltip) {
    //     d3.selectAll(".matrixRect.seg" + data.seg_id_nat)
    //         .style("stroke", "red")
    //         .style("fill", "None")
    //         .style("opacity", 1);
    //     d3.selectAll(".river_segments.seg" + data.seg_id_nat)
    //         .style("stroke", "red")
    //         .attr("filter", "url(#shadow1)")
    // };

    // *********************************************************************//
    // fuction to create a dropdown menu for attribute selection
    function createDropdown(select_list, csv_matrix, csv_annual_count, segments){
        console.log("createDropdown:")
        console.log(segments)
        // add select element
        var dropdown = d3.select("#matrixChart")
            // append the select element to the body
            .append("select")
            // add class for styling
            .attr("class", "dropdown")
            // add event listener
            .on("change", function(){
                // call listener handler function
                changeInteractionDimension(this.value, csv_matrix, csv_annual_count, segments)
            });

        // add initial option
        var titleOption = dropdown.append("option")
            // create a title option element with no value attribute
            .attr("class", "titleOption")
            // ensure that users cannot select it
            .attr("disabled", "true")
            // add an affordance to let users know they can interact with the dropdown menu
            .text("Interaction Dimension: " + expressed);

        // add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            // bind data to the elements to be created
            .data(select_list)
            // create an element for each datum
            .enter()
            // append to the option
            .append("option")
            // set value of attributes
            .attr("value", function(d){ return d })
            // set text element
            .text(function(d){ return d });
    };

    // *********************************************************************//
    function changeInteractionDimension(dimension, csv_matrix, csv_annual_count, segments){
        console.log("changeInteractionDimension:")
        console.log(segments)


        // reset expressed dimension based on selected dimension
        expressed = dimension;

        // createMatrixRectangles(csv_matrix, csv_annual_count, segments)

    };


    // *********************************************************************//
    // function createStreamgraphChart(data) {
    //     // set dimensions of graph
    //     var margin = {
    //         top: 20,
    //         right: 30,
    //         bottom: 30,
    //         left: 60
    //     },
    //     width = 460 - margin.left - margin.right,
    //     height = 400 - margin.top - margin.bottom;

    //     // append svg object to the body of the page
    //     var svg = d3.select("body")
    //         .append("svg")
    //             .attr("width", width + margin.left + margin.right)
    //             .attr("height", height + margin.top + margin.bottom)
    //         .append("g")
    //             .attr("transform",
    //                 "translate(" + margin.left + "," + margin.top + ")");

    //     // list of groups = header of the csv file
    //     var keys = data.columns.slice(1)

    //     // Add X axis
    //     var x = d3.scaleLinear()
    //         .domain(d3.extent(data, function(d) { return d.year; }))
    //         .range([0, width]);
        
    //     // draw x axis
    //     svg.append("g")
    //         .attr("transform", "translate(" + 0 + "," + height*0.85 + ")")
    //         .call(d3.axisBottom(x).tickSize(-height*0.7).tickValues([1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2019]).tickFormat(d3.format("d"))) /*             .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"))); */
    //         // remove axis line (but not ticks)
    //         .select(".domain").remove();
        
    //     svg.selectAll(".tick line").attr("stroke", "#b8b8b8")

    //     // // Add X axis label:
    //     // svg.append("text")
    //     //     .attr("text-anchor", "end")
    //     //     .attr("x", width)
    //     //     .attr("y", height-20 )
    //     //     .text("Time (year)");

    //     // Add Y axis
    //     var y = d3.scaleLinear()
    //         .domain([-15000, 15000])
    //         .range([height,0]);
        
    //     // draw y axis
    //     // svg.append("g")
    //     //     .call(d3.axisLeft(y));
        
    //     // color palette
    //     var color = d3.scaleOrdinal()
    //         .domain(keys)
    //         .range(d3.schemeTableau10);
        
    //     // stack the data
    //     var stackedData = d3.stack()
    //         .offset(d3.stackOffsetSilhouette)
    //         .keys(keys)
    //         (data)

    //     // create tooltip
    //     var Tooltip = svg
    //         .append("text")
    //         .attr("x", 10)
    //         .attr("y", 70)
    //         .style("opacity", 0)
    //         .style("font-size", 15)

    //     // Three function that changes the tooltip when the user hover/move/leave a cell
    //     var mouseover = function(d) {
    //         Tooltip.style("opacity", 1)
    //         d3.selectAll(".myArea").style("opacity", 0.2)
    //         d3.select(this)
    //             .style("stroke", "black")
    //             .style("stroke-width", 0.3)
    //             .style("opacity", 1)
    //     }

    //     var mousemove = function(d, i) {
    //         grp = keys[i]
    //         Tooltip.text(Math.round(grp))
    //     }

    //     var mouseleave = function(d) {
    //         Tooltip.style("opacity", 0)
    //         d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
    //     }
        
    //     var area = d3.area()
    //         .x(function(d, i) { return x(d.data.year); })
    //         .y0(function(d) { return y(d[0]); })
    //         .y1(function(d) { return y(d[1]); })

    //     // show the areas
    //     svg
    //         .selectAll("mylayers")
    //         .data(stackedData)
    //         .enter()
    //         .append("path")
    //             .attr("class", "myArea")
    //             .style('fill', function(d) { return color(d.key); })
    //             .attr("d", area)
    //             .on("mouseover", mouseover)
    //             .on("mousemove", mousemove)
    //             .on("mouseleave", mouseleave)
    // };

    // *********************************************************************//
    // function createStackedAreaChart(data, data2) {
    //     // set dimensions of graph
    //     var margin = {
    //         top: 20,
    //         right: 30,
    //         bottom: 30,
    //         left: 60
    //     },
    //     width = 460 - margin.left - margin.right,
    //     height = 400 - margin.top - margin.bottom;

    //     // append svg object to the body of the page
    //     var svg = d3.select("body")
    //         .append("svg")
    //             .attr("width", width + margin.left + margin.right)
    //             .attr("height", height + margin.top + margin.bottom)
    //         .append("g")
    //             .attr("transform",
    //                 "translate(" + margin.left + "," + margin.top + ")");

    //     // list of groups = header of the csv file
    //     // for lower order streams
    //     var keys = data.columns.slice(1)
    //     // for higher order streams
    //     var keys2 = data2.columns.slice(1)

    //     // Add X axis for lower order streams
    //     var x = d3.scaleLinear()
    //         .domain(d3.extent(data, function(d) { return d.year; }))
    //         .range([0, width]);
        
    //     // draw x axis
    //     svg.append("g")
    //         .attr("transform", "translate(" + 0 + "," + height + ")") /* height * 0.85 */
    //         // .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d")));
    //         .call(d3.axisBottom(x).tickSize(-height).tickValues([1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2019]).tickFormat(d3.format("d"))) /*             .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format("d"))); */
    //         // remove axis line (but not ticks)
    //         .select(".domain").remove();
        
    //     svg.selectAll(".tick line").attr("stroke", "#b8b8b8")

    //     // Add X axis label:
    //     svg.append("text")
    //         .attr("text-anchor", "end")
    //         .attr("x", width)
    //         .attr("y", height-20 );
    //         // .text("Time (year)");

    //     // Add Y axis for lower order streams
    //     var y = d3.scaleLinear()
    //         .domain([69715, 0])
    //         .range([3,height/2]);
        
    //     // draw y axis
    //     svg.append("g")
    //         .call(d3.axisLeft(y).tickSize(0).tickValues([]))
    //         .select(".domain").remove();
    //         // .text("Lower Order Streams");
        
    //     // Add Y axis for higher order streams
    //     var y2 = d3.scaleLinear()
    //         .domain([96725,0])
    //         .range([height,(height/2)+3]);
        
    //     // draw second y axis
    //     svg.append("g")
    //         .call(d3.axisLeft(y2).tickSize(0).tickValues([]))
    //         .select(".domain").remove()
        
    //     svg.append("text")
    //         .attr("class", "y label")
    //         .attr("text-anchor", "end")
    //         .attr("y", -20)
    //         .attr("x", -190)
    //         .attr("dy", ".75em")
    //         .attr("transform", "rotate(-90)")
    //         .text("Strahler stream order 4-7")
        
    //     svg.append("text")
    //         .attr("class", "y label")
    //         .attr("text-anchor", "end")
    //         .attr("y", -20)
    //         .attr("x", -15)
    //         .attr("dy", ".75em")
    //         .attr("transform", "rotate(-90)")
    //         .text("Strahler stream order 1-3")

    //     // color palette for lower order streams
    //     var color = d3.scaleOrdinal()
    //         .domain(keys)
    //         .range(d3.schemeTableau10);
        
    //     // color palette for higher order streams
    //     var color2 = d3.scaleOrdinal()
    //         .domain(keys2)
    //         .range(d3.schemeTableau10);
        
    //     // stack the data for lower order streams
    //     var stackedData = d3.stack()
    //         .keys(keys)
    //         (data);

    //     var stackedData2 = d3.stack()
    //         .keys(keys2)
    //         (data2);    

    //     // create tooltip
    //     var Tooltip = svg
    //         .append("text")
    //         .attr("x", 2)
    //         .attr("y", -5)
    //         .style("opacity", 0)
    //         .style("font-size", 10)

    //     // Three function that changes the tooltip when the user hover/move/leave a cell
    //     var mouseover = function(d) {
    //         Tooltip.style("opacity", 1)
    //         d3.selectAll(".stackedArea").style("opacity", 0.2)
    //         d3.select(this)
    //             .style("stroke", "black")
    //             .style("stroke-width", 0.3)
    //             .style("opacity", 1)
    //     }

    //     var mousemove = function(d, i) {
    //         grp = keys[i]
    //         Tooltip.text('Segment id: ' + Math.round(grp))
    //     }
    //     var mousemove2 = function(d, i) {
    //         grp = keys2[i]
    //         Tooltip.text('Segment id: ' + Math.round(grp))
    //     }

    //     var mouseleave = function(d) {
    //         Tooltip.style("opacity", 0)
    //         d3.selectAll(".stackedArea").style("opacity", 1).style("stroke", "none")
    //     }
        
    //     var area = d3.area()
    //         .x(function(d, i) { return x(d.data.year); })
    //         .y0(function(d) { return y(d[0]); })
    //         .y1(function(d) { return y(d[1]); })
        
    //     var area2 = d3.area()
    //         .x(function(d, i) { return x(d.data.year); })
    //         .y0(function(d) { return y2(d[0]); })
    //         .y1(function(d) { return y2(d[1]); })

    //     // show the areas
    //     svg
    //         .selectAll("stackedareas1")
    //         .data(stackedData)
    //         .enter()
    //         .append("path")
    //             .attr("class", "stackedArea")
    //             .style('fill', function(d) { return color(d.key); })
    //             .attr("d", area)
    //             .on("mouseover", mouseover)
    //             .on("mousemove", mousemove)
    //             .on("mouseleave", mouseleave)
    //     svg
    //         .selectAll("stackedareas2")
    //         .data(stackedData2)
    //         .enter()
    //         .append("path")
    //             .attr("class", "stackedArea")
    //             .style('fill', function(d) { return color2(d.key); })
    //             .attr("d", area2)
    //             .on("mouseover", mouseover)
    //             .on("mousemove", mousemove2)
    //             .on("mouseleave", mouseleave)
    // };

})();