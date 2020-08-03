(function(){
    
    // psuedo-global variables

    // variables for data join
    var flowArray = ['avg_ann_flow']

    // initial attribute
    var expressed = 'Time';

    // begin script when window loads
    window.onload = setPanels();

    // timestep variables
    var matrixMapOne_timestep = 'year'
    var matrixMapTwo_timestep = 'date'

    // selection list for dropdown
    var selectList_matrixMapOne = ['Space', 'Time']

    // margins, width and height for matrix charts
    var matrix_margin = {top: 20, right: 15, bottom: 15, left: 35},
        matrix_width = 500 - matrix_margin.left - matrix_margin.right,
        matrix_height = window.innerHeight - matrix_margin.top - matrix_margin.bottom;

    // *********************************************************************//
    function setPanels(){
        // set universal map frame dimensions
        var map_width = window.innerWidth * 0.4,
            map_height = window.innerHeight;

        //create Albers equal area conic projection centered on DRB
        var map_projection = d3.geoAlbers()
            .center([0, 40.558894445])
            .rotate([75.363333335, 0, 0])
            .parallels([39.9352537033, 41.1825351867])
            .scale(map_height*15)
            .translate([map_width / 2, map_height / 2]);

        var map_path = d3.geoPath()
            .projection(map_projection);

        //create new svg container for the matrixMapOne
        var matrixMapOne = d3.select("#DRB_matrixMapOne")
        .append("svg")
        .attr("class", "matrixMapOne")
        .attr("width", map_width)
        .attr("height", map_height);

        // create new svg container for matrixMapTwo
        var matrixMapTwo = d3.select("#DRB_matrixMapTwo")
        .append("svg")
        .attr("class", "matrixMapTwo")
        .attr("width", map_width)
        .attr("height", map_height);
        
        // parallelize asynchronous data loading d3.json("data/Segments_subset_4per_smooth.json"),
        var promises = [d3.csv("data/segment_maflow.csv"),
                        d3.csv("data/matrix_annual_obs.csv"), /* matrix_segment_yearmonth_counts */
                        d3.csv("data/obs_annual_count.csv"),
                        d3.json("data/segment_geojson.json"),
                        d3.json("data/observed_reach_station_coords.json"),
                        d3.json("data/NHDWaterbody_DelawareBay_pt6per_smooth.json")
                    ];
        Promise.all(promises).then(callback);

        // *********************************************************************//
        // Place callback function within setPanels to make use of local variables
        function callback(data) {
            csv_flow = data[0];
            csv_matrix = data[1];
            csv_annual_count = data[2];
            json_segments = data[3];
            json_obs_stations = data[4];
            json_bay = data[5];

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

            // stroke width scale
            var widthScale = makeWidthScale(csv_flow);

            // stroke color scale
            var colorScale = makeColorScale(segments);

            // Set up panel 2 - matrixMapOne
            // add DRB segments to the matrixMapOne map
            setSegments_matrixMapOne(segments, stations, bay, matrixMapOne, map_path, widthScale, colorScale);
            // create matrixOne
            createMatrix_matrixMapOne(csv_matrix, csv_annual_count, segments, matrixMapOne_timestep);
            // create dropdown for matrixOne
            createDropdown_matrixMapOne(selectList_matrixMapOne, csv_matrix, csv_annual_count, segments)

            // // Set up panel 3 - matrixMapTwo
            // // add DRB segments to the matrixMapOne map
            setSegments_matrixMapTwo(segments, stations, bay, matrixMapTwo, map_path, widthScale, colorScale);
            // // create matrixTwo
            // createMatrix_matrixMapTwo(csv_matrix, csv_annual_count, segments, matrixMapTwo_timestep);
            // // create dropdown for matrixOne
            // createDropdown_matrixMapTwo(selectList_matrixMapTwo, csv_matrix, csv_annual_count, segments)

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
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    function setSegments_matrixMapOne(segments, stations, bay, map, map_path, widthScale, colorScale){
            
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "delaware_bay")
            .attr("d", map_path);

        // set tooltip
        var tooltip = d3.select("#DRB_matrixMapOne")
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
            .attr("d", map_path)
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
                mouseover_matrixMapOne(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial_matrixMapOne(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_matrixMapOne(d, tooltip);
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
        
        // // add drb stations to map
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
            //     mousemoveSegSpatial_matrixMapOne(d, tooltip, position);
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
    function createMatrix_matrixMapOne(csv_matrix, csv_annual_count, segments, matrixMapOne_timestep){

        // var margin = {top: 20, right: 15, bottom: 15, left: 55},
        //     width = 500 - margin.left - margin.right,
        //     height = window.innerHeight - margin.top - margin.bottom;
        
        // append the svg object ot the body of the page
        var svgMatrix = d3.select("#matrixChartOne")
            .append("svg")
                .attr("width", matrix_width + matrix_margin.left + matrix_margin.right)
                .attr("height", matrix_height + matrix_margin.top + matrix_margin.bottom)
                .attr("class", "matrix")
            .append("g")
                .attr("class", "transformedMatrix")
                .attr("transform",
                    "translate(" + matrix_margin.left + "," + matrix_margin.top + ")");

        // read in data
        var myGroups = d3.map(csv_matrix, function(d){return d[matrixMapOne_timestep];}).keys() /* d.yearmonth if temporal interval = yearmonth */
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
            .padding(0.1);

        // build y scales
        var y = d3.scaleBand()
            .range([matrix_height, 0])
            .domain(myVars)
            .padding(0.1);

        // color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolatePlasma) /* interpolatePlasma */
            // .domain([temporalCountMax,1]) // if INVERTING color scale
            .domain([1, temporalCountMax]) // if NOT INVERTING color scale
              
        // add the squares
        var matrixSquares = svgMatrix.selectAll('matrixSqs')
            .data(csv_matrix, function(d) {
                if (d.total_obs > 0) {
                    return d[matrixMapOne_timestep] +':'+ d.seg_id_nat; /* d.seg_id_nat */
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
            // .attr("rx", 1)
            // .attr("ry", 1 )
            .attr("width", x.bandwidth())
            .attr("x", function(d) {
               return x(d[matrixMapOne_timestep])
            })
            .attr("height", y.bandwidth())
            .attr("class", function(d) { 
                return 'cell segment' + d.seg_id_nat + ' timestep' + d[matrixMapOne_timestep]
            })
            .style("fill", function(d) {
                return myColor(d.obs_count);
            })
            .style("stroke-width", 0.5)
            // .style("stroke", "None") //"None"
            .style("stroke", function(d){
                return myColor(d.obs_count);
            })
            .style("opacity", 1);

        // add the rectangles
        createMatrixRectangles_matrixMapOne(csv_matrix, csv_annual_count, segments)

        // draw x axes
        svgMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + matrix_height + ")")
            .attr("class", "matrixAxis bottom")
            .call(d3.axisBottom(x).tickSize(0).tickValues(['1980', '1990', '2000', '2010', '2019'])) /* '1980-01', '1990-01', '2000-01', '2010-01', '2019-01' */
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("class", "matrixAxis top")
            .call(d3.axisTop(x).tickSize(0))
            // .select(".domain").remove()

        // draw y axes
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("class", "matrixAxis left")
            .call(d3.axisLeft(y).tickSize(0))
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + matrix_width + "," + 0 + ")")
            .attr("class", "matrixAxis right")
            .call(d3.axisRight(y).tickSize(0))

    };

    // *********************************************************************//
    function createMatrixRectangles_matrixMapOne(csv_matrix, csv_annual_count, segments) {

        // create matrix recangles variable
        var transformedMatrix = d3.select(".transformedMatrix")
        // var matrixRectangles = svgMatrix.selectAll('matrixRect')

        // read in data
        var myGroups = d3.map(csv_matrix, function(d){return d[matrixMapOne_timestep];}).keys() /* d.yearmonth if temporal interval = yearmonth */
        var myVars = d3.map(csv_matrix, function(d){return d.seg_id_nat;}).keys() /* d.seg_id_nat */

        // var temporalCountMin = Math.round(Math.min(...domainArrayTemporalCounts));
        // console.log(temporalCountMin)

        // build x scales
        var xscale = d3.scaleBand()
            .range([0,matrix_width])
            .domain(myGroups)
            .padding(0.1);

        // build y scales
        var yscale = d3.scaleBand()
            .range([matrix_height, 0])
            .domain(myVars)
            .padding(0.1);

        // create a tooltip
        var tooltip = d3.select("#matrixChartOne")
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
            // .attr("rx", 1)
            // .attr("ry", 1)
            .attr("width", matrix_width)
            .attr("height", yscale.bandwidth() )
            .attr("class", function(d) { 
                return 'matrixSpatialRect seg' + d.seg_id_nat;
            })
            .style("fill", function(d) { 
                if (d.properties.total_count > 0) {
                    return "#000000"; // "#ffffff"                  
                } else {
                    return "#000000";  /*"#ffffff"*/
                }
            })
            .style("stroke-width", 2)
            .style("stroke", "#000000") // "#ffffff"
            .style("opacity", function(d) {
                if (d.properties.total_count > 0) {
                    return 0;                   
                } else {
                    return 0; 
                }
            })
            // .on("click", function(d){
            //     clickRectSpatial(d, tooltip);
            // })
            .on("mouseover", function(d) {
                mouseover_matrixMapOne(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect_matrixMapOne(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_matrixMapOne(d, tooltip);
            })

        // revised build of temporal rectangles
        var matrixTemporalRectangles = transformedMatrix.selectAll('.matrixTemporalRect')
            .data(csv_annual_count)
            .enter()
            .append("rect")
            .attr("x", function(d){
                return xscale(d[matrixMapOne_timestep])
            }) 
            .attr("y", 0) /* function(d) { return yscale(0) } */
            // .attr("rx", 1)
            // .attr("ry", 1)
            .attr("width", xscale.bandwidth())
            .attr("height", matrix_height)
            .attr("class", function(d) { 
                return 'matrixTemporalRect time' + d.year;
            })
            .style("fill", "#000000") // "#ffffff"
            .style("stroke-width", 2)
            .style("stroke", "#000000") // #ffffff"
            .style("opacity", 0)
            .on("mouseover", function(d) {
                mouseover_matrixMapOne(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect_matrixMapOne(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_matrixMapOne(d, tooltip);
            })
    };

    // *********************************************************************//
    function mousemoveRect_matrixMapOne(data, tooltip, position) {
        if (expressed == 'Space') {
            // console.log(data.properties.total_count)
            if (data.properties) {
                var num_obs = data.properties.total_count;
                yoffset = position[1]+5
                tooltip
                    .html(d3.format(',')(num_obs) + "<p>obs.")
                    // .html("Segment " + data.seg_id_nat)
                    .style("left", 10 + "px")
                    .style("top", yoffset + "px")
                    .style("text-align", "right");
            }
        } else if (expressed = 'Time') {
            if (data.total_annual_count) {
                xoffset = position[0]+10
                yoffset = position[1]-5
                tooltip
                    .html(data.year)
                    .style("left", xoffset + "px")
                    .style("top", yoffset + "px");
            }
        }
    };

    // *********************************************************************//
    function mousemoveSegSpatial_matrixMapOne(data, tooltip, position) {
        if (expressed == 'Space') {
            var num_obs = data.properties.total_count;
            tooltip
                .html(d3.format(',')(num_obs) + "<p>obs.")
                // .html("Segment " + data.seg_id_nat)
                .style("left", position[0]+35 + "px")
                .style("top", position[1]-25 + "px")
                .style("text-align", "left"); /* position[1]+110 */
        } //else if (expressed = 'Time') 
    };
    
    // *********************************************************************//
    function mouseover_matrixMapOne(data, tooltip) {
        if (expressed == 'Space') {
            console.log("spatial mouseover data: ")
            console.log(data)

            d3.selectAll(".matrixTemporalRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.properties) {
                tooltip
                    .style("opacity", 1);
                d3.selectAll(".matrixSpatialRect")
                    .style("opacity", 0.8)
                    .style("stroke-width", 1);
                d3.selectAll(".cell.segment" + data.seg_id_nat)
                    .raise()
                d3.selectAll(".matrixSpatialRect.seg" + data.seg_id_nat)
                    // .style("stroke-width", 0.5)
                    .style("stroke-width", function(data) {
                        if (data.properties.total_count > 0) { //properties.total_count
                            return 0;                   
                        } else {
                            return 0.5;
                        }
                    })
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
                            return "#ffffff"; //red
                        }
                    })
                    .raise();
                d3.selectAll(".delaware_bay")
                    .style("fill", "#172c4f")
                d3.selectAll(".river_segments")
                    .style("stroke", "#172c4f")
                d3.selectAll(".river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "#ffffff")
                    .attr("opacity", 1)
                    .attr("filter", "url(#shadow1)")
                    .raise()

            } else {
                console.log("spatial mouseover, temporal data: ")
                console.log(data)
            }

        } else if (expressed = 'Time') {
            console.log("temporal mouseover data: ")
            console.log(data)

            d3.selectAll(".matrixSpatialRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.total_annual_count) {
                tooltip
                    .style("opacity", 1);
                d3.selectAll(".matrixTemporalRect")
                    .style("opacity", 0.8)
                    .style("stroke-width", 2);
                d3.selectAll(".matrixTemporalRect.time" + data.year)
                    .style("opacity", 0)
                d3.selectAll(".delaware_bay")
                    .style("fill", "#172c4f")
                d3.selectAll(".river_segments")
                    .style("stroke", "#172c4f")
                d3.selectAll(".river_segments.year" + data.year)
                    .style("stroke", "#ffffff")
                    .attr("opacity", 1)
                    // .attr("filter", "url(#shadow1)")
                    .raise()


            } else {
                console.log("temporal mouseover, spatial data: ")
                console.log(data)
            }

        }

            
    };

    // *********************************************************************//
    function mouseout_matrixMapOne(data, tooltip) {
        if (expressed == 'Space') {
            console.log("spatial mouseout data: ")
            console.log(data)

            d3.selectAll(".matrixTemporalRect")
                .style("fill", "#000000")
                .style("stroke", "#000000")
                .style("stroke-width", 2) 

            if (data.properties) {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".matrixSpatialRect") /* .matrixRect.seg" + data.seg_id_nat */
                    .style("stroke", "None")    
                    .style("stroke", "#000000") // "#ffffff"
                    .style("fill", "#000000") // "#ffffff"
                    .style("stroke-width", 2)
                    .style("opacity", 0)
                d3.selectAll(".matrixSpatialRect" + data.seg_id_nat)
                    .lower()
                d3.selectAll(".cell.segment" + data.seg_id_nat)
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
               console.log("spatial mouseout, temporal data: ")
               console.log(data)
            }

        } else if (expressed = 'Time') {
            console.log("temporal mouseout data: ")
            console.log(data)

            d3.selectAll(".matrixSpatialRect")
                .style("fill", "#000000") // #ffffff
                .style("stroke", "#000000")
                .style("stroke-width", 2)

            if (data.total_annual_count)  {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".matrixTemporalRect") 
                    .style("stroke", "#000000") // #ffffff
                    .style("fill", "#000000") // #ffffff
                    .style("stroke-width", 2)
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
                console.log("temporal mouseout, spatial data:")
                console.log(data)
            }
        }

    };

    // *********************************************************************//
    // fuction to create a dropdown menu for attribute selection
    function createDropdown_matrixMapOne(selectList_matrixMapOne, csv_matrix, csv_annual_count, segments){
        console.log("createDropdown:")
        console.log(segments)
        // add select element
        var dropdown = d3.select("#matrixChartOne")
            // append the select element to the body
            .append("select")
            // add class for styling
            .attr("class", "dropdown")
            // add event listener
            .on("change", function(){
                // call listener handler function
                changeInteractionDimension_matrixMapOne(this.value, csv_matrix, csv_annual_count, segments)
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
            .data(selectList_matrixMapOne)
            // create an element for each datum
            .enter()
            // append to the option
            .append("option")
            // set value of attributes
            .attr("value", function(d){ return d })
            // set text element
            .text(function(d){ 
                return "Interaction Dimension: " +d 
            });
    };

    // *********************************************************************//
    function changeInteractionDimension_matrixMapOne(dimension, csv_matrix, csv_annual_count, segments){
        console.log("changeInteractionDimension:")
        console.log(segments)

        // reset expressed dimension based on selected dimension
        expressed = dimension;

    };

    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//

    function setSegments_matrixMapTwo(segments, stations, bay, map, map_path, widthScale, colorScale){
            
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "delaware_bay")
            .attr("d", map_path);

        // set tooltip
        var tooltip = d3.select("#DRB_matrixMapTwo")
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
            .attr("d", map_path)
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
                mouseover_matrixMapOne(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial_matrixMapOne(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_matrixMapOne(d, tooltip);
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
        
        // // add drb stations to map
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
            //     mousemoveSegSpatial_matrixMapOne(d, tooltip, position);
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




})();