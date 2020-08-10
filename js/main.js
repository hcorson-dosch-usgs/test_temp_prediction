(function(){
    
    // // psuedo-global variables

    // variables for data join
    var flowArray = ['avg_ann_flow']

    // begin script when window loads
    window.onload = setPanels();

    // timestep variables for linked networks and matrices
    var timestep_c2p2 = 'year'
    var timestep_c2p3 = 'date'

    // margins, width and height for bar chart
    var chart_margin = {top: 30, right: 60, bottom: 45, left: 5},
        chart_width = 500 - chart_margin.left - chart_margin.right, //500
        chart_height = window.innerHeight*0.30 - chart_margin.top - chart_margin.bottom;

    // margins, width and height for matrix charts
    var matrix_margin = {top: 15, right: 15, bottom: 15, left: 35},
        matrix_width_c2p2 = 700 - matrix_margin.left - matrix_margin.right, //500
        matrix_width_c2p3 = 700 - matrix_margin.left - matrix_margin.right,
        matrix_height_c2p2 = window.innerHeight*0.9 - matrix_margin.top - matrix_margin.bottom,
        matrix_height_c2p3 = window.innerHeight*0.9 - matrix_margin.top - matrix_margin.bottom;
    
    // *********************************************************************//
    function setPanels(){

        // // CHAPTER 1 MAP
        var map_width_c1p1 = 600,
            map_height_c1p1 = window.innerHeight*0.8,
            map_margin_c1p1 = {top: 5, right: 5, bottom: 5, left: 5};

        //create Albers equal area conic projection centered on states surrounding DRB for ch1 maps
        var map_projection_c1p1 = d3.geoAlbers()
            .center([0, 41.27883611]) //41.47883611
            .rotate([76.21902778, 0, 0])
            .parallels([40.31476574, 42.64290648])
            .scale(map_height_c1p1*6.5) // map_height_c1p1*6
            .translate([map_width_c1p1 / 2, map_height_c1p1 / 2]);

        var map_path_c1p1 = d3.geoPath()
            .projection(map_projection_c1p1);

        // create scale bar
        const scaleBarTop_c1p1 = d3.geoScaleBar()
            .orient(d3.geoScaleBottom)
            .projection(map_projection_c1p1)
            .size([map_width_c1p1, map_height_c1p1])
            .left(.05)
            .top(.85)
            .units(d3.geoScaleKilometers)
            .distance(150)
            .label("150 kilometers")
            .labelAnchor("middle")
            .tickSize(null)
            .tickValues(null);

        const scaleBarBottom_c1p1 = d3.geoScaleBar()
            .orient(d3.geoScaleTop)
            .projection(map_projection_c1p1)
            .size([map_width_c1p1, map_height_c1p1])
            .left(.05)
            .top(.86)
            .units(d3.geoScaleMiles)
            .distance(75)
            .label("75 miles")
            .labelAnchor("middle")
            .tickSize(null)
            .tickValues(null);

        //create new svg container for the ch 1 panel 1 map
        var map_c1p1 = d3.select("#DRB_map_c1p1")
            .append("svg")
            .attr("class", "map_c1p1")
            .attr("viewBox", [0, 0, (map_width_c1p1 + map_margin_c1p1.right + map_margin_c1p1.left), 
                                    (map_height_c1p1 + map_margin_c1p1.top + map_margin_c1p1.bottom)].join(' '));
            // .attr("width", map_width_c1p1)
            // .attr("height", map_height_c1p1);

        // // CHAPTER 2 BAR CHART
        // write function to process data for stacked bar chart in chapter 2 panel 1
        function type(d, i, columns) {
            for (i=1, t=0; i < columns.length; ++i) 
                // for each row, which is d, cycle through the columns
                t += d[columns[i]] = +d[columns[i]];
                // create a new column in the data titled "total"
                d.total = t;
                return d;
            
        }

        // // CHAPTER 2 MAPS
        // set universal map frame dimensions for Ch 2 panel maps
        var map_width = 600,
            map_height = window.innerHeight*0.8,
            map_margin = {top: 5, right: 5, bottom: 5, left: 5};

        //create Albers equal area conic projection centered on DRB for ch2 panel 1 map
        var map_projection_c2p1 = d3.geoAlbers()
            .center([0, 40.658894445])
            .rotate([75.533333335, 0, 0]) //75.363333335 centered, 76.2 far right, 74.6 far left
            .parallels([39.9352537033, 41.1825351867])
            .scale(map_height*15)
            .translate([map_width / 2, map_height / 2]);

        var map_path_c2p1 = d3.geoPath()
            .projection(map_projection_c2p1);     
            
        // create scale bar for ch 2 panel 1 map
        const scaleBarTop_c2p1 = d3.geoScaleBar()
            .orient(d3.geoScaleBottom)
            .projection(map_projection_c2p1)
            .size([map_width, map_height])
            .left(.3) // .15 centered, .45 far right
            .top(.94)
            .units(d3.geoScaleKilometers)
            .distance(50)
            .label("50 kilometers")
            .labelAnchor("middle")
            .tickSize(null)
            .tickValues(null);

        const scaleBarBottom_c2p1 = d3.geoScaleBar()
            .orient(d3.geoScaleTop)
            .projection(map_projection_c2p1)
            .size([map_width, map_height])
            .left(.3) // .15 centered, .45 far right
            .top(.95)
            .units(d3.geoScaleMiles)
            .distance(25)
            .label("25 miles")
            .labelAnchor("middle")
            .tickSize(null)
            .tickValues(null);

        //create Albers equal area conic projection centered on DRB for ch2 panel 2 and 3 maps
        var map_projection = d3.geoAlbers()
            .center([0, 40.658894445])
            .rotate([74.6, 0, 0]) //75.363333335 centered, 76.2 far right, 74.6 far left
            .parallels([39.9352537033, 41.1825351867])
            .scale(map_height*15)
            .translate([map_width / 2, map_height / 2]);

        var map_path = d3.geoPath()
            .projection(map_projection);

        // create scale bar for ch 2 panel 2 and 3 maps
        const scaleBarTop = d3.geoScaleBar()
            .orient(d3.geoScaleBottom)
            .projection(map_projection)
            .size([map_width, map_height])
            .left(.1) // .15 centered, .45 far right
            .top(.94)
            .units(d3.geoScaleKilometers)
            .distance(50)
            .label("50 kilometers")
            .labelAnchor("middle")
            .tickSize(null)
            .tickValues(null);

        const scaleBarBottom = d3.geoScaleBar()
            .orient(d3.geoScaleTop)
            .projection(map_projection)
            .size([map_width, map_height])
            .left(.1) // .15 centered, .45 far right
            .top(.95)
            .units(d3.geoScaleMiles)
            .distance(25)
            .label("25 miles")
            .labelAnchor("middle")
            .tickSize(null)
            .tickValues(null);

        //create new svg container for the ch 2 panel 1 map
        var map_c2p1 = d3.select("#DRB_map_c2p1")
            .append("svg")
            .attr("class", "map_c2p1")
            .attr("viewBox", [0, 0, (map_width + map_margin.right + map_margin.left), 
                                    (map_height + map_margin.top + map_margin.bottom)].join(' '));
            // .attr("width", map_width)
            // .attr("height", map_height);

        //create new svg container for the ch 2 panel 2 map
        var map_c2p2 = d3.select("#DRB_map_c2p2")
            .append("svg")
            .attr("class", "map_c2p2")
            .attr("viewBox", [0, 0, (map_width + map_margin.right + map_margin.left), 
                                    (map_height + map_margin.top + map_margin.bottom)].join(' '));
            // .attr("width", map_width)
            // .attr("height", map_height);

        // create new svg container for the ch 2 panel 3 map
        var map_c2p3 = d3.select("#DRB_map_c2p3")
            .append("svg")
            .attr("class", "map_c2p3")
            .attr("viewBox", [0, 0, (map_width + map_margin.right + map_margin.left), 
                                    (map_height + map_margin.top + map_margin.bottom)].join(' '));
            // .attr("width", map_width)
            // .attr("height", map_height);
       
        // parallelize asynchronous data loading // 
        var promises = [d3.csv("data/segment_maflow.csv"),
                        d3.csv("data/matrix_annual_obs.csv"), 
                        d3.csv("data/obs_annual_count.csv"),
                        d3.csv("data/matrix_daily_2019_obs.csv"),
                        d3.csv("data/obs_daily_count_2019.csv"),
                        d3.csv("data/agency_annual_count.csv", type), // process data for stacked bar chart as it is loaded
                        d3.json("data/segment_geojson.json"),
                        d3.json("data/observed_site_locations.json"), 
                        d3.json("data/NHDWaterbody_DelawareBay_pt6per_smooth.json"),
                        d3.json("data/reservoirs.json"),
                        d3.json("data/dams.json"),
                        d3.json("data/Segments_subset_4per_smooth_10miBuffer_diss.json"),
                        d3.json("data/cb_states_16per.json"),
                        d3.json("data/Segments_subset_1per_smooth.json"),
                        d3.json("data/cb_states_16per_merged.json")
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
            csv_agency_count = data[5];
            json_segments = data[6];
            json_obs_stations = data[7];
            json_bay = data[8];
            json_reservoirs = data[9];
            json_dams = data[10];
            json_basin_buffered = data[11];
            json_states = data[12];
            json_segs_small = data[13];
            json_states_merged = data[14];

            // translate topojsons
            var segments = json_segments.features; /* topojson.feature(json_segments, json_segments.objects.Segments_subset_4per_smooth).features */
            var stations = json_obs_stations.features;
            var bay = topojson.feature(json_bay, json_bay.objects.NHDWaterbody_DelawareBay_pt6per_smooth);
            var reservoirs = json_reservoirs.features;
            var dams = json_dams.features;
            var basin_buffered = topojson.feature(json_basin_buffered, json_basin_buffered.objects.Segments_subset_4per_smooth_10miBuffer_diss);
            var states = topojson.feature(json_states, json_states.objects.cb_states);
            var segs_small = topojson.feature(json_segs_small, json_segs_small.objects.Segments_subset_1per_smooth).features;
            var states_merged = topojson.feature(json_states_merged, json_states_merged.objects.cb_states_16per_merged);

            // // join csv flow data to geojson segments
            // ch 1 p 1 map segments
            segs_small = joinData(segs_small, csv_flow);
            // ch 2 map segments
            segments = joinData(segments, csv_flow);
            

            // // set stroke width scale
            // for ch 1 p 1 map segments
            var widthScale_c1p1 = makeWidthScale_c1p1(csv_flow);
            // for ch 2 map segments
            var widthScale_c2 = makeWidthScale_c2(csv_flow);

            // // Set up Ch 1 panel 1 -
            setMap_c1p1(states, states_merged, segs_small, bay, map_c1p1, map_path_c1p1, scaleBarTop_c1p1, scaleBarBottom_c1p1, widthScale_c1p1);

            // // Set up Ch 2 panel 1 -
            // add DRB segments to the panel 1 map
            setMap_c2p1(segments, stations, bay, map_c2p1, map_path_c2p1, scaleBarTop_c2p1, scaleBarBottom_c2p1, widthScale_c2);
            // add bar chart to panel 1
            setBarChart_c2p1(csv_agency_count);

            // // Set up Ch 2 panel 2 - 
            // add DRB segments to the panel 2 map
            setMap_c2p2(map_width, map_height, segments, bay, reservoirs, basin_buffered, map_c2p2, map_path, scaleBarTop, scaleBarBottom, widthScale_c2);
            // create panel 2 matrix
            createMatrix_c2p2(csv_matrix_annual, csv_annual_count, segments, timestep_c2p2);

            // // Set up Ch 2 panel 3 - 
            // // add DRB segments to the panel 3 map
            setMap_c2p3(map_width, map_height, segments, bay, reservoirs, basin_buffered, map_c2p3, map_path, scaleBarTop, scaleBarBottom, widthScale_c2);
            // // create panel 3 matrix
            createMatrix_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments, timestep_c2p3);

        };
    };

    // *********************************************************************//
    // join flow data to segment spatial data

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
                if (segments[a].seg_id_nat){
                    var geojsonKey = segments[a].seg_id_nat; /* geojsonProps.seg_id_nat */
                } else {
                    var geojsonKey = geojsonProps.seg_id_nat;
                }
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
    // make width scale to scale segment strokes by streamflow for Chapter 1 p 1 map
    // graduated and linear scale options - currently using graduated as prefer look

    function makeWidthScale_c1p1(data){
        
        // // graduated scale
        // set width classes
        var widthClasses = [
            0.5,
            0.7,
            1.2,
            1.5,
            2
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
        var clusters = ss.ckmeans(domainArrayFlow, 5);
        // console.log(clusters);

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
    // make width scale to scale segment strokes by streamflow for Chapter 2 maps
    // graduated and linear scale options - currently using graduated as prefer look

    function makeWidthScale_c2(data){
      
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
        // console.log(clusters);

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
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//

    // Chapter 1 Panel 1 components

    function setMap_c1p1(states, states_merged, segs_small, bay, map_c1p1, map_path_c1p1, scaleBarTop_c1p1, scaleBarBottom_c1p1, widthScale_c1p1) {

        // add merged surrounding states to map
        var states_merged = map_c1p1.append("path")
            .datum(states_merged)
            .attr("class", "c1p1 states_merged")
            .attr("d", map_path_c1p1)
            .attr("filter", "url(#shadow2)")            

        // add surrounding states to map
        var states = map_c1p1.append("path")
            .datum(states)
            .attr("class", "c1p1 states")
            .attr("d", map_path_c1p1)

        // add delaware bay to map
        var drb_bay = map_c1p1.append("path")
            .datum(bay)
            .attr("class", "c1p1 delaware_bay")
            .attr("d", map_path_c1p1)
        
        // add drb segments to map
        var drb_segments = map_c1p1.selectAll(".river_segments")
            // bind segments to each element to be created
            .data(segs_small)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // assign class for styling
            .attr("class", function(d){
                var seg_class = 'c1p1 river_segments seg'
                seg_class += d.seg_id_nat
                return seg_class
            })
            // project segments
            .attr("d", map_path_c1p1)
            // add stroke width based on widthScale function
            .style("stroke-width", function(d){
                var value = d.properties['avg_ann_flow'];
                if (value){
                    return widthScale_c1p1(value);
                } else {
                    return "#ccc";
                }
            })
            // set fill to none
            .style("fill", "None")

        // add scale bar
        map_c1p1.append("g").call(scaleBarTop_c1p1)
        map_c1p1.append("g").call(scaleBarBottom_c1p1)
   };


    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//

    // Chapter 2 panel 1 components

    // add chapter 2 panel 1 map
    function setMap_c2p1(segments, stations, bay, map, map_path, scaleBarTop, scaleBarBottom, widthScale_c2){
                  
        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "c2p1 delaware_bay")
            .attr("d", map_path)


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
                return 'c2p1 river_segments seg' + d.seg_id_nat
            })
            // project segments
            .attr("d", map_path)
            // add stroke width based on widthScale function
            .style("stroke-width", function(d){
                var value = d.properties['avg_ann_flow'];
                if (value){
                    return widthScale_c2(value);
                } else {
                    return "#ccc";
                }
            })
            // set fill to none
            .style("fill", "None")

      
        // add drb stations to map
        var drb_stations = map.selectAll(".obs_stations")
            // bind points to each element to be created
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
            // assign fill color based on agency
            .style("fill", function(d){
                if (d.properties.site_agency == 'USGS'){
                    return "#edb932"  
                } else {
                    return "#eb4444"
                }
            })
            // assign stroke in background color
            .style("stroke", "#000000")
            .style("stroke-width", 0.4)
            // assign opacity
            .style("opacity", 1)

        // add scale bar
        map.append("g").call(scaleBarTop)
        map.append("g").call(scaleBarBottom)

    };

    // *********************************************************************//
    // add Ch 2 panel 1 stacked bar chart
    function setBarChart_c2p1(csv_agency_count){

        // append svg to div
        var svgChart = d3.select("#barChart_c2p1")
            .append("svg")
                .attr("viewBox", [0, 0, (chart_width +  chart_margin.right + chart_margin.left), 
                                        (chart_height + chart_margin.top + chart_margin.bottom)].join(' '))
                // .attr("width", chart_width + chart_margin.left + chart_margin.right)
                // .attr("height", chart_height + chart_margin.top + chart_margin.bottom)
                .attr("class", "c2p1 barChart")
            g = svgChart.append("g")
                .attr("class", "c2p1 transformedBarChart")
                .attr("transform", "translate(" + chart_margin.left + "," + chart_margin.top + ")");             

        // define x
        var x = d3.scaleBand()
            .rangeRound([0, chart_width])
            // set padding between bars   
            .padding(0.3)
            
        
        // make y scale
        var y = d3.scaleLinear()
            .range([chart_height, 0]);

        // set colors
        var z = d3.scaleOrdinal()
            .range(["#edb932", "#eb4444"]);
        
        // stack to create an array for each of the series in the data
        var stack = d3.stack();

        // load processed data
        data = csv_agency_count

        // set x domain - create an array of the two site agency categories
        x.domain(data.map(function(d) { return d.year; }));

        // set y domain
        y.domain([0, d3.max(data, function(d) { return d.total })]).nice();

        // remove the year column from the data
        z.domain(data.columns.slice(1));

        // set up the series
        g.selectAll(".series")
            // keys for the stack are all but the first column
            .data(stack.keys(data.columns.slice(1))(data))
            // each agency series is given its own g
            .enter().append("g")
                .attr("class", "series")
                // keys passed to the z domain to be assigned a color
                .attr("fill", function(d) { return z(d.key); })
            .selectAll("rect")
                .data(function(d) { return d;})
                .enter().append("rect")
                    // set x attribute based on year
                    .attr("x", function(d) { return x(d.data.year); })
                    // from the slice method d is a pair of coordinates, the upper and lower
                    // bounds of the area to be displayed. This sets the upper y value
                    .attr("y", function(d) { return y(d[1]); })
                    // this calculates the height down from the starting point
                    .attr("height", function(d) { return y(d[0]) - y(d[1]); })
                    // calculate width for each band
                    .attr("width", x.bandwidth())
        
        // place the x axis
        g.append("g")
            .attr("class", "c2p1 chartAxis bottom")
            .attr("transform", "translate(0," + chart_height + ")")
            .call(d3.axisBottom(x).tickValues(['1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2019' ]).tickSize(0))
            .select(".domain").remove()

        // place and rotate x axis labels
        g.selectAll('text')
            .attr("y", 5)
            .attr("x", -28)
            .attr("dy", ".35em")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "start")


        // place the y axis and format tick labels
        g.append("g")
            .attr("class", "c2p1 chartAxis right")
            // offset axis slightly to align closer to last bar
            .attr("transform", "translate(" + chart_width*0.96 + "," + 0 + ")")
            // give ticks k number format and set their size to cover the width of the chart
            .call(d3.axisRight(y).ticks(10, "s").tickSize(-chart_width))
            .select(".domain").remove()

        // place and rotate the y axis label
        svgChart.selectAll(".chartAxis.right")
            .append("text")
            .attr("y", 35)
            // offset to (roughly) center on y axis
            .attr("x", -chart_height / 1.15)
            .attr("text-anchor", "starts")
            .attr("class", "c2p1 chartAxisText")
            .text("# of Measurements")
            .attr("transform", "rotate(-90)")

        // set the tick mark lines to background color
        svgChart.selectAll(".tick line").attr("stroke", "#000000")

        //  make the legend
        var legend = g.selectAll(".legend")
            // include all but the first column in the legend
            .data(data.columns.slice(1).reverse())
            // append an item for each series
            .enter().append("g")
                .attr("class", "c2p1 barChart legend")
                .attr("transform", function(d, i) { 
                    return "translate(" + 0 + "," + i * 17 + ")"; 
                })
        
            // append a rectangle for each series
            legend.append("rect")
                .attr("x", 14)
                .attr("width", 8)
                .attr("height", 8)
                // set color based on z attribute
                .attr("fill", z);

            // append a label for each rectangle
            legend.append("text")
                .attr("x", 30)
                .attr("y", 4)
                .attr("dy", ".35em")
                .attr("text-anchor", "start")
                // set text as column name
                .text(function(d) { return d; });    

    }; 

    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//

    // Add chapter 2 panel 2 components

    // Add Chapter 2 panel 2 map
    function setMap_c2p2(map_width, map_height, segments, bay, reservoirs, basin_buffered, map, map_path, scaleBarTop, scaleBarBottom, widthScale_c2){

    
        // // Set up necessary elements for mousemove event within svg with viewBox
        // find root svg element
        var svg_map_c2p2 = document.querySelector('.map_c2p2');
        // create a SVGPoint for future math
        var pt_map_c2p2 = svg_map_c2p2.createSVGPoint();
        // function to get point in global SVG space
        function cursorPoint_c2p2(evt){
            pt_map_c2p2.x = evt.clientX; pt_map_c2p2.y = evt.clientY;
            return pt_map_c2p2.matrixTransform(svg_map_c2p2.getScreenCTM().inverse()); 
        }
        // create local variable to store point coordinates
        var loc_map_c2p2
        // reset coordinates when mousemoves over map svg
        svg_map_c2p2.addEventListener('mousemove', function(evt){
            loc_map_c2p2 = cursorPoint_c2p2(evt);
        }, false);

        // // Add tooltip as text element appended to map svg, without coordinates
        // add tooltip to map svg
        var tooltip = map.append("text")
            .attr("class", "c2p2 tooltip map")

        // // Add in narrative text as text element appended to map svg
        // add c2p2 narrative text
        var narrative = map.append("foreignObject")
            .attr("class", "c2p2 narrative")
            .attr("text-align", "left")
            .attr("x", map_width*0.6)
            .attr("y", 25)
            .attr("width", map_width*0.4)
            .attr("height", map_height)
            .append("xhtml:body")
                .attr("class", "c2p2 narrative")
                .html('<p>The reality is that we cannot measure water temperature everywhere at all times.\
                Therefore, records of stream temperature have gaps in space and time. In the matrix chart,\
                right, the columns represent years, and each row represents a stream reach within the\
                 basin. If every stream reach had at least <span id="c2p2_matrix_bold">one measurement of \
                 water temperature</span> at a representative monitoring station <span id="c2p2_matrix_bold">each year</span>, the chart \
                  would be entirely <span id="c2p2_matrix_min"><b>blue</b></span>. If every reach \
                  had at least <span id="c2p2_matrix_bold">one measurement of water temperature</span>  on \
                  <span id="c2p2_matrix_bold">each day of each \
                  year</span>, the chart would be entirely <span id="c2p2_matrix_max"><b>\
                  yellow</b></span>. Current monitoring efforts cannot reach either of these baselines. Black \
                  sections in the chart therefore represent where and when we are "in the dark" about stream \
                  temperature </p><p id="tip_text"><i>Hover over the stream network, left, and the matrix chart, right, to\
                  explore the availability of data in space in time.</i></p>')

        
        // // Build Map
        // add drb segments to map BACKGROUND - for selection only
        var drb_segments_transparent = map.selectAll(".river_segments")
            // bind segments to each element to be created
            .data(segments)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // assign class for styling
            .attr("class", "c2p2 segs_transparent")
            // project each element
            .attr("d", map_path)
            // set stroke width to be large for selection
            .style("stroke-width", 6)
            // set stroke to background color
            .style("stroke", "#000000")
            // no fill
            .style("fill", "None")
            // set opacity to 0 so segments aren't visible but can be selected
            .style("opacity", 0)
            // trigger interactions
            .on("mouseover", function(d) {
                mouseoverSeg_c2p2(d, tooltip);
            })
            .on("mousemove", function(d) {
                // pass mouse coordinates
                mouse_x = loc_map_c2p2.x
                mouse_y = loc_map_c2p2.y
                mousemoveSeg_c2p2(d, tooltip, mouse_x, mouse_y); // position
            })
            .on("mouseout", function(d) {
                mouseoutSeg_c2p2(d, tooltip);
            });

        // add basin_buffered basin to map - for selection only
        var drb_basin_buffered = map.append("path")
            // bind data to element
            .datum(basin_buffered)
            // set class for styling
            .attr("class", "c2p2 basin_buffered")
            // project element
            .attr("d", map_path)
            // style for selection only
            .style("fill", "#000000")
            .style("opacity", 0)
            // trigger dimming
            .on("mouseover", function(d) {
                mouseoverDimSegs_c2p2(d)
            }) 
            .on("mouseout", function(d) {
                mouseoutDimSegs_c2p2(d)
            });

        // add delaware bay to map
        var drb_bay = map.append("path")
            // bind data to element
            .datum(bay)
            // assign class for styling
            .attr("class", "c2p2 delaware_bay")
            // project element
            .attr("d", map_path)
            // trigger dimming
            .on("mouseover", function(d) {
                mouseoverDimSegs_c2p2(d)
            }) 
            .on("mouseout", function(d) {
                mouseoutDimSegs_c2p2(d)
            });

        // add drb reservoirs to map
        var drb_reservoirs = map.selectAll(".reservoirs")
            // bind polygons to each element to be created
            .data(reservoirs)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // project polygons
            .attr("d", map_path)
            // assign class for styling
            .attr("class", function(d){
                return "c2p2 reservoirs res_id" + d.properties.GRAND_ID
            })
            // set stroke width so that polygons appear larger
            .style("stroke-width", 1)

        // add drb segments to map
        var drb_segments = map.selectAll(".river_segments")
            // bind segments to each element to be created
            .data(segments)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // assign class for styling - based on segment id
            // and based on years in which each segment has data
            .attr("class", function(d){
                var seg_class = 'c2p2 river_segments seg'
                seg_class += d.seg_id_nat
                for (key in d.properties.year_count) {
                    if (d.properties.year_count[key]) {
                        seg_class += " " + timestep_c2p2 + key
                    }
                }
                return seg_class
            })
            // project segments
            .attr("d", map_path)
            // add stroke width based on widthScale function
            .style("stroke-width", function(d){
                var value = d.properties['avg_ann_flow'];
                if (value){
                    return widthScale_c2(value);
                } else {
                    return "#ccc";
                }
            })
            // set fill to none
            .style("fill", "None")
            // trigger interactions
            .on("mouseover", function(d) {
                mouseoverSeg_c2p2(d, tooltip);
            })
            .on("mousemove", function(d) {
                // pass mouse coordinates
                mouse_x = loc_map_c2p2.x
                mouse_y = loc_map_c2p2.y
                mousemoveSeg_c2p2(d, tooltip, mouse_x, mouse_y); 
            })
            .on("mouseout", function(d) {
                mouseoutSeg_c2p2(d, tooltip);
            });
           
        // add scale bar
        map.append("g").call(scaleBarTop)
        map.append("g").call(scaleBarBottom)
    };

    // *********************************************************************//
    function createMatrix_c2p2(csv_matrix_annual, csv_annual_count, segments, timestep_c2p2){
       
        // append the svg object to the body of the page
        var svgMatrix = d3.select("#matrixChart_c2p2")
            .append("svg")
                .attr("viewBox", [0, 0, (matrix_width_c2p2 + matrix_margin.left + matrix_margin.right), 
                                        (matrix_height_c2p2 + matrix_margin.top + matrix_margin.bottom)].join(' '))
                // .attr("width", matrix_width_c2p2 + matrix_margin.left + matrix_margin.right)
                // .attr("height", matrix_height_c2p2 + matrix_margin.top + matrix_margin.bottom)
                .attr("class", "c2p2 matrix_c2p2")
        
        var tooltip = svgMatrix.append("text")
            .attr("class", "c2p2 tooltip matrix")

        svgMatrix.append("g")
            .attr("class", "c2p2 transformedMatrix")
            .attr("transform",
                "translate(" + matrix_margin.left + "," + matrix_margin.top + ")")
               
        // read in data
        var myGroups = d3.map(csv_matrix_annual, function(d){return d[timestep_c2p2];}).keys() 
        var myVars = d3.map(csv_matrix_annual, function(d){return d.seg_id_nat;}).keys() 

        // build x scale
        var x = d3.scaleBand()
            .range([0,matrix_width_c2p2])
            .domain(myGroups)
            .padding(0.1);

        // build y scale
        var y = d3.scaleBand()
            .range([matrix_height_c2p2, 0])
            .domain(myVars)
            .padding(0.1);

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

        // Find maximum count of observations to use in color scale
        var temporalCountMax = Math.round(Math.max(...domainArrayTemporalCounts));

        // color scale
        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolatePlasma) /* interpolatePlasma */
            // .domain([temporalCountMax,1]) // if INVERTING color scale
            .domain([1, temporalCountMax]) // if NOT INVERTING color scale
              
        // add the squares
        var transformedMatrix = d3.select(".c2p2.transformedMatrix")
        var matrixSquares = transformedMatrix.selectAll('matrixSqs')
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
        createMatrixRectangles_c2p2(csv_matrix_annual, csv_annual_count, segments, tooltip)

        // draw x axes
        transformedMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + matrix_height_c2p2 + ")")
            .attr("class", "c2p2 matrixAxis bottom")
            .call(d3.axisBottom(x).tickSize(0).tickValues(['1980', '1990', '2000', '2010', '2019']).tickPadding(4)) /* '1980-01', '1990-01', '2000-01', '2010-01', '2019-01' */
            // .select(".domain").remove()
        transformedMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("class", "c2p2 matrixAxis top")
            .call(d3.axisTop(x).tickSize(0))
            // .select(".domain").remove()
        // draw y axes
        transformedMatrix.append("g")
            .style("font-size", 0)
            .attr("class", "c2p2 matrixAxis left")
            .call(d3.axisLeft(y).tickSize(0))
            // .select(".domain").remove()
        transformedMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + matrix_width_c2p2 + "," + 0 + ")")
            .attr("class", "c2p2 matrixAxis right")
            .call(d3.axisRight(y).tickSize(0))

    };

    // *********************************************************************//
    function createMatrixRectangles_c2p2(csv_matrix_annual, csv_annual_count, segments, tooltip) {

        // // Set up necessary elements for mousemove event within svg with viewBox
        // find root svg element
        var svg_matrix_c2p2 = document.querySelector('.matrix_c2p2');
        // create a SVGPoint for future math
        var pt_matrix_c2p2 = svg_matrix_c2p2.createSVGPoint();
        // fucntion to get point in global SVG space
        function cursorPoint_matrix_c2p2(evt){
            pt_matrix_c2p2.x = evt.clientX; pt_matrix_c2p2.y = evt.clientY;
            return pt_matrix_c2p2.matrixTransform(svg_matrix_c2p2.getScreenCTM().inverse()); 
        }
        // create local variable to store point coordinates
        var loc_matrix_c2p2
        // // reset coordinates when mousemoves over matrix svg
        svg_matrix_c2p2.addEventListener('mousemove', function(evt){
            loc_matrix_c2p2 = cursorPoint_matrix_c2p2(evt);
        }, false);     


        // // Build matrix
        // create transformed matrix variable
        var transformedMatrix = d3.select(".c2p2.transformedMatrix")

        // read in data for matrix
        var myGroups = d3.map(csv_matrix_annual, function(d){return d[timestep_c2p2];}).keys() 
        var myVars = d3.map(csv_matrix_annual, function(d){return d.seg_id_nat;}).keys() 

        // build x scale
        var xscale = d3.scaleBand()
            .range([0,matrix_width_c2p2])
            .domain(myGroups)
            .padding(0.1);

        // build y scale
        var yscale = d3.scaleBand()
            .range([matrix_height_c2p2, 0])
            .domain(myVars)
            .padding(0.1);

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
            // .on("mouseover", function(d) {
            //     mouseoverRect_c2p2(d, tooltip);
            // })
            // .on("mousemove", function(d) {
            //     position = d3.mouse(this);
            //     mousemoveRect_c2p2(d, tooltip, position);
            // })
            // .on("mouseout", function(d) {
            //     mouseoutRect_c2p2(d, tooltip);
            // })

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
                mouseoverRect_c2p2(d, tooltip);
            })
            .on("mousemove", function(d) {
                mouse_x = loc_matrix_c2p2.x
                mouse_y = loc_matrix_c2p2.y
                mousemoveRect_c2p2(d, tooltip, mouse_x, mouse_y);
            })
            .on("mouseout", function(d) {
                mouseoutRect_c2p2(d, tooltip);
            })
    };

    // *********************************************************************//
    // function to dim segments on mouseover of buffered basin or bay
    function mouseoverDimSegs_c2p2(data) {

        // dim reservoirs, bay, and river segments
        d3.selectAll(".c2p2.reservoirs")
            .style("fill", "#172c4f")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p2.delaware_bay")
            .style("fill", "#172c4f")
        d3.selectAll(".c2p2.river_segments")
            .style("stroke", "#172c4f")
            
    };

    // *********************************************************************//
    // function to un-dim segments on mouseout of buffered basin or bay
    function mouseoutDimSegs_c2p2(data) {

        // un-dim reservoirs, bay, and river segments
        d3.selectAll(".c2p2.reservoirs")
            .style("fill", "#6079a3")
            .style("stroke", "#6079a3")
        d3.selectAll(".c2p2.delaware_bay")
            .style("fill", "#6079a3")
        d3.selectAll(".c2p2.river_segments")
            .style("stroke", "#6079a3")

    };


    // *********************************************************************//
    // function to populate and place c2p2 map tooltip
    function mousemoveSeg_c2p2(data, tooltip, mouse_x, mouse_y) { 
        
        // find # of observations for selected reach
        var num_obs = data.properties.total_count;

        // bind mouse coordinates and # of obs to tooltip
        tooltip
            .attr("y", mouse_y - 15)
            .attr("x", mouse_x + 15)
            .attr("text-align", "left")
            .text(d3.format(',')(num_obs) + " obs.")
            .raise()

    };

    // *********************************************************************//
    function mouseoverSeg_c2p2(data, tooltip) {

        d3.selectAll(".c2p2.matrixTemporalRect")
            .style("fill", "None")
            .style("stroke", "None")

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
        d3.selectAll(".c2p2.reservoirs")
            .style("fill", "#172c4f")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p2.delaware_bay")
            .style("fill", "#172c4f")
        d3.selectAll(".c2p2.river_segments")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p2.river_segments.seg" + data.seg_id_nat)
            .style("stroke", "#ffffff")
            .attr("opacity", 1)
            .attr("filter", "url(#shadow1)")
            .raise()
            
    };

    // *********************************************************************//
    function mouseoutSeg_c2p2(data, tooltip) {

        d3.selectAll(".c2p2.matrixTemporalRect")
            .style("fill", "#000000")
            .style("stroke", "#000000")
            .style("stroke-width", 2) 

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
        d3.selectAll(".c2p2.river_segments")
            .style("stroke", "#6079a3")
        d3.selectAll(".c2p2.river_segments.seg" + data.seg_id_nat)
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
            .attr("filter","None")
            .lower()
        d3.selectAll(".c2p2.reservoirs")
            .style("fill", "#6079a3")
            .style("stroke", "#6079a3")
            .lower()
        d3.selectAll(".c2p2.delaware_bay")
            .style("fill", "#6079a3")
            .lower()
        d3.selectAll(".c2p2.basin_buffered")
            .lower()
        d3.selectAll("g")
            .raise()


    };

    // *********************************************************************//
    // function to populate and place c2p2 matrix tooltip
    function mousemoveRect_c2p2(data, tooltip, mouse_x, mouse_y) {

        // identify selected year
        var selected_year = data[timestep_c2p2];
        console.log(selected_year);

        // bind mouse coordinates and year to tooltip
        tooltip
            .attr("y", mouse_y - 15)
            .attr("x", mouse_x - 39)
            .attr("text-align", "left")
            .text(selected_year)
            .raise()

    };
   
    // *********************************************************************//
    function mouseoverRect_c2p2(data, tooltip) {

        d3.selectAll(".c2p2.matrixSpatialRect")
            .style("fill", "None")
            .style("stroke", "None")

        tooltip
            .style("opacity", 1);
        d3.selectAll(".c2p2.matrixTemporalRect")
            .style("opacity", 0.8)
            .style("stroke-width", 2);
        d3.selectAll(".c2p2.matrixTemporalRect.time" + data[timestep_c2p2])
            .style("opacity", 0)
        d3.selectAll(".c2p2.reservoirs")
            .style("fill", "#172c4f")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p2.delaware_bay")
            .style("fill", "#172c4f")
        d3.selectAll(".c2p2.river_segments")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p2.river_segments." + timestep_c2p2 + data[timestep_c2p2])
            .style("stroke", "#ffffff")
            .attr("opacity", 1)
            .raise()
            
    };

    // *********************************************************************//
    function mouseoutRect_c2p2(data, tooltip) {
        d3.selectAll(".c2p2.matrixSpatialRect")
            .style("fill", "#000000") // #ffffff
            .style("stroke", "#000000")
            .style("stroke-width", 2)

        tooltip
            .style("opacity", 0)
        d3.selectAll(".c2p2.matrixTemporalRect") 
            .style("stroke", "#000000") // #ffffff
            .style("fill", "#000000") // #ffffff
            .style("stroke-width", 2)
            .style("opacity", 0)
        d3.selectAll(".c2p2.river_segments")
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
        d3.selectAll(".c2p2.river_segments." + timestep_c2p2 + data[timestep_c2p2])
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
            .lower()
        d3.selectAll(".c2p2.reservoirs")
            .style("fill", "#6079a3")
            .style("stroke", "#6079a3")
            .lower()
        d3.selectAll(".c2p2.delaware_bay")
            .style("fill", "#6079a3")
            .lower()
        d3.selectAll(".c2p2.basin_buffered")
            .lower()

    };

    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//
    // *********************************************************************//

    function setMap_c2p3(map_width, map_height, segments, bay, reservoirs, basin_buffered, map, map_path, scaleBarTop, scaleBarBottom, widthScale_c2){

        // // Set up necessary elements for mousemove event within svg with viewBox
        // find root svg element
        var svg_map_c2p3 = document.querySelector('.map_c2p3');
        // create a SVGPoint for future math
        var pt_map_c2p3 = svg_map_c2p3.createSVGPoint();
        // function to get point in global SVG space
        function cursorPoint_c2p3(evt){
            pt_map_c2p3.x = evt.clientX; pt_map_c2p3.y = evt.clientY;
            return pt_map_c2p3.matrixTransform(svg_map_c2p3.getScreenCTM().inverse()); 
        }
        // create local variable to store point coordinates
        var loc_map_c2p3
        // reset coordinates when mousemoves over map svg
        svg_map_c2p3.addEventListener('mousemove', function(evt){
            loc_map_c2p3 = cursorPoint_c2p3(evt);
            // console.log('x:')
            // console.log(loc_map_c2p3.x)
            // console.log('y:')
            // console.log(loc_map_c2p3.y)
        }, false);

        // // Add tooltip as text appended to map svg
        // add tooltip to map svg
        var tooltip = map.append("text")
            .attr("class", "c2p3 tooltip map")

        // // Add narrative text as html apppended to  map svg
        // add c2p3 narrative text
        var narrative = map.append("foreignObject")
        .attr("class", "c2p3 narrative")
        .attr("text-align", "left")
        .attr("x", map_width*0.6)
        .attr("y", 25)
        .attr("width", map_width*0.4)
        .attr("height", map_height)
        .append("xhtml:body")
            .attr("class", "c2p3 narrative")
            .html('<p>If we look more closely at a single year, we can \
            see focus on the dynamics of stream temperature itself. \
            Streams are <span id="c2p3_min_t">\
            cooler</span> in the winter and <span id="c2p3_max_t">warmer</span> in the summer, and\
            the warm periods are longer in the southern portion of the basin.</p><p>But the dynamics of \
            stream temperature are not identical in all stream reaches. Reach-level temperatures are \
            influenced by many factors, such as surrounding land use, the orientation and size of the stream, \
            and inflow from upstream reaches. For example, reaches within or immediately below reservoirs remained \
            cool throughout the 2019 summer period.</p>\
            <p>Through modeling, we can explore reach-level patterns and improve our understanding of \
            stream temperature dynamics. Models allow us to \
            estimate temperatures in unobserved reaches and predict how stream \
            temperatures may respond as the climate changes.</p>\
            <p id="tip_text"><i>Hover over the stream network, left, and the matrix chart, right, to\
            explore the availability of data in space in time.</i></p>')

        // add drb segments to map BACKGROUND
        var drb_segments = map.selectAll(".river_segments")
            // bind segments to each element to be created
            .data(segments)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // assign class for styling
            .attr("class", "c2p3 segs_transparent")
            .attr("d", map_path)
            .style("stroke-width", 6)
            .style("stroke", "#000000")
            .style("fill", "None")
            .style("opacity", 0)
            .on("mouseover", function(d) {
                mouseoverSeg_c2p3(d, tooltip);
            })
            .on("mousemove", function(d) {
                mouse_x = loc_map_c2p3.x
                mouse_y = loc_map_c2p3.y
                mousemoveSeg_c2p3(d, tooltip, mouse_x, mouse_y);
            })
            .on("mouseout", function(d) {
                mouseoutSeg_c2p3(d, tooltip);
            });

        // add basin_buffered basin to map
        var drb_basin_buffered = map.append("path")
            .datum(basin_buffered)
            .attr("class", "c2p3 basin_buffered")
            .attr("d", map_path)
            .style("fill", "#000000")
            .style("stroke", "#000000")
            .style("opacity", 1)
            .on("mouseover", function(d) {
                mouseoverDimSegs_c2p3(d)
            }) 
            .on("mouseout", function(d) {
                mouseoutDimSegs_c2p3(d)
            });

        // add delaware bay to map
        var drb_bay = map.append("path")
            .datum(bay)
            .attr("class", "c2p3 delaware_bay")
            .attr("d", map_path)
            .on("mouseover", function(d) {
                mouseoverDimSegs_c2p3(d)
            }) 
            .on("mouseout", function(d) {
                mouseoutDimSegs_c2p3(d)
            });

        // add drb reservoirs to map
        var drb_reservoirs = map.selectAll(".reservoirs")
            // bind polygons to each element to be created
            .data(reservoirs)
            // create an element for each datum
            .enter()
            // append each element to the svg as a path element
            .append("path")
            // project polygons
            .attr("d", map_path)
            // assign class for styling
            .attr("class", function(d){
                return "c2p3 reservoirs res_id" + d.properties.GRAND_ID
            })
            .style("stroke-width", 1)

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
                    return widthScale_c2(value);
                } else {
                    return "#ccc";
                }
            })
            .style("fill", "None")
            .on("mouseover", function(d) {
                mouseoverSeg_c2p3(d, tooltip); 
            })
            .on("mousemove", function(d) {
                mouse_x = loc_map_c2p3.x
                mouse_y = loc_map_c2p3.y
                mousemoveSeg_c2p3(d, tooltip, mouse_x, mouse_y);
            })
            .on("mouseout", function(d) {
                mouseoutSeg_c2p3(d, tooltip);
            });
        


        // add scale bar
        map.append("g").call(scaleBarTop)
        map.append("g").call(scaleBarBottom)

    };

    // *********************************************************************//
    function createMatrix_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments, timestep_c2p3){
       
        // append the svg object ot the body of the page
        var svgMatrix = d3.select("#matrixChart_c2p3")
            .append("svg")
                .attr("viewBox", [0, 0, (matrix_width_c2p3 + matrix_margin.left + matrix_margin.right), 
                                        (matrix_height_c2p3 + matrix_margin.top + matrix_margin.bottom)].join(' '))
                // .attr("width", matrix_width_c2p3 + matrix_margin.left + matrix_margin.right)
                // .attr("height", matrix_height_c2p3 + matrix_margin.top + matrix_margin.bottom)
                .attr("class", "c2p3 matrix_c2p3")
        
        // append tooltip
        var tooltip = svgMatrix.append("text")
            .attr("class", "c2p3 tooltip matrix")

        svgMatrix.append("g")
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

        // console.log("temp list")
        // console.log(arrayObsTemps)

        var obsTempMax = Math.round(Math.max(...arrayObsTemps));
        // console.log(obsTempMax)

        var obsTempMin = Math.round(Math.min(...arrayObsTemps));
        // console.log(obsTempMin)

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
        var transformedMatrix = d3.select(".c2p3.transformedMatrix")
        var matrixSquares = transformedMatrix.selectAll('matrixSqs')
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
        createMatrixRectangles_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments, tooltip)

        // draw x axes
        var parseTime = d3.timeParse("%Y-%m-%d");
        // console.log(parseTime('2019-01-01'))
        var formatTime = d3.timeFormat("%B");
        // console.log(formatTime(parseTime('2019-01-01')))

        transformedMatrix.append("g")
            .style("font-size", 10)
            .attr("transform", "translate(" + 0 + "," + matrix_height_c2p3 + ")")
            .attr("class", "c2p3 matrixAxis bottom")
            .call(d3.axisBottom(x).tickSize(0).tickValues(['2019-01-01', '2019-03-01', '2019-05-01', '2019-07-01', '2019-09-01', '2019-11-01']).tickPadding(4)) //.tickFormat(formatTime(parseTime()))
            // .select(".domain").remove()
        transformedMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("class", "c2p3 matrixAxis top")
            .call(d3.axisTop(x).tickSize(0))
            // .select(".domain").remove()

        // draw y axes
        transformedMatrix.append("g")
            .style("font-size", 0)
            .attr("class", "c2p3 matrixAxis left")
            .call(d3.axisLeft(y).tickSize(0))
            // .select(".domain").remove()
        transformedMatrix.append("g")
            .style("font-size", 0)
            .attr("transform", "translate(" + matrix_width_c2p3 + "," + 0 + ")")
            .attr("class", "c2p3 matrixAxis right")
            .call(d3.axisRight(y).tickSize(0))

    };

    // *********************************************************************//
    function createMatrixRectangles_c2p3(csv_matrix_daily_2019, csv_daily_count_2019, segments, tooltip) {

        // // Set up necessary elements for mousemove event within svg with viewBox
        // find root svg element
        var svg_matrix_c2p3 = document.querySelector('.matrix_c2p3');
        // create a SVGPoint for future math
        var pt_matrix_c2p3 = svg_matrix_c2p3.createSVGPoint();
        // function to get point in global SVG space
        function cursorPoint_matrix_c2p3(evt){
            pt_matrix_c2p3.x = evt.clientX; pt_matrix_c2p3.y = evt.clientY;
            return pt_matrix_c2p3.matrixTransform(svg_matrix_c2p3.getScreenCTM().inverse()); 
        }
        // create local variable to store point coordinates
        var loc_matrix_c2p3
        // reset coordinates when mousemoves over matrix svg
        svg_matrix_c2p3.addEventListener('mousemove', function(evt){
            loc_matrix_c2p3 = cursorPoint_matrix_c2p3(evt);
            console.log('x:')
            console.log(loc_matrix_c2p3.x)
            console.log('y:')
            console.log(loc_matrix_c2p3.y)
        }, false);     

        // // Build matrix
        // create transformed matrix variable
        var transformedMatrix = d3.select(".c2p3.transformedMatrix")

        // read in data
        var myGroups = d3.map(csv_matrix_daily_2019, function(d){return d[timestep_c2p3];}).keys() 
        var myVars = d3.map(csv_matrix_daily_2019, function(d){return d.seg_id_nat;}).keys() 

        // build x scale
        var xscale = d3.scaleBand()
            .range([0,matrix_width_c2p3])
            .domain(myGroups)
            .padding(0.1);

        // build y scale
        var yscale = d3.scaleBand()
            .range([matrix_height_c2p3, 0])
            .domain(myVars)
            .padding(0.1);

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
                if (d.properties.year_count['2019'] > 0) { //d.properties.year_count['2019'] > 0
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
            // .on("mouseover", function(d) {
            //     mouseover_c2p3(d, tooltip);
            // })
            // .on("mousemove", function(d) {
            //     position = d3.mouse(this);
            //     mousemoveRect_c2p3(d, tooltip, position);
            // })
            // .on("mouseout", function(d) {
            //     mouseout_c2p3(d, tooltip);
            // })

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
                mouseoverRect_c2p3(d, tooltip);
            })
            .on("mousemove", function(d) {
                mouse_x = loc_matrix_c2p3.x
                mouse_y = loc_matrix_c2p3.y
                mousemoveRect_c2p3(d, tooltip, mouse_x, mouse_y);
            })
            .on("mouseout", function(d) {
                mouseoutRect_c2p3(d, tooltip);
            })
    };

    // *********************************************************************//
    // function to dim segments on mouseover of buffered basin or bay
    function mouseoverDimSegs_c2p3(data) {

        // dim reservoirs, bay, and river segments
        d3.selectAll(".c2p3.reservoirs")
            .style("fill", "#172c4f")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p3.delaware_bay")
            .style("fill", "#172c4f")
        d3.selectAll(".c2p3.river_segments")
            .style("stroke", "#172c4f")
            
    };

    // *********************************************************************//
    // function to un-dim segments on mouseover of buffered basin or bay
    function mouseoutDimSegs_c2p3(data) {

        // un-dim reservoirs, bay, and river segments
        d3.selectAll(".c2p3.reservoirs")
            .style("fill", "#6079a3")
            .style("stroke", "#6079a3")
        d3.selectAll(".c2p3.delaware_bay")
            .style("fill", "#6079a3")
        d3.selectAll(".c2p3.river_segments")
            .style("stroke", "#6079a3")

    };

    // *********************************************************************//
    // function to populate and place c2p3 map tooltip
    function mousemoveSeg_c2p3(data, tooltip, mouse_x, mouse_y) {

        // find # of obs in 2019 for selected segment
        var num_obs = data.properties.year_count['2019'];

        // bind mouse coordinates and # obs to tooltip
        tooltip
            .attr("y", mouse_y - 15)
            .attr("x", mouse_x + 15)
            .attr("text-align", "left")
            .text(d3.format(',')(num_obs) + " obs.")
            .raise()      

    };

    // *********************************************************************//
    function mouseoverSeg_c2p3(data, tooltip) {

        d3.selectAll(".c2p3.matrixTemporalRect")
            .style("fill", "None")
            .style("stroke", "None")

        tooltip
            .style("opacity", 1);
        d3.selectAll(".c2p3.matrixSpatialRect")
            .style("opacity", 0.7)
            .style("stroke-width", 1);
        d3.selectAll(".c2p3.cell.segment" + data.seg_id_nat)
            .raise()
        d3.selectAll(".c2p3.matrixSpatialRect.seg" + data.seg_id_nat)
            // .style("fill", function(data) {
            //     if (data.properties.total_count > 0) { //properties.total_count
            //         return "#363636";     //0              
            //     } else {
            //         return "#000000";
            //     }
            // })
            .style("stroke-width", function(data) {
                if (data.properties.year_count['2019'] > 0) { //properties.total_count
                    return 0;     //0.5              
                } else {
                    return 0.5;
                }
            })
            .style("opacity", function(data) {
                if (data.properties.year_count['2019'] > 0) { //properties.total_count
                    return 0;       //1            
                } else {
                    return 1;
                }
            })
            .style("stroke", function(data) {
                if (data.properties.year_count['2019'] > 0) {
                    return "None";       //"#363636"            
                } else {
                    return "#ffffff"; //red
                }
            })
            .raise()
        // d3.selectAll(".c2p3.cell.segment" + data.seg_id_nat)
        //     .raise()
        d3.selectAll(".c2p3.reservoirs")
            .style("fill", "#172c4f")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p3.delaware_bay")
            .style("fill", "#172c4f")
        d3.selectAll(".c2p3.river_segments")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p3.river_segments.seg" + data.seg_id_nat)
            .style("stroke", "#ffffff")
            .attr("opacity", 1)
            .attr("filter", "url(#shadow1)")
            .raise()
            
    };

    // *********************************************************************//
    function mouseoutSeg_c2p3(data, tooltip) {

        d3.selectAll(".c2p3.matrixTemporalRect")
            .style("fill", "#000000")
            .style("stroke", "#000000")
            .style("stroke-width", 2) 

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
        d3.selectAll(".c2p3.river_segments")
            .style("stroke", "#6079a3")
        d3.selectAll(".c2p3.river_segments.seg" + data.seg_id_nat)
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
            .attr("filter","None")
            .lower()
        d3.selectAll(".c2p3.reservoirs")
            .style("fill", "#6079a3")
            .style("stroke", "#6079a3")
            .lower()
        d3.selectAll(".c2p3.delaware_bay")
            .style("fill", "#6079a3")
            .lower()
        d3.selectAll(".c2p3.basin_buffered")
            .lower()
        d3.selectAll("g")
            .raise()

    };

    // *********************************************************************//
    // function to populate and place c2p3 matrix tooltip
    function mousemoveRect_c2p3(data, tooltip, mouse_x, mouse_y) {

        // identify selected date
        var selected_year = data[timestep_c2p3];

        // set tooltip x coordinate based on mouse coordinates and position w/i matrix
        if (mouse_x > 70){
            var x_position = mouse_x - 60
        } else {
            var x_position = mouse_x + 20
        }

        // bind adjusted mouse coordinates and year to tooltip
        tooltip
            .attr("y", mouse_y - 20)
            .attr("x", x_position)
            .attr("text-align", "left")
            .text(selected_year)
            .raise()

    };
   
    // *********************************************************************//
    function mouseoverRect_c2p3(data, tooltip) {

        d3.selectAll(".c2p3.matrixSpatialRect")
            .style("fill", "None")
            .style("stroke", "None")

        tooltip
            .style("opacity", 1)
        d3.selectAll(".c2p3.matrixTemporalRect")
            .style("opacity", 0.85)
            .style("stroke-width", 0.6)
        d3.selectAll(".c2p3.matrixTemporalRect.time" + data[timestep_c2p3])
            .style("opacity", 0)
            // .raise()
        d3.selectAll(".c2p3.reservoirs")
            .style("fill", "#172c4f")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p3.delaware_bay")
            .style("fill", "#172c4f")
        d3.selectAll(".c2p3.river_segments")
            .style("stroke", "#172c4f")
        d3.selectAll(".c2p3.river_segments." + timestep_c2p3 + data[timestep_c2p3])
            .style("stroke", "#ffffff")
            .attr("opacity", 1)
            .raise()
            
    };

    // *********************************************************************//
    function mouseoutRect_c2p3(data, tooltip) {

        d3.selectAll(".c2p3.matrixSpatialRect")
            .style("fill", "#000000") // #ffffff
            .style("stroke", "#000000")
            .style("stroke-width", 2)

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
        d3.selectAll(".c2p3.river_segments")
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
        d3.selectAll(".c2p3.river_segments." + timestep_c2p3 + data[timestep_c2p3])
            .style("stroke", "#6079a3")
            .attr("opacity", 1)
            .lower()
        d3.selectAll(".c2p3.reservoirs")
            .style("fill", "#6079a3")
            .style("stroke", "#6079a3")
            .lower()
        d3.selectAll(".c2p3.delaware_bay")
            .style("fill", "#6079a3")
            .lower()
        d3.selectAll(".c2p3.basin_buffered")
            .lower()

    };



})();