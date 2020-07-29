(function(){
    
    // psuedo-global variables

    // variables for data join
    var flowArray = ['avg_ann_flow']

    // initial attribute
    var expressed = 'total_count';

    // begin script when window loads
    window.onload = setMap();

    // timestep variable
    var timestep = 'year'

    // selection list for interaction
    var select_list = ['Space', 'Time']

    // *********************************************************************//
    function setMap(){
        // map frame dimensions
        var width = window.innerWidth * 0.4,
            height = window.innerHeight;
        
        //create new svg container for the map
        var map = d3.select("#drb_map")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on DRB
        var projection = d3.geoAlbers()
            .center([0, 40.558894445])
            .rotate([75.363333335, 0, 0])
            .parallels([39.9352537033, 41.1825351867])
            .scale(height*15)
            .translate([width / 2, height / 2]);


        var path = d3.geoPath()
            .projection(projection);
        
        // parallelize asynchronous data loading d3.json("data/Segments_subset_4per_smooth.json"),
        var promises = [d3.csv("data/segment_maflow.csv"),
                        // d3.csv("data/segment_year_counts_8019.csv"),
                        // d3.csv("data/segment_year_counts_order13_8019.csv"),
                        // d3.csv("data/segment_year_counts_order47_8019.csv"),
                        d3.csv("data/matrix_annual_obs.csv"), /* matrix_segment_yearmonth_counts */
                        d3.json("data/segment_geojson.json"),
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
            json_segments = data[2];
            json_bay = data[3];

            console.log(csv_matrix)

            // translate topojsons
            var segments = json_segments.features; /* topojson.feature(json_segments, json_segments.objects.Segments_subset_4per_smooth).features */
            var bay = topojson.feature(json_bay, json_bay.objects.NHDWaterbody_DelawareBay_pt6per_smooth);

            // join csv data to geojson segments
            segments = joinData(segments, csv_flow);

            // check the results
            console.log(segments);
            console.log(bay);

            // stroke width scale
            var widthScale = makeWidthScale(csv_flow);

            // stroke color scale
            var colorScale = makeColorScale(segments);

            // add DRB segments to the map
            setSegments(segments, bay, map, path, widthScale, colorScale);

            // create streamgraph chart
            // createStreamgraphChart(csv_streamgraph);

            // create stacked area chart
            // createStackedAreaChart(csv_stackedarea, csv_stackedarea2);



            // create matrix
            createMatrix(csv_matrix, segments, timestep);

            // create dropdown
            createDropdown(select_list)



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

        // build array of all values of the expressed attribute
        var domainArrayColor = [];
        for (var i=0; i<segments.length; i++){
            var value = parseFloat(segments[i]['properties'][expressed]);
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
    function setSegments(segments, bay, map, path, widthScale, colorScale){
            
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
                return "river_segments seg" + d.seg_id_nat; /* d.properties.seg_id_nat */
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
                mouseoverSpatial(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial(d, tooltip, position);
            })
            .on("mouseleave", function(d) {
                mouseleaveSpatial(d, tooltip);
            });
            // // set color based on colorScale function
            // .style("stroke", function(d){
            //     var value = d.properties[expressed];
            //     if(value){
            //       return colorScale(value);
            //     } else {
            //       return "#ccc";
            //     };
            // });
        
        
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

    // *********************************************************************//
    function createMatrix(csv_matrix, segments, timestep){
        var margin = {top: 20, right: 15, bottom: 15, left: 55},
            width = 500 - margin.left - margin.right,
            height = window.innerHeight - margin.top - margin.bottom;
        

        // append the svg object ot the body of the page
        var svgMatrix = d3.select("#matrixChart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("class", "matrix")
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

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
            .range([0,width])
            .domain(myGroups)
            .padding(0.05);

        // build y scales
        var y = d3.scaleBand()
            .range([height, 0])
            .domain(myVars)
            .padding(0.05);


        // color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateReds) /* interpolatePlasma */
            .domain([temporalCountMax,1])

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

         // Three functions that change the tooltip when user hover / move / leave a cell
        // var mouseover = function(d) {
        //     tooltip
        //         .style("opacity", 1);
        //     d3.selectAll(".seg" + d.seg_id_nat)
        //     // d3.select(this)
        //         .style("stroke", "red")
        //         .style("fill", "None")
        //         .style("opacity", 1);

            //     d3.selectAll(".seg" + d.seg_id_nat)
            // // d3.select(this)
            //     .style("stroke", function(d) {
            //         if (d.total_obs > 0) {
            //             return "None"
            //         } else {
            //             return "red"
            //         }
            //     })
            //     .style("fill", function(d) {
            //         if (d.total_obs > 0) {
            //             return "red"
            //         } else {
            //             return "#ffffff"
            //         }
            //     })
            //     .style("opacity", 1)
        // }

        // var mousemove = function(d) {
        //     tooltip
        //         .html("Segment " + d.seg_id_nat)
        //         .style("left", 0 + "px")
        //         // .style("left", (d3.mouse(this)[0]+70) + "px")
        //         .style("top", (d3.mouse(this)[1]) + "px");
        // }

        // var mouseleave = function(d) {
        //     tooltip
        //     .style("opacity", 0)
        //     d3.selectAll(".seg" + d.seg_id_nat)
        //         // d3.select(this)
        //         .style("stroke", "none")
        //         .style("fill", "#ffffff")
        //         .style("opacity", function(d) {
        //             if (d.properties['total_count'] > 0) {
        //                 return 0;                   
        //             } else {
        //                 return 1;
        //             }
        //         })

        //         // .style("fill", function(d){
        //         //     if (d.total_obs > 0) {
        //         //         return myColor(d.obs_count);
        //         //     } else {
        //         //         return "None"
        //         //     }
        //         // })
        // }


                  
        // add the squares
        var matrixSquares = svgMatrix.selectAll('matrixSqs')
            .data(csv_matrix, function(d) {
                if (d.total_obs > 0) {
                    return d[timestep] +':'+ d.seg_id_nat; /* d.seg_id_nat */
                }
            }) /* d.yearmonth if temporal interval = yearmonth */
            .enter()
            .append("rect")
                // .sort(function(a,b){
                //     return b['seg_centroid_lat'] - a['seg_centroid_lat']
                // })
                .attr("x", function (d){
                    if (d.obs_count > 0) {
                        return x(d.year)
                    }
                })
                .attr("y", function(d) { 
                    if (d.obs_count > 0) {
                        return y(d.seg_id_nat) /* d.seg_id_nat */
                    } 
                })
                .attr("rx", function(d) {
                    if (d.obs_count > 0) {
                        return 1
                    }
                })
                .attr("ry", function(d) {
                    if (d.obs_count > 0) {
                        return 1 
                    }
                })
                .attr("width", function(d) {
                    if (d.obs_count > 0) {
                        return x.bandwidth()
                    }
                })
                .attr("x", function(d) {
                    if (d.obs_count > 0) {
                        return x(d.year)
                    }
                })
                .attr("height", function(d) {
                    if (d.obs_count > 0) {
                        return y.bandwidth()
                    }
                })
                .attr("class", function(d) { 
                    if (d.obs_count > 0) {
                        return 'cell segment' + d.seg_id_nat + ' time' + d.year;
                    }
                })
                .style("fill", function(d) {
                    if (d.obs_count > 0) {
                        return myColor(d.obs_count);
                    } 
                })
                .style("stroke-width", function(d) {
                    if (d.obs_count > 0) {
                        return 1
                    }
                })
                .style("stroke", function(d) {
                    if (d.obs_count > 0) {
                        return "none"
                    }
                })
                .style("opacity", function(d) {
                    if (d.obs_count > 0) {
                        return 1
                    }
                })
           
                        
            // .on("mouseover", mouseover)
            // .on("mousemove", mousemove)
            // .on("mouseleave", mouseleave)
        

            // add the rectangles
            var matrixSegmentRectangles = svgMatrix.selectAll('matrixSegRects')
                .data(segments) /*  */
                .enter()
                .append("rect")
                    // .sort(function(a,b){
                    //     return b['seg_centroid_lat'] - a['seg_centroid_lat']
                    // })   
                    .attr("x", x("1980")) /* d.yearmonth if temporal interval = yearmonth */
                    .attr("y", function(d) { return y(d.seg_id_nat) }) /* d.seg_id_nat */
                    .attr("rx", 1)
                    .attr("ry", 1)
                    .attr("width", width)
                    .attr("height", y.bandwidth() )
                    .attr("class", function(d) { 
                        return 'rect seg' + d.seg_id_nat;
                    })
                    .style("fill", function(d) { 
                        if (d.properties['total_count'] > 0) {
                            return "#ffffff";                   
                        } else {
                            return "#ffffff";  /*"None"*/
                        }
                    })
                    // .style("stroke-width", 0.5)
                    // .style("stroke", "none")
                    .style("opacity", function(d) {
                        if (d.properties['total_count'] > 0) {
                            return 0;                   
                        } else {
                            return 1; 
                        }
                    })
                    // .on("click", function(d){
                    //     clickRectSpatial(d, tooltip);
                    // })
                    .on("mouseover", function(d) {
                        mouseoverSpatial(d, tooltip);
                    })
                    .on("mousemove", function(d) {
                        position = d3.mouse(this);
                        mousemoveRectSpatial(d, tooltip, position);
                    })
                    .on("mouseleave", function(d) {
                        mouseleaveSpatial(d, tooltip);
                    })

            // var matrixTemporalRectangles = svgMatrix.selectAll('matrixTempRects')
            //         .data(data)
            //         .enter()
            //         .append("rect")




            // .data(data, function(d) {return d.yearmonth +':'+ d.seg_id_nat;}) /* d.yearmonth if temporal interval = yearmonth */
            // .enter()
            // .append("rect")
            //     .attr("x", function(d) {
            //         if (d.total_obs > 0){
            //             return x(d.yearmonth)
            //         } else {
            //             return x("1980-01")
            //         }                 
            //     }) /* d.yearmonth if temporal interval = yearmonth */
            //     .attr("y", function(d) { return y(d.seg_id_nat) })
            //     .attr("rx", 1)
            //     .attr("ry", 1)
            //     .attr("width", function(d) {
            //         if (d.total_obs > 0) {
            //             return x.bandwidth()
            //         } else {
            //             return width
            //         }
            //     })
            //     .attr("height", y.bandwidth() )
            //     .attr("class", function(d) { 
            //         return 'cell seg' + d.seg_id_nat;
            //     })
            //     .style("fill", function(d) { 
            //         if (d.total_obs > 0) {
            //             if (d.obs_count > 0) {
            //                 // return "black"
            //                 return myColor(d.obs_count);
            //             } else {
            //                 return "None";
            //             }                    
            //         } else {
            //             return "#ffffff";  /*"None"*/
            //         }
            //     })
            //     .style("stroke-width", 0.5)
            //     .style("stroke", "none")
            //     .style("opacity", 0.8)
            // .on("mouseover", mouseover)
            // .on("mousemove", mousemove)
            // .on("mouseleave", mouseleave)
    

        // draw x axes
        svgMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + height + ")")
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
            .attr("transform", "translate(" + width + "," + 0 + ")")
            .call(d3.axisRight(y).tickSize(0))
    };

    // *********************************************************************//
    function mousemoveRectSpatial(data, tooltip, position) {
        console.log(position[1])
        yoffset = position[1]+7
        tooltip
            .html("Segment " + data.seg_id_nat)
            .style("left", -12 + "px")
            .style("top", yoffset + "px");
    };

    // *********************************************************************//
    function mousemoveSegSpatial(data, tooltip, position) {
        tooltip
            .html("Segment " + data.seg_id_nat)
            .style("left", position[0]+25 + "px")
            .style("top", position[1]-25 + "px"); /* position[1]+110 */


        // var margin = {top: 15, right: 15, bottom: 15, left: 85},
        //     width = 500 - margin.left - margin.right,
        //     height = 1300 - margin.top - margin.bottom;

        // var myVars = d3.map(data, function(d){return d.seg_id_nat;}).keys()
        // console.log(myVars)
        // var y = d3.scaleBand()
        //     .range([height, 0])
        //     .domain(myVars)
        //     .padding(0.05);
        
        // tooltip
        //     .html("Segment " + myVars.seg_id_nat)
        //     .style("left", -5 + "px")
        //     .style("top", 0 + "px")
        //     .style("top", function(myVars){
        //         return y(myVars.seg_id_nat) + "px"
        //     });
    };

    // *********************************************************************//
    function mouseoverSpatial(data, tooltip) {
        tooltip
            .style("opacity", 1);
        d3.selectAll(".rect")
            .style("opacity", 0.6)
            .style("stroke-width", 1);
        d3.selectAll(".rect.seg" + data.seg_id_nat)
            // .style("stroke", "red")
            .style("stroke-width", 0.5)
            // .style("fill", "#ffffff")
            .style("opacity", function(data) {
                if (data.properties['total_count'] > 0) {
                    return 0;                   
                } else {
                    return 1;
                }
            })
            .style("stroke", function(data) {
                if (data.properties['total_count'] > 0) {
                    return "None";                   
                } else {
                    return "red";
                }
            });
        d3.selectAll(".delaware_bay")
            .style("fill", "#bdc8db")
        d3.selectAll(".river_segments")
            .style("stroke", "#bdc8db")
        d3.selectAll(".river_segments.seg" + data.seg_id_nat)
            .style("stroke", "red")
            .attr("opacity", 1)
            .attr("filter", "url(#shadow1)")
            .raise()
            
    };

    // *********************************************************************//
    function mouseleaveSpatial(data, tooltip) {
        tooltip
        .style("opacity", 0)
        d3.selectAll(".rect") /* .rect.seg" + data.seg_id_nat */
            .style("stroke", "none")
            .style("fill", "#ffffff")
            .style("stroke-width", 0.5)
            .style("opacity", function(data) {
                if (data.properties['total_count'] > 0) {
                    return 0;                   
                } else {
                    return 1;
                }
            })
            // .transition()
            // .delay(20)
            // .duration(500)
        d3.selectAll(".delaware_bay")
            .style("fill", "#6079a3")
        d3.selectAll(".river_segments")
            .style("stroke", "#6079a3")
        d3.selectAll(".river_segments.seg" + data.seg_id_nat)
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
            .attr("filter","None")
    };

    // *********************************************************************//
    // function clickRectSpatial(data, tooltip) {
    //     d3.selectAll(".rect.seg" + data.seg_id_nat)
    //         .style("stroke", "red")
    //         .style("fill", "None")
    //         .style("opacity", 1);
    //     d3.selectAll(".river_segments.seg" + data.seg_id_nat)
    //         .style("stroke", "red")
    //         .attr("filter", "url(#shadow1)")
    // };

    // *********************************************************************//
    // fuction to create a dropdown menu for attribute selection
    function createDropdown(select_list){
        // add select element
        var dropdown = d3.select("#matrixChart")
            // append the select element to the body
            .append("select")
            // add class for styling
            .attr("class", "dropdown")
            // add event listener
            .on("change", function(){
                // call listener handler function
                changeAttribute(this.value, select_list)
            });

        // add initial option
        var titleOption = dropdown.append("option")
            // create a title option element with no value attribute
            .attr("class", "titleOption")
            // ensure that users cannot select it
            .attr("disabled", "true")
            // add an affordance to let users know they can interact with the dropdown menu
            .text("Select Dimension for Interaction");

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

})();