var mapJSON = 'public/StHimark.geojson'
var choroplethJSON = 'public/choropleth.json'
var mapData = ''
var choroplethData = ''
var currentDate = 6
var canvasSvg = d3.select('#canvas');
var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var width = canvasSvg.style('width').replace('px','')
var height = canvasSvg.style('height').replace('px','')        

var mapSvg = ''
var barSvg = ''
var pieSvg = ''
var legendSvg = ''

var staticColor = "#ffd369"
var mobileColor = "#03506f"

var lowRadColor = "#59b386"
var highRadColor = "#ff4040"


function runOnLoad(){
    Promise.all([d3.json(mapJSON),d3.json(choroplethJSON)]).then(function(values){
        mapData = values[0]
        choroplethData = values[1]

        mapSvg = canvasSvg.append("g")
        .attr("width", `${(width - margin.left - margin.right)/2}`)
        .attr("height", `${(height - margin.left - margin.right)*0.80}`)
        .attr('id','map')
        .attr("transform", `translate(${margin.left+margin.right},${0})`);
    
        legendSvg = canvasSvg.append("g")
        .attr("width", `${(width - margin.left - margin.right)/2}`)
        .attr("height", `${(height - margin.left - margin.right)*0.20}`)
        .attr('id','legend')
        .attr("transform", `translate(${margin.left+margin.right},${0})`);

        barSvg = canvasSvg.append("g")
        .attr("width", `${(width - margin.left - margin.right)/2}`)
        .attr("height", `${(height - margin.left - margin.right)/2}`)
        .attr('id','bar')
        .attr("transform", `translate(${margin.left + margin.right + (width)/2},${margin.top+margin.bottom})`);

        pieSvg = canvasSvg.append("g")
        .attr("width", `${(width - margin.left - margin.right)/2}`)
        .attr("height", `${(height - margin.left - margin.right)/2}`)
        .attr('id','pie')
        .attr("transform", `translate(${(width - margin.left - margin.right)/2},${-margin.top-margin.bottom+(height-margin.top)/2})`);        

        drawMap()
        drawPie('initial')
        drawBar('initial')
    })
}


function drawPie(region){
    pieSvg.selectAll('*').remove()
    var pieWidth = (width - margin.left - margin.right)/2
    var pieHeight = (height - margin.top - margin.bottom)/2

    var pieX = pieWidth/2
    var pieY = pieHeight/2

    var sensorCount = []

    var radius = Math.min(pieX, pieY)/1.5;
    var donutWidth = 35; //This is the size of the hole in the middle

    var pie = d3.pie()
     .value(function (d) {
          return d.count;
     })
     .sort(null);

    var arc = d3.arc()
     .innerRadius(radius - donutWidth)
     .outerRadius(radius);

    //Create a basic tooltip
    var pieTooltip = d3.select("body").append("div")
    .attr("class", "pieTooltip")
    .style("opacity", 0);

    if(region=="initial"){
        sensorCount  = [
            {
                "sensorType": "static",
                "count":9
            },
            {
                "sensorType": "mobile",
                "count":50
            }
        ]
    }
    else{
        var filteredData = choroplethData.filter( function(x) {
            if(x.region===region){
                return x
            }
        })[0]
        sensorCount = [
            {
                "sensorType": "static",
                "count":filteredData.staticSensorCount
            },
            {
                "sensorType": "mobile",
                "count":filteredData.mobileSensorCount
            }
        ]
    }
    console.log(sensorCount[0].count)
    console.log(sensorCount[1].count)
    var sumCount = sensorCount[0].count + sensorCount[1].count
    if(sumCount!=0){
        var path = pieSvg.selectAll('path')
        .data(pie(sensorCount))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d, i) {
            console.log(d)
            if(d.data.sensorType=="static"){
                return staticColor
            }
            else{
                return mobileColor
            }
        })
        .attr('transform', `translate(${pieX}, ${pieY+50})`)
        .style('cursor', 'pointer')
        .on('mousemove', function(d,i){
            console.log('mousemove on ' + d.data.sensorType);
            //Adding cyan highlight on hover
            d3.select(this)
                .style('stroke', '#000')
                .style('stroke-width', '1')
                .style('opacity', 0.9);
            var count
            if(d.data.sensorType=="static"){
                count = sensorCount[0].count;
            }
            else{
                count = sensorCount[1].count;
            }
            pieTooltip.style("opacity", 1)
                    .html('Sensor Type: ' + d.data.sensorType.charAt(0).toUpperCase() + d.data.sensorType.slice(1) + '<br/>' + 'Sensor Count: ' + count)
                    .style("left", (d3.event.pageX + 11) + "px")
                    .style("top", (d3.event.pageY - 14) + "px");
        })
        .on('mouseover', function(d,i){
            console.log('mouseover on ' + d.data.sensorType);
            //Tooltip
            pieTooltip.style("opacity", 1);
        })
        .on('mouseout', function(d,i){
            console.log('mouseout on ' + d.data.sensorType);
            //Restoring original state before hover highlight
            d3.select(this)
                .style('stroke', 'none')
                .style('opacity', 1);
            //Tooltip
            pieTooltip.style("opacity", 0);
        })

        pieSvg.append("text")
        .attr("x", pieX)
        .attr("y", pieY+60)
        .attr("text-anchor","middle")
        .style('cursor', 'default')
        .text(function(){
            if(region=="initial"){
                return "St. Himark"
            }
            else{
                return `${region}`
            }
        })
        .style("font-color","black")
        .style("font-weight","800")
        .attr("font-size","16")
        
    }
    else{
        pieSvg.append("text")
        .attr("x", pieX)
        .attr("y", pieY)
        .text(`NO of sensors in ${region}`)
        .style("font-color","black")
        .style("font-size","18")
    }

    // Appending Label for barSvg
    pieSvg.append("g")
    .append("text")
    .text("Number of Sensors")
    .style("font-size","18px")
    .style("font-weight", "bold")
    .style("text-anchor", "middle")
    .style('text-decoration', 'underline')
    .attr("transform", "translate(" + (pieWidth/2) + "," + (pieHeight-margin.top-margin.bottom+60) + ")");

}


function drawBar(region){

    barSvg.selectAll('*').remove()

    var barWidth = (width - margin.left - margin.right)/2
    var barHeight = (height - margin.left - margin.right)/2

    var barX = barWidth-150
    var barY = barHeight-100

    var sumStaticAggrArr = [0,0,0,0,0]
    var sumMobileAggrArr = [0,0,0,0,0]
    var meanStaticAggrArr = []
    var meanMobileAggrArr = []
    var barData = []
    var dates = ['2020-04-6', '2020-04-7', '2020-04-8', '2020-04-9', '2020-04-10']
    var keys = ['Static', 'Mobile']
    var filtered = [];
    
    for(var i=0; i<choroplethData.length;i++){
        for(var j=0; j<5; j++){
            sumStaticAggrArr[j] += choroplethData[i]['staticAggrArr'][j]
            sumMobileAggrArr[j] += choroplethData[i]['mobileAggrArr'][j]
        }
    }

    for (var i = 0; i<5; i++){
        meanStaticAggrArr[i] = sumStaticAggrArr[i]/choroplethData.length
        meanMobileAggrArr[i] = sumMobileAggrArr[i]/choroplethData.length
    }

    var scaleOfGroup = d3.scaleBand()
                        .rangeRound([0, barX])
                        .paddingInner(0.1);

    var x = d3.scaleBand()
                    .padding(0.05);

    var y = d3.scaleLinear()
            .rangeRound([barY, 0]);

    var z = d3.scaleOrdinal()
            .range([staticColor, mobileColor]);

    // Extracting barSvg data based on region selected
    if(region=="initial"){
        for(var i=0; i<5; i++){
            record = {}
            record['Date'] = dates[i]
            record['Static'] = meanStaticAggrArr[i]
            record['Mobile'] = meanMobileAggrArr[i]
            barData.push(record)
        }
        y.domain([0, d3.max([d3.max(meanStaticAggrArr), d3.max(meanMobileAggrArr)])])
    }
    else{
        var filteredData = choroplethData.filter( function(x) {
            if(x.region===region){
                return x
            }
        })[0]
        var staticAggrArr = filteredData.staticAggrArr
        var mobileAggrArr = filteredData.mobileAggrArr
        console.log("staticAggrArr = "+staticAggrArr)
        console.log("mobileAggrArr = "+mobileAggrArr)
        for(var i=0; i<5; i++){
            record = {}
            record['Date'] = dates[i]
            record['Static'] = staticAggrArr[i]
            record['Mobile'] = mobileAggrArr[i]
            barData.push(record)
        }
        y.domain([0, d3.max([d3.max(staticAggrArr), d3.max(mobileAggrArr)])])
    }
    
    scaleOfGroup.domain(dates)
    x.domain(keys).rangeRound([0, scaleOfGroup.bandwidth()]);

    // Creating tooltip for barSvg
    var barTooltip = d3.select("body").append("div")
                        .attr("class", "barTooltip")
                        .style("opacity", 0);

    // Appending bars for barSvg 
    barSvg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("g")
        .data(barData)
        .enter().append("g")
        .attr("class","barGroup")
        .attr("transform", function(d) { return "translate(" + scaleOfGroup(d.Date) + ",0)"; })
        .selectAll("rect")
        .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })
        .enter().append("g")
        .attr("class","bar")
        .append("rect")
        .attr("x", function(d) { return x(d.key); })
        .attr("y", function(d) { return y(d.value); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return barY - y(d.value); })
        .attr("fill", function(d) { return z(d.key); })
        .on('mousemove', function(d,i){
            console.log('mousemove on ' + Math.trunc(d.value));
            //Adding cyan highlight on hover
            d3.select(this)
                .style('opacity', 0.9)
                .style('stroke', '#000')
                .style('stroke-width', '1');

            barTooltip.style("opacity", 1)
                    .html('Radiation: ' + Math.trunc(d.value))
                    .style("left", (d3.event.pageX + 11) + "px")
                    .style("top", (d3.event.pageY - 14) + "px");
        })
        .on('mouseover', function(d,i){
            console.log('mouseover on ' + Math.trunc(d.value));
            //Tooltip
            barTooltip.style("opacity", 1);
        })
        .on('mouseout', function(d,i){
            console.log('mouseout on ' + Math.trunc(d.value));
            d3.select(this)
                .style('stroke', 'none')
                .style('opacity', 1);
            //Tooltip
            barTooltip.style("opacity", 0);
        });

    // Appending X-Axis for barSvg
    barSvg.append("g")
        .attr("class", "barXAxis")
        .style("color", "#000")
        .attr("transform", "translate(" + margin.left + "," + (barY+margin.top) + ")")
        .call(d3.axisBottom(scaleOfGroup));
    
    // Appending Y-Axis for barSvg
    barSvg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("class", "y barYAxis")
        .style("color", "#000")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "none")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start");

    // Appending Label for barSvg
    barSvg.append("g")
        .append("text")
        .text("Aggregate Radiation Chart")
        .style("font-size","18px")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .style('text-decoration', 'underline')
        .attr("transform", "translate(" + (barX/2) + "," + (0) + ")");

    // Appedning X-Axis Label for barSvg
    barSvg.append("g")
        .append("text")
        .text("Date")
        .style("font-size","15px")
        .style("font-weight", "bold")
        .attr("transform", "translate(" + (barX/2) + "," + (barY+3*margin.top) + ")");
    
    // Appending Y-Axis Label for barSvg
    barSvg.append("g")
        .append("text")
        .text("Radiation")
        .style("font-size","15px")
        .style("font-weight", "bold")
        .attr("transform", "translate(" + (-margin.right) + "," + ((barY+5*margin.top)/2) + ")rotate(270)");

    // Appending Legends for barSvg
    var legend = barSvg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice())
        .enter().append("g")
        .attr("transform", function(d, i) {return "translate(100," + i*20 + ")"; });

    legend.append("rect")
        .attr("x", barX - 17)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", z)
        .attr("stroke", z)
        .attr("stroke-width",2)
        .style('cursor', 'pointer')
        .on("click",function(d) { update(d) });

    legend.append("text")
        .attr("x", barX - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });
    
    function update(d) {

        var newKeys = [];

        if (filtered.indexOf(d) == -1) {
            filtered.push(d); 
            if(filtered.length == keys.length) filtered = [];
        }
        else {
            filtered.splice(filtered.indexOf(d), 1);
        }
    
        keys.forEach(function(d) {
            if (filtered.indexOf(d) == -1 ) {
                newKeys.push(d);
            }
        })

        x.domain(newKeys).rangeRound([0, scaleOfGroup.bandwidth()]);
        if(region=="initial"){
            y.domain([0, d3.max([d3.max(meanStaticAggrArr), d3.max(meanMobileAggrArr)])]);
        }
        else{
            y.domain([0, d3.max([d3.max(staticAggrArr), d3.max(mobileAggrArr)])]);
        }

        barSvg.select(".y")
            .transition()
            .call(d3.axisLeft(y).ticks(null, "s"))
            .duration(500);
        
        var bars = barSvg.selectAll(".barGroup").selectAll("rect")
            .data(function(d) { return keys.map(function(key) { return {key: key, value: d[key]}; }); })

        bars.filter(function(d) {
                return filtered.indexOf(d.key) > -1;
             })
            .transition()
            .attr("x", function(d) {
                return (+d3.select(this).attr("x")) + (+d3.select(this).attr("width"))/2;  
            })
            .attr("y", function(d) { return barY; })
            .attr("height",0)
            .attr("width",0)     
            .duration(500);

        bars.filter(function(d) {
                return filtered.indexOf(d.key) == -1;
              })
            .transition()
            .attr("x", function(d) { return x(d.key); })
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return barY - y(d.value); })
            .attr("width", x.bandwidth())
            .attr("fill", function(d) { return z(d.key); })
            .duration(500);

        legend.selectAll("rect")
            .transition()
            .attr("fill",function(d) {
              if (filtered.length) {
                if (filtered.indexOf(d) == -1) {
                  return z(d); 
                }
                 else {
                  return "white"; 
                }
              }
              else {
               return z(d); 
              }
            })
            .duration(100);

    }
}

// Draw the legend for the map
function drawLegend(colorScale){

    var barHeight = 30;
    var legendHeight = 560;
    var legendWidth = 280;

    const legendSvg = d3.select("#legend");
    const defs = legendSvg.append("defs");
    
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");
    
    linearGradient.selectAll("stop")
      .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
      .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);
    
    legendSvg.append('g')
        .attr("transform", "translate(0,"+(legendHeight + 6.7*margin.bottom - barHeight)+")")
        .append("rect")
        .attr("stroke","#000")
        .attr("stroke-width", "1")
        .attr('transform', 'translate('+margin.left+',0)')
        .attr("width", legendWidth - margin.right - margin.left)
        .attr("height", barHeight)
        .style("fill", "url(#linear-gradient)");

    // Appending Label for legends
    legendSvg.append("g")
        .append("text")
        .text("Radiation Level")
        .style("font-weight","bold")
        .attr("transform", "translate(85,"+(legendHeight + 6.5*margin.bottom - barHeight)+")");

    legendSvg.append("g")
        .append("text")
        .text("High")
        .attr("transform", "translate(0,"+(legendHeight + 9*margin.bottom - barHeight)+")");

    legendSvg.append("g")
        .append("text")
        .text("Low")
        .attr("transform", "translate(240,"+(legendHeight + 9*margin.bottom - barHeight)+")");
    
    return legendSvg.node();
}

function dateChanged(){
    currentDate = +document.getElementById("dateSelect").value
    drawMap()
    console.log(currentDate)
}

function getExtentsForChoropleth(){
    var radiationArr = choroplethData.map( x => x.radiationMean)
    var extentsArray = []
    for(var arr of radiationArr){
        extentsArray.push(arr[currentDate-6])
    }
    var max = d3.max(extentsArray)
    var min = d3.min(extentsArray)
    console.log(extentsArray)
    console.log(min,max)
    return [max,min]
}

function drawMap(){

    mapSvg.selectAll('*').remove()
    var mapWidth = (width - margin.left - margin.right)/2
    var mapHeight = height - margin.left - margin.right

    let projection = d3.geoMercator()
                        .scale(135000)
                        .center(d3.geoCentroid(mapData))
                        .translate([(mapWidth/2)-margin.left,mapHeight/2]);
    let path = d3.geoPath()
    .projection(projection);

    
    let extent = getExtentsForChoropleth();
    var colorScale = d3.scaleSequential(d3.interpolateRgbBasis([highRadColor, "#FFFFFF",lowRadColor])).domain(extent);

    // Draw Legend for Map
    drawLegend(colorScale)
    
    // Date Slider for mapSvg
    var sliderValue = d3.select("#dateSelect").property("value")
    d3.select("#currentDate").text(sliderValue+" April 2020")
                    

    //Create a basic tooltip
    var mapTooltip = d3.select("body").append("div")
                    .attr("class", "mapTooltip")
                    .style("opacity", 0);

    console.log(projection)
    let g = mapSvg.append('g');
    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', d => { return d.properties.Nbrhood})
        .attr('class', d => { return `${d.properties.Nbrhood.replace(' ','-')} citymap`})
        .style('fill', d => {
            var region = d.properties.Nbrhood
            let val = choroplethData.filter( function(x) {
                if(x.region===region){
                    return x
                }
            })[0].radiationMean[currentDate-6];
            if(isNaN(val)) 
              return 'gray';
            return colorScale(val);
          })
        .style('stroke-width','2')
        .style('stroke', '#fff')
        .style('cursor', 'pointer')
        .on('click', function(d,i) {
            zoomMap(d,path,projection,colorScale)
            drawPie(d.properties.Nbrhood)
            drawBar(d.properties.Nbrhood)
        })
        .on('mousemove', function(d,i){
            var region = d.properties.Nbrhood;
            let val = choroplethData.filter( function(x) {
                if(x.region===region){
                    return x
                }
            })[0].radiationMean[currentDate-6];               

            mapTooltip.style("opacity", 1)
                    .html(`Region: ${region} <br> Radiation: ${val}`)
                    .style("left", (d3.event.pageX + 11) + "px")
                    .style("top", (d3.event.pageY - 14) + "px");
        })
        .on('mouseover', function(d,i){
            console.log('mouseover on ' + d.properties.Nbrhood);
            //Tooltip
            mapTooltip.style("opacity", 1);
        })
        .on('mouseout', function(d,i){
            console.log('mouseout on ' + d.properties.Nbrhood);
            //Tooltip
            mapTooltip.style("opacity", 0);
        })

    // Appending Label for mapSvg
    mapSvg.append("g")
        .append("text")
        .text("St.Himark's Radiation Map")
        .style("font-size","18px")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .style('text-decoration', 'underline')
        .attr("transform", "translate(" + (mapWidth/2) + "," + (margin.top+margin.bottom) + ")");

    g.selectAll('text')
        .data(mapData.features)
        .enter().append("text")
        .attr("class","regionLabel")
        .text(d => `${d.properties.Nbrhood}`)
        .attr("x",d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("text-anchor","middle")
        .attr("font-size",12)
        .style('cursor', 'default')
        .attr("font-weight",800)
}

function zoomMap(data,path,projection,colorScale){
    
    var region = data.properties.Nbrhood

    var mapWidth = (width - margin.left - margin.right)/2
    var mapHeight = height - margin.left - margin.right

    var t = d3.transition().duration(800)
    
    var citySvg = mapSvg.selectAll(".citymap")

    mapSvg.selectAll(".regionLabel").remove()

    console.log(projection)
    projection.fitExtent(
        [[margin.left, margin.top], [mapWidth - margin.left, mapHeight - margin.top]],
        data
    )

    citySvg.transition(t)
    .attr('d', path)
    .style('fill','gray')
    .attr('fill-opacity',0)
    .style('stroke',"black")
    .style('stroke-width',"0.1")
    .style('cursor', 'pointer')

    mapSvg.selectAll(`.${region.replace(' ','-')}`)
    .attr('d',path)
    .attr("id","active")
    .transition(t)
    .style('fill',function(data) {
        console.log(data)
        var region = data.properties.Nbrhood
        let val = choroplethData.filter( function(x) {
            if(x.region===region){
                return x
            }
        })[0].radiationMean[currentDate-6];
        console.log(colorScale(val))
        if(isNaN(val)) 
          return 'gray';
        return colorScale(val);
    })
    .attr('fill-opacity',1)
    .style('cursor', 'default')
    
    mapSvg.append("text")
        .attr("class","regionLabel")
        .text(`${region}`)
        .attr("x", mapWidth/2)
        .attr("y", mapHeight/2)
        .attr("text-anchor","middle")
        .transition(t)
        .attr("font-size",32)
        .attr("font-weight",800)
        .style('cursor', 'pointer')
    
    mapSvg.selectAll(`.regionLabel`).on("click",function(){
        drawMap();
        drawPie('initial');
        drawBar('initial');
    })

    
}

