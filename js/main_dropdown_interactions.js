(function(){
    
    // psuedo-global variables

    // variables for data join
    var flowArray = ['avg_ann_flow']

    // initial attributes for panels
    var expressed_c2p2 = 'Space';
    var expressed_c2p3 = 'Space';

    // begin script when window loads
    window.onload = setPanels();

    // timestep variables
    var timestep_c2p2 = 'year'
    var timestep_c2p3 = 'date'

    // selection list for dropdown
    var selectList_c2p2 = ['Space', 'Time']
    var selectList_c2p3 = ['Space', 'Time']

    // margins, width and height for matrix charts
    var matrix_margin = {top: 20, right: 15, bottom: 15, left: 35},
        matrix_width_c2p2 = 700 - matrix_margin.left - matrix_margin.right, //500
        matrix_width_c2p3 = 700 - matrix_margin.left - matrix_margin.right,
        matrix_height_c2p2 = window.innerHeight*0.93 - matrix_margin.top - matrix_margin.bottom,
        matrix_height_c2p3 = window.innerHeight*0.93 - matrix_margin.top - matrix_margin.bottom;

    // *********************************************************************//
    function setPanels(){
        // set universal map frame dimensions
        var map_width = window.innerWidth * 0.4,
            map_height = window.innerHeight*0.95;

        //create Albers equal area conic projection centered on DRB
        var map_projection = d3.geoAlbers()
            .center([0, 40.558894445])
            .rotate([75.363333335, 0, 0])
            .parallels([39.9352537033, 41.1825351867])
            .scale(map_height*15)
            .translate([map_width / 2, map_height / 2]);

        var map_path = d3.geoPath()
            .projection(map_projection);

        //create new svg container for the panel 2 map
        var map_c2p1 = d3.select("#DRB_map_c2p1")
            .append("svg")
            .attr("class", "map_c2p1")
            .attr("width", map_width)
            .attr("height", map_height);

        //create new svg container for the panel 2 map
        var map_c2p2 = d3.select("#DRB_map_c2p2")
            .append("svg")
            .attr("class", "map_c2p2")
            .attr("width", map_width)
            .attr("height", map_height);

        // create new svg container for map_c2p3
        var map_c2p3 = d3.select("#DRB_map_c2p3")
            .append("svg")
            .attr("class", "map_c2p3")
            .attr("width", map_width)
            .attr("height", map_height);
        
        // parallelize asynchronous data loading 
        var promises = [d3.csv("data/segment_maflow.csv"),
                        d3.csv("data/matrix_annual_obs.csv"), 
                        d3.csv("data/obs_annual_count.csv"),
                        d3.csv("data/matrix_daily_2019_obs.csv"),
                        d3.csv("data/obs_daily_count_2019.csv"),
                        d3.json("data/segment_geojson.json"),
                        d3.json("data/observed_reach_station_coords.json"),
                        d3.json("data/NHDWaterbody_DelawareBay_pt6per_smooth.json")
                    ];
        Promise.all(promises).then(callback);

        // *********************************************************************//
        // Place callback function within setPanels to make use of local variables
        function callback(data) {
            csv_flow = data[0];
            csv_matrix_annual = data[1];
            csv_annual_count = data[2];
            csv_matrix_daily_2019 = data[3];
            csv_daily_count_2019 = data[4];
            json_segments = data[5];
            json_obs_stations = data[6];
            json_bay = data[7];

            console.log(csv_matrix_daily_2019)
            console.log(csv_daily_count_2019)

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

            // // Set up panel 1 -
            // add DRB segments to the panel 1 map
            setSegments_c2p1(segments, stations, bay, map_c2p1, map_path, widthScale, colorScale);

            // // Set up panel 2 - 
            // add DRB segments to the panel 2 map
            setSegments_c2p2(segments, stations, bay, map_c2p2, map_path, widthScale, colorScale);
            // create dropdown for panel 2 matrix
            createDropdown_c2p2(selectList_c2p2) 
            // create panel 2 matrix
            createMatrix_c2p2(csv_matrix_annual, csv_annual_count, segments, timestep_c2p2);


            // // Set up panel 3 - 
            // // add DRB segments to the panel 3 map
            setSegments_c2p3(segments, stations, bay, map_c2p3, map_path, widthScale, colorScale);
            // // create dropdown for panel 3 matrix
            createDropdown_c2p3(selectList_c2p3)
            // // create panel 3 matrix
            createMatrix_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments, timestep_c2p3);


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
    function setSegments_c2p1(segments, stations, bay, map, map_path, widthScale, colorScale){
            
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "c2p1 delaware_bay")
            .attr("d", map_path)
            .on("mouseover", function(d) {
                mouseover_c2p1(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial_c2p1(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p1(d, tooltip);
            });

        // set tooltip
        var tooltip = d3.select("#DRB_map_c2p1")
            .append("div")
            .style("opacity", 0)
            .attr("class", "c2p1 tooltip")
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
                var seg_class = 'c2p1 river_segments seg'
                seg_class += d.seg_id_nat
                // for (key in d.properties.year_count) {
                //     if (d.properties.year_count[key]) {
                //         seg_class += " " + timestep_c2p1 + key
                //     }
                // }
                return seg_class

                // return "c2p1 river_segments seg" + d.seg_id_nat; /* d.properties.seg_id_nat */
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
                mouseover_c2p1(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial_c2p1(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p1(d, tooltip);
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
        
        // add drb stations to map
        var drb_stations = map.selectAll(".obs_stations")
            // bind segments to each element to be created
            .data(stations)
            // create an element for each datum
            .enter()
            // append each element to the svg as a circle element
            .append("path")
            // project points and SET SIZE
            .attr("d", map_path.pointRadius(2))
            // assign class for styling
            .attr("class", function(d){
                return "c2p2 obs_stations station" + d.id
            })
            .style("fill", "#ffffff")
            .style("stroke", "#000000")
            .style("stroke-width", 0.4)
            .style("opacity", 0.7)
            // .on("mouseover", function(d) {
            //     mouseover_c2p1(d, tooltip);
            // })
            // .on("mousemove", function(d) {
            //     position = d3.mouse(this);
            //     mousemoveSegSpatial_c2p1(d, tooltip, position);
            // })
            // .on("mouseout", function(d) {
            //     mouseout_c2p1(d, tooltip);
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
    function mousemoveSegSpatial_c2p1(data, tooltip, position) {
        var num_obs = data.properties.total_count;
        tooltip
            .html(d3.format(',')(num_obs) + "<p>obs.")
            // .html("Segment " + data.seg_id_nat)
            .style("left", position[0]+35 + "px")
            .style("top", position[1]-25 + "px")
            .style("text-align", "left"); /* position[1]+110 */
    };

    // *********************************************************************//
    function mouseover_c2p1(data, tooltip) {
        // tooltip
        //     .style("opacity", 1);
        d3.selectAll(".c2p1.delaware_bay")
            .style("fill", "#0b1b36")
        d3.selectAll(".c2p1.river_segments")
            .style("stroke", "#0b1b36")
        // d3.selectAll(".c2p1.river_segments.seg" + data.seg_id_nat)
        //     .style("stroke", "#ffffff")
        //     .attr("opacity", 1)
        //     .attr("filter", "url(#shadow1)")
        //     .raise()
        d3.selectAll(".c2p2.obs_stations")
            .style("opacity", 1)
        // d3.selectAll(".c2p2.obs_stations.station" + data.seg_id_nat)
        //     .style("fill", "red")
        //     .style("opacity", 1)
        //     .raise()
            
    };

    // *********************************************************************//
    function mouseout_c2p1(data, tooltip) {
        // tooltip
        //     .style("opacity", 0)

        d3.selectAll(".c2p1.delaware_bay")
            .style("fill", "#6079a3")
        d3.selectAll(".c2p1.river_segments")
            .style("stroke", "#6079a3")
        d3.selectAll(".c2p2.obs_stations")
            .style("opacity", 1)
            .style("fill", "#ffffff")
        // d3.selectAll(".c2p2.obs_stations.station" + data.seg_id_nat)
        //     .lower()  
        // d3.selectAll(".c2p1.river_segments.seg" + data.seg_id_nat)
        //     .style("stroke", "#6079a3")
        //     .attr("opacity", 1)
        //     .attr("filter","None")
        //     .lower()


    };    

    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    function setSegments_c2p2(segments, stations, bay, map, map_path, widthScale, colorScale){
            
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "c2p2 delaware_bay")
            .attr("d", map_path);

        // set tooltip
        var tooltip = d3.select("#DRB_map_c2p2")
            .append("div")
            .style("opacity", 0)
            .attr("class", "c2p2 tooltip")
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
                var seg_class = 'c2p2 river_segments seg'
                seg_class += d.seg_id_nat
                for (key in d.properties.year_count) {
                    if (d.properties.year_count[key]) {
                        seg_class += " " + timestep_c2p2 + key
                    }
                }
                return seg_class

                // return "c2p2 river_segments seg" + d.seg_id_nat; /* d.properties.seg_id_nat */
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
                mouseover_c2p2(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial_c2p2(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p2(d, tooltip);
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
        //         return "c2p2 obs_stations station" + d.id
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
            //     mousemoveSegSpatial_c2p2(d, tooltip, position);
            // })
            // .on("mouseout", function(d) {
            //     mouseout(d, tooltip);
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
    // fuction to create a dropdown menu for attribute selection
    function createDropdown_c2p2(selectList_c2p2){ 
        // add select element
        var dropdown = d3.select("#matrixChart_c2p2")
            // append the select element to the body
            .append("select")
            // add class for styling
            .attr("class", "dropdown")
            // add event listener
            .on("change", function(){
                // call listener handler function
                changeInteractionDimension_c2p2(this.value) 
            });

        // add initial option
        var titleOption = dropdown.append("option")
            // create a title option element with no value attribute
            .attr("class", "titleOption")
            // ensure that users cannot select it
            .attr("disabled", "true")
            // add an affordance to let users know they can interact with the dropdown menu
            .text("Interaction Dimension: " + expressed_c2p2);

        // add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            // bind data to the elements to be created
            .data(selectList_c2p2)
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
    function changeInteractionDimension_c2p2(dimension){ 
        // reset expressed_c2p2 dimension based on selected dimension
        expressed_c2p2 = dimension;
    };

    // *********************************************************************//
    function createMatrix_c2p2(csv_matrix_annual, csv_annual_count, segments, timestep_c2p2){
       
        // append the svg object ot the body of the page
        var svgMatrix = d3.select("#matrixChart_c2p2")
            .append("svg")
                .attr("width", matrix_width_c2p2 + matrix_margin.left + matrix_margin.right)
                .attr("height", matrix_height_c2p2 + matrix_margin.top + matrix_margin.bottom)
                .attr("class", "c2p2 matrix")
            .append("g")
                .attr("class", "c2p2 transformedMatrix")
                .attr("transform",
                    "translate(" + matrix_margin.left + "," + matrix_margin.top + ")");

        // read in data
        var myGroups = d3.map(csv_matrix_annual, function(d){return d[timestep_c2p2];}).keys() 
        var myVars = d3.map(csv_matrix_annual, function(d){return d.seg_id_nat;}).keys() 

        // build array of all values of observation counts
        var domainArrayTemporalCounts = [];
        for (var i=0; i<csv_matrix_annual.length; i++){
            var val = parseFloat(csv_matrix_annual[i]['obs_count']);
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
            .range([0,matrix_width_c2p2])
            .domain(myGroups)
            .padding(0.1);

        // build y scales
        var y = d3.scaleBand()
            .range([matrix_height_c2p2, 0])
            .domain(myVars)
            .padding(0.1);

        // color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolatePlasma) /* interpolatePlasma */
            // .domain([temporalCountMax,1]) // if INVERTING color scale
            .domain([1, temporalCountMax]) // if NOT INVERTING color scale
              
        // add the squares
        var matrixSquares = svgMatrix.selectAll('matrixSqs')
            .data(csv_matrix_annual, function(d) {
                if (d.total_obs > 0) {
                    return d[timestep_c2p2] +':'+ d.seg_id_nat; /* d.seg_id_nat */
                }
            }) 
            .enter()
            .filter(function (d){
                return d.obs_count > 0
            })
            .append("rect")
            .attr("x", function (d){
                return x(d[timestep_c2p2])
            })
            .attr("y", function(d) { 
                return y(d.seg_id_nat)
            })
            // .attr("rx", 1)
            // .attr("ry", 1 )
            .attr("width", x.bandwidth())
            .attr("x", function(d) {
               return x(d[timestep_c2p2])
            })
            .attr("height", y.bandwidth())
            .attr("class", function(d) { 
                return 'c2p2 cell segment' + d.seg_id_nat + ' timestep' + d[timestep_c2p2]
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
        createMatrixRectangles_c2p2(csv_matrix_annual, csv_annual_count, segments)

        // draw x axes
        svgMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + matrix_height_c2p2 + ")")
            .attr("class", "c2p2 matrixAxis bottom")
            .call(d3.axisBottom(x).tickSize(0).tickValues(['1980', '1990', '2000', '2010', '2019'])) /* '1980-01', '1990-01', '2000-01', '2010-01', '2019-01' */
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("class", "c2p2 matrixAxis top")
            .call(d3.axisTop(x).tickSize(0))
            // .select(".domain").remove()

        // draw y axes
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("class", "c2p2 matrixAxis left")
            .call(d3.axisLeft(y).tickSize(0))
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + matrix_width_c2p2 + "," + 0 + ")")
            .attr("class", "c2p2 matrixAxis right")
            .call(d3.axisRight(y).tickSize(0))

    };

    // *********************************************************************//
    function createMatrixRectangles_c2p2(csv_matrix_annual, csv_annual_count, segments) {

        // create matrix recangles variable
        var transformedMatrix = d3.select(".c2p2.transformedMatrix")
        // var matrixRectangles = svgMatrix.selectAll('matrixRect')

        // read in data
        var myGroups = d3.map(csv_matrix_annual, function(d){return d[timestep_c2p2];}).keys() 
        var myVars = d3.map(csv_matrix_annual, function(d){return d.seg_id_nat;}).keys() 

        // var temporalCountMin = Math.round(Math.min(...domainArrayTemporalCounts));
        // console.log(temporalCountMin)

        // build x scales
        var xscale = d3.scaleBand()
            .range([0,matrix_width_c2p2])
            .domain(myGroups)
            .padding(0.1);

        // build y scales
        var yscale = d3.scaleBand()
            .range([matrix_height_c2p2, 0])
            .domain(myVars)
            .padding(0.1);

        // create a tooltip
        var tooltip = d3.select("#matrixChart_c2p2")
            .append("div")
            .style("opacity", 0)
            .attr("class", "c2p2 tooltip")
            // .style("background-color", "white")
            // .style("border", "solid")
            // .style("border-width", "2px")
            // .style("border-radius", "5px")
            .style("padding", "5px")

        // revised build of spatial rectangles
        var SpatialRectangles = transformedMatrix.selectAll('.c2p2.matrixSpatialRect')           
            .data(segments)
            .enter()
            .append("rect")
            .attr("x", xscale("1980")) 
            .attr("y", function(d) { return yscale(d.seg_id_nat) }) /* d.seg_id_nat */
            // .attr("rx", 1)
            // .attr("ry", 1)
            .attr("width", matrix_width_c2p2)
            .attr("height", yscale.bandwidth() )
            .attr("class", function(d) { 
                return 'c2p2 matrixSpatialRect seg' + d.seg_id_nat;
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
                mouseover_c2p2(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect_c2p2(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p2(d, tooltip);
            })

        // revised build of temporal rectangles
        var TemporalRectangles = transformedMatrix.selectAll('.c2p2.matrixTemporalRect')
            .data(csv_annual_count)
            .enter()
            .append("rect")
            .attr("x", function(d){
                return xscale(d[timestep_c2p2])
            }) 
            .attr("y", 0) /* function(d) { return yscale(0) } */
            // .attr("rx", 1)
            // .attr("ry", 1)
            .attr("width", xscale.bandwidth())
            .attr("height", matrix_height_c2p2)
            .attr("class", function(d) { 
                return 'c2p2 matrixTemporalRect time' + d[timestep_c2p2];
            })
            .style("fill", "#000000") // "#ffffff"
            .style("stroke-width", 2)
            .style("stroke", "#000000") // #ffffff"
            .style("opacity", 0)
            .on("mouseover", function(d) {
                mouseover_c2p2(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect_c2p2(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p2(d, tooltip);
            })
    };

    // *********************************************************************//
    function mousemoveRect_c2p2(data, tooltip, position) {
        if (expressed_c2p2 == 'Space') {
            if (data.properties) {
                var num_obs = data.properties.total_count;
                var yoffset = position[1]+10
                tooltip
                    .html(d3.format(',')(num_obs) + "<p>obs.")
                    // .html("Segment " + data.seg_id_nat)
                    .style("left", 8 + "px")
                    .style("top", yoffset + "px")
                    .style("text-align", "right");
            }
        } else if (expressed_c2p2 = 'Time') {
            if (data.total_annual_count) {
                var xoffset = position[0]+10
                var yoffset = position[1]-5
                tooltip
                    .html(data[timestep_c2p2])
                    .style("left", xoffset + "px")
                    .style("top", yoffset + "px");
            }
        }
    };

    // *********************************************************************//
    function mousemoveSegSpatial_c2p2(data, tooltip, position) {
        if (expressed_c2p2 == 'Space') {
            var num_obs = data.properties.total_count;
            tooltip
                .html(d3.format(',')(num_obs) + "<p>obs.")
                // .html("Segment " + data.seg_id_nat)
                .style("left", position[0]+35 + "px")
                .style("top", position[1]-25 + "px")
                .style("text-align", "left"); /* position[1]+110 */
        } //else if (expressed_c2p2 = 'Time') 
    };
    
    // *********************************************************************//
    function mouseover_c2p2(data, tooltip) {
        if (expressed_c2p2 == 'Space') {

            d3.selectAll(".c2p2.matrixTemporalRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.properties) {
                tooltip
                    .style("opacity", 1);
                d3.selectAll(".c2p2.matrixSpatialRect")
                    .style("opacity", 0.7)
                    .style("stroke-width", 1);
                d3.selectAll(".c2p2.cell.segment" + data.seg_id_nat)
                    .raise()
                d3.selectAll(".c2p2.matrixSpatialRect.seg" + data.seg_id_nat)
                    // .style("fill", function(data) {
                    //     if (data.properties.total_count > 0) { //properties.total_count
                    //         return "#363636";     //0              
                    //     } else {
                    //         return "#000000";
                    //     }
                    // })
                    .style("stroke-width", function(data) {
                        if (data.properties.total_count > 0) { //properties.total_count
                            return 0;     //0.5              
                        } else {
                            return 0.5;
                        }
                    })
                    .style("opacity", function(data) {
                        if (data.properties.total_count > 0) { //properties.total_count
                            return 0;       //1            
                        } else {
                            return 1;
                        }
                    })
                    .style("stroke", function(data) {
                        if (data.properties.total_count > 0) {
                            return "None";       //"#363636"            
                        } else {
                            return "#ffffff"; //red
                        }
                    })
                    .raise();
                // d3.selectAll(".c2p2.cell.segment" + data.seg_id_nat)
                //     .raise()
                d3.selectAll(".c2p2.delaware_bay")
                    .style("fill", "#172c4f")
                d3.selectAll(".c2p2.river_segments")
                    .style("stroke", "#172c4f")
                d3.selectAll(".c2p2.river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "#ffffff")
                    .attr("opacity", 1)
                    .attr("filter", "url(#shadow1)")
                    .raise()
            } 
        } else if (expressed_c2p2 = 'Time') {

            d3.selectAll(".c2p2.matrixSpatialRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.total_annual_count) {
                tooltip
                    .style("opacity", 1);
                d3.selectAll(".c2p2.matrixTemporalRect")
                    .style("opacity", 0.8)
                    .style("stroke-width", 2);
                d3.selectAll(".c2p2.matrixTemporalRect.time" + data[timestep_c2p2])
                    .style("opacity", 0)
                d3.selectAll(".c2p2.delaware_bay")
                    .style("fill", "#172c4f")
                d3.selectAll(".c2p2.river_segments")
                    .style("stroke", "#172c4f")
                d3.selectAll(".c2p2.river_segments." + timestep_c2p2 + data[timestep_c2p2])
                    .style("stroke", "#ffffff")
                    .attr("opacity", 1)
                    .raise()
            } 
        }
            
    };

    // *********************************************************************//
    function mouseout_c2p2(data, tooltip) {
        if (expressed_c2p2 == 'Space') {

            d3.selectAll(".c2p2.matrixTemporalRect")
                .style("fill", "#000000")
                .style("stroke", "#000000")
                .style("stroke-width", 2) 

            if (data.properties) {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".c2p2.matrixSpatialRect") /* .matrixRect.seg" + data.seg_id_nat */
                    .style("stroke", "None")    
                    .style("stroke", "#000000") // "#ffffff"
                    .style("fill", "#000000") // "#ffffff"
                    .style("stroke-width", 2)
                    .style("opacity", 0)
                d3.selectAll(".c2p2.matrixSpatialRect" + data.seg_id_nat)
                    .lower()
                d3.selectAll(".c2p2.cell.segment" + data.seg_id_nat)
                    .lower()
                d3.selectAll(".c2p2.delaware_bay")
                    .style("fill", "#6079a3")
                d3.selectAll(".c2p2.river_segments")
                    .style("stroke", "#6079a3")
                d3.selectAll(".c2p2.river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                    .attr("filter","None")
                    .lower()
                d3.selectAll("g")
                    .raise()
            } 

        } else if (expressed_c2p2 = 'Time') {

            d3.selectAll(".c2p2.matrixSpatialRect")
                .style("fill", "#000000") // #ffffff
                .style("stroke", "#000000")
                .style("stroke-width", 2)

            if (data.total_annual_count)  {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".c2p2.matrixTemporalRect") 
                    .style("stroke", "#000000") // #ffffff
                    .style("fill", "#000000") // #ffffff
                    .style("stroke-width", 2)
                    .style("opacity", 0)
                d3.selectAll(".c2p2.delaware_bay")
                    .style("fill", "#6079a3")
                d3.selectAll(".c2p2.river_segments")
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                d3.selectAll(".c2p2.river_segments." + timestep_c2p2 + data[timestep_c2p2])
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                    .lower()
            } 
        }

    };

    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//

    function setSegments_c2p3(segments, stations, bay, map, map_path, widthScale, colorScale){
            
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "c2p3 delaware_bay")
            .attr("d", map_path);

        // set tooltip
        var tooltip = d3.select("#DRB_map_c2p3")
            .append("div")
            .style("opacity", 0)
            .attr("class", "c2p3 tooltip")
            // .style("background-color", "white")
            // .style("border", "solid")
            // .style("border-width", "2px")
            // .style("border-radius", "5px")
            .style("padding", "5px")


        // add drb segments to map
        var drb_segments = map.selectAll("river_segments")
            // bind segments to each element to be created
            .data(segments)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // assign class for styling
            .attr("class", function(d){
                var seg_class = 'c2p3 river_segments seg'
                seg_class += d.seg_id_nat
                for (key in d.properties.day_count) {
                    if (d.properties.day_count[key]) {
                        seg_class += " " + timestep_c2p3 + key
                    }
                }
                return seg_class

                // return "c2p3 river_segments seg" + d.seg_id_nat; /* d.properties.seg_id_nat */
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
                mouseover_c2p3(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveSegSpatial_c2p3(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p3(d, tooltip);
            });

        
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
        //         return "c2p3 obs_stations station" + d.id
        //     })
        //     // project points
        //     .attr("d", path)
        //     .attr("radius", 6)
        //     .style("fill", "Red")
        //     .style("stroke", "None")
            // .on("mouseover", function(d) {
            //     mouseover_c2p3(d, tooltip);
            // })
            // .on("mousemove", function(d) {
            //     position = d3.mouse(this);
            //     mousemoveSegSpatial_c2p3(d, tooltip, position);
            // })
            // .on("mouseout", function(d) {
            //     mouseout_c2p3(d, tooltip);
            // });
    };

    // *********************************************************************//
    // fuction to create a dropdown menu for attribute selection
    function createDropdown_c2p3(selectList_c2p3, csv_matrix_daily_2019, csv_daily_count_2019, segments){
        // add select element
        var dropdown = d3.select("#matrixChart_c2p3")
            // append the select element to the body
            .append("select")
            // add class for styling
            .attr("class", "dropdown")
            // add event listener
            .on("change", function(){
                // call listener handler function
                changeInteractionDimension_c2p3(this.value, csv_matrix_daily_2019, csv_daily_count_2019, segments)
            });

        // add initial option
        var titleOption = dropdown.append("option")
            // create a title option element with no value attribute
            .attr("class", "titleOption")
            // ensure that users cannot select it
            .attr("disabled", "true")
            // add an affordance to let users know they can interact with the dropdown menu
            .text("Interaction Dimension: " + expressed_c2p3);

        // add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            // bind data to the elements to be created
            .data(selectList_c2p3)
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
    function changeInteractionDimension_c2p3(dimension, csv_matrix_daily_2019, csv_daily_count_2019, segments){
        // reset expressed_c2p3 dimension based on selected dimension
        expressed_c2p3 = dimension;
    };

    // *********************************************************************//
    function createMatrix_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments, timestep_c2p3){
       
        // append the svg object ot the body of the page
        var svgMatrix = d3.select("#matrixChart_c2p3")
            .append("svg")
                .attr("width", matrix_width_c2p3 + matrix_margin.left + matrix_margin.right)
                .attr("height", matrix_height_c2p3 + matrix_margin.top + matrix_margin.bottom)
                .attr("class", "c2p3 matrix")
            .append("g")
                .attr("class", "c2p3 transformedMatrix")
                .attr("transform",
                    "translate(" + matrix_margin.left + "," + matrix_margin.top + ")");

        // read in data
        var myGroups = d3.map(csv_matrix_daily_2019, function(d){return d[timestep_c2p3];}).keys() 
        var myVars = d3.map(csv_matrix_daily_2019, function(d){return d.seg_id_nat;}).keys() 

        // build array of all values of observed temperature
        var arrayObsTemps = [];
        for (var i=0; i<csv_matrix_daily_2019.length; i++){
            var val = parseFloat(csv_matrix_daily_2019[i]['temp_c']);
            if (val){
                arrayObsTemps.push(val);
            } else {
                continue
            }
        };

        console.log("temp list")
        console.log(arrayObsTemps)

        var obsTempMax = Math.round(Math.max(...arrayObsTemps));
        console.log(obsTempMax)

        var obsTempMin = Math.round(Math.min(...arrayObsTemps));
        console.log(obsTempMin)

        // build x scales
        var x = d3.scaleBand()
            .range([0,matrix_width_c2p3])
            .domain(myGroups)
            .padding(0.1);

        // build y scales
        var y = d3.scaleBand()
            .range([matrix_height_c2p3, 0])
            .domain(myVars)
            .padding(0.1);

        // color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateRdYlBu) /* interpolatePlasma */
            .domain([obsTempMax,obsTempMin]) // if INVERTING color scale
            // .domain([obsTempMin, obsTempMax]) // if NOT INVERTING color scale
              
        // add the squares
        var matrixSquares = svgMatrix.selectAll('matrixSqs')
            .data(csv_matrix_daily_2019, function(d) {
                if (d.total_obs > 0) {
                    return d[timestep_c2p3] +':'+ d.seg_id_nat; /* d.seg_id_nat */
                }
            }) 
            .enter()
            .filter(function (d){
                return d.obs_count > 0
            })
            .append("rect")
            .attr("x", function (d){
                return x(d[timestep_c2p3])
            })
            .attr("y", function(d) { 
                return y(d.seg_id_nat)
            })
            // .attr("rx", 1)
            // .attr("ry", 1 )
            .attr("width", x.bandwidth())
            .attr("x", function(d) {
               return x(d[timestep_c2p3])
            })
            .attr("height", y.bandwidth())
            .attr("class", function(d) { 
                return 'c2p3 cell segment' + d.seg_id_nat + ' timestep' + d[timestep_c2p3]
            })
            .style("fill", function(d) {
                return myColor(d.temp_c);
            })
            .style("stroke-width", 0.5)
            // .style("stroke", "None") //"None"
            .style("stroke", function(d){
                return myColor(d.temp_c);
            })
            .style("opacity", 1);

        // add the rectangles
        createMatrixRectangles_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments)

        // draw x axes
        var parseTime = d3.timeParse("%Y-%m-%d");
        console.log(parseTime('2019-01-01'))
        var formatTime = d3.timeFormat("%B");
        console.log(formatTime(parseTime('2019-01-01')))

        svgMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + matrix_height_c2p3 + ")")
            .attr("class", "c2p3 matrixAxis bottom")
            .call(d3.axisBottom(x).tickSize(0).tickValues(['2019-01-01', '2019-03-01', '2019-05-01', '2019-07-01', '2019-09-01', '2019-11-01'])) //.tickFormat(formatTime(parseTime()))
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("class", "c2p3 matrixAxis top")
            .call(d3.axisTop(x).tickSize(0))
            // .select(".domain").remove()

        // draw y axes
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("class", "c2p3 matrixAxis left")
            .call(d3.axisLeft(y).tickSize(0))
            // .select(".domain").remove()
        svgMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + matrix_width_c2p3 + "," + 0 + ")")
            .attr("class", "c2p3 matrixAxis right")
            .call(d3.axisRight(y).tickSize(0))

    };

    // *********************************************************************//
    function createMatrixRectangles_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments) {

        // create matrix recangles variable
        var transformedMatrix = d3.select(".c2p3.transformedMatrix")
        // var matrixRectangles = svgMatrix.selectAll('matrixRect')

        // read in data
        var myGroups = d3.map(csv_matrix_daily_2019, function(d){return d[timestep_c2p3];}).keys() 
        var myVars = d3.map(csv_matrix_daily_2019, function(d){return d.seg_id_nat;}).keys() 

        // var temporalCountMin = Math.round(Math.min(...domainArrayTemporalCounts));
        // console.log(temporalCountMin)

        // build x scales
        var xscale = d3.scaleBand()
            .range([0,matrix_width_c2p3])
            .domain(myGroups)
            .padding(0.1);

        // build y scales
        var yscale = d3.scaleBand()
            .range([matrix_height_c2p3, 0])
            .domain(myVars)
            .padding(0.1);

        // create a tooltip
        var tooltip = d3.select("#matrixChart_c2p3")
            .append("div")
            .style("opacity", 0)
            .attr("class", "c2p3 tooltip")
            // .style("background-color", "white")
            // .style("border", "solid")
            // .style("border-width", "2px")
            // .style("border-radius", "5px")
            .style("padding", "5px")

        // revised build of spatial rectangles
        var SpatialRectangles = transformedMatrix.selectAll('.c2p3.matrixSpatialRect')           
            .data(segments)
            .enter()
            .append("rect")
            .attr("x", xscale("2019-01-01")) 
            .attr("y", function(d) { return yscale(d.seg_id_nat) }) 
            // .attr("rx", 1)
            // .attr("ry", 1)
            .attr("width", matrix_width_c2p3)
            .attr("height", yscale.bandwidth() )
            .attr("class", function(d) { 
                return 'c2p3 matrixSpatialRect seg' + d.seg_id_nat;
            })
            .style("fill", function(d) { 
                if (d.properties.year_count['2019'] > 0) {
                    return "#000000"; // "#ffffff"                  
                } else {
                    return "#000000";  /*"#ffffff"*/
                }
            })
            .style("stroke-width", 2)
            .style("stroke", "#000000") // "#ffffff"
            .style("opacity", function(d) {
                if (d.properties.year_count['2019'] > 0) {
                    return 0;                   
                } else {
                    return 0; 
                }
            })
            // .on("click", function(d){
            //     clickRectSpatial(d, tooltip);
            // })
            .on("mouseover", function(d) {
                mouseover_c2p3(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect_c2p3(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p3(d, tooltip);
            })

        // revised build of temporal rectangles
        var TemporalRectangles = transformedMatrix.selectAll('.c2p3.matrixTemporalRect')
            .data(csv_daily_count_2019)
            .enter()
            .append("rect")
            .attr("x", function(d){
                return xscale(d[timestep_c2p3])
            }) 
            .attr("y", 0) /* function(d) { return yscale(0) } */
            // .attr("rx", 1)
            // .attr("ry", 1)
            .attr("width", xscale.bandwidth())
            .attr("height", matrix_height_c2p3)
            .attr("class", function(d) { 
                return 'c2p3 matrixTemporalRect time' + d[timestep_c2p3];
            })
            .style("fill", "#000000") // "#ffffff"
            .style("stroke-width", 0.6)
            .style("stroke", "#000000") // #ffffff"
            .style("opacity", 0)
            .on("mouseover", function(d) {
                mouseover_c2p3(d, tooltip);
            })
            .on("mousemove", function(d) {
                position = d3.mouse(this);
                mousemoveRect_c2p3(d, tooltip, position);
            })
            .on("mouseout", function(d) {
                mouseout_c2p3(d, tooltip);
            })
    };

    // *********************************************************************//
    function mousemoveRect_c2p3(data, tooltip, position) {
        if (expressed_c2p3 == 'Space') {
            if (data.properties) {
                var num_obs = data.properties.year_count['2019'];
                var yoffset = position[1]+10
                tooltip
                    .html(d3.format(',')(num_obs) + "<p>obs.")
                    // .html("Segment " + data.seg_id_nat)
                    .style("left", 8 + "px")
                    .style("top", yoffset + "px")
                    .style("text-align", "right");
            }
        } else if (expressed_c2p3 = 'Time') {
            if (data.total_daily_count) {
                var xoffset = position[0]-15
                var yoffset = position[1]-5
                tooltip
                    .html(data[timestep_c2p3])
                    .style("left", xoffset + "px")
                    .style("top", yoffset + "px");
            }
        }
    };

    // *********************************************************************//
    function mousemoveSegSpatial_c2p3(data, tooltip, position) {
        if (expressed_c2p3 == 'Space') {
            var num_obs = data.properties.year_count['2019'];
            tooltip
                .html(d3.format(',')(num_obs) + "<p>obs.")
                // .html("Segment " + data.seg_id_nat)
                .style("left", position[0]+35 + "px")
                .style("top", position[1]-25 + "px")
                .style("text-align", "left"); /* position[1]+110 */
        } //else if (expressed_c2p3 = 'Time') 
    };
    
    // *********************************************************************//
    function mouseover_c2p3(data, tooltip) {
        if (expressed_c2p3 == 'Space') {

            d3.selectAll(".c2p3.matrixTemporalRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.properties) {
                tooltip
                    .style("opacity", 1);
                d3.selectAll(".c2p3.matrixSpatialRect")
                    .style("opacity", 0.8)
                    .style("stroke-width", 1);
                d3.selectAll(".c2p3.cell.segment" + data.seg_id_nat)
                    .raise()
                d3.selectAll(".c2p3.matrixSpatialRect.seg" + data.seg_id_nat)
                    .style("stroke-width", function(data) {
                        if (data.properties.year_count['2019'] > 0) { //properties.total_count
                            return 0;                   
                        } else {
                            return 0.5;
                        }
                    })
                    .style("opacity", function(data) {
                        if (data.properties.year_count['2019'] > 0) { //properties.total_count
                            return 0;                   
                        } else {
                            return 1;
                        }
                    })
                    .style("stroke", function(data) {
                        if (data.properties.year_count['2019'] > 0) {
                            return "None";                   
                        } else {
                            return "#ffffff"; //red
                        }
                    })
                    .raise();
                d3.selectAll(".c2p3.delaware_bay")
                    .style("fill", "#172c4f")
                d3.selectAll(".c2p3.river_segments")
                    .style("stroke", "#172c4f")
                d3.selectAll(".c2p3.river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "#ffffff")
                    .attr("opacity", 1)
                    .attr("filter", "url(#shadow1)")
                    .raise()
            } 
        } else if (expressed_c2p3 = 'Time') {
            console.log(".c2p3.matrixTemporalRect.time" + data[timestep_c2p3])

            d3.selectAll(".c2p3.matrixSpatialRect")
                .style("fill", "None")
                .style("stroke", "None")

            if (data.total_daily_count) {
                tooltip
                    .style("opacity", 1)
                d3.selectAll(".c2p3.matrixTemporalRect")
                    .style("opacity", 0.8)
                    // .style("stroke", "rgba(0, 0, 0, 0)")
                    .style("stroke-width", 0.6)
                // d3.selectAll(".c2p3.cell.timestep" + data[timestep_c2p3])
                //     .raise()
                d3.selectAll(".c2p3.matrixTemporalRect.time" + data[timestep_c2p3])
                    .style("opacity", 0)
                    // .raise()
                d3.selectAll(".c2p3.delaware_bay")
                    .style("fill", "#172c4f")
                d3.selectAll(".c2p3.river_segments")
                    .style("stroke", "#172c4f")
                d3.selectAll(".c2p3.river_segments." + timestep_c2p3 + data[timestep_c2p3])
                    .style("stroke", "#ffffff")
                    .attr("opacity", 1)
                    .raise()
            } 
        }
            
    };

    // *********************************************************************//
    function mouseout_c2p3(data, tooltip) {
        if (expressed_c2p3 == 'Space') {

            d3.selectAll(".c2p3.matrixTemporalRect")
                .style("fill", "#000000")
                .style("stroke", "#000000")
                .style("stroke-width", 0.6) 

            if (data.properties) {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".c2p3.matrixSpatialRect") /* .matrixRect.seg" + data.seg_id_nat */
                    .style("stroke", "None")    
                    .style("stroke", "#000000") // "#ffffff"
                    .style("fill", "#000000") // "#ffffff"
                    .style("stroke-width", 2)
                    .style("opacity", 0)
                d3.selectAll(".c2p3.matrixSpatialRect" + data.seg_id_nat)
                    .lower()
                d3.selectAll(".c2p3.cell.segment" + data.seg_id_nat)
                    .lower()
                d3.selectAll(".c2p3.delaware_bay")
                    .style("fill", "#6079a3")
                d3.selectAll(".c2p3.river_segments")
                    .style("stroke", "#6079a3")
                d3.selectAll(".c2p3.river_segments.seg" + data.seg_id_nat)
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                    .attr("filter","None")
                    .lower()
                d3.selectAll("g")
                    .raise()
            } 

        } else if (expressed_c2p3 = 'Time') {

            d3.selectAll(".c2p3.matrixSpatialRect")
                .style("fill", "#000000") // #ffffff
                .style("stroke", "#000000")
                .style("stroke-width", 2)

            if (data.total_daily_count)  {
                tooltip
                    .style("opacity", 0)
                d3.selectAll(".c2p3.matrixTemporalRect") 
                    .style("stroke", "#000000") // #ffffff
                    .style("fill", "#000000") // #ffffff
                    .style("stroke-width", 0.6)
                    .style("stroke-opacity", 0)
                    .style("opacity", 0)
                // d3.selectAll(".c2p3.matrixTemporalRect.time" + data[timestep_c2p3])
                    // .style("stroke", "#000000") // #ffffff
                    // .style("fill", "#000000") // #ffffff
                    // .style("stroke-width", 0.6)
                    // .style("stroke-opacity", 0)
                    // .style("opacity", 0)    
                    // .lower()
                // d3.selectAll(".c2p3.cell.timestep" + data[timestep_c2p3])
                //     .raise()
                d3.selectAll(".c2p3.delaware_bay")
                    .style("fill", "#6079a3")
                d3.selectAll(".c2p3.river_segments")
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                d3.selectAll(".c2p3.river_segments." + timestep_c2p3 + data[timestep_c2p3])
                    .style("stroke", "#6079a3")
                    .attr("opacity", 1)
                    .lower()
            } 
        }

    };



})();