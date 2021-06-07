var mapJSON = 'public/StHimark.geojson'
var gridJSON = 'public/grids.json'
var gridData = ''
var mapData = ''
var canvasSvg = d3.select('#canvas');
var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var sensorGridSvg = d3.select("#grids");
var legendSvg = d3.select("#gridLegend");

var width = canvasSvg.style('width').replace('px','')
var height = canvasSvg.style('height').replace('px','') 

var gridWidth 
var gridHeight 
var mapWidth 
var mapHeight 
var areaWidth
var areaHeight 

var gridSvg = '';
var mapSvg = '';
var areaSvg = ''; 

var staticColor = "#ffd369"
var mobileColor = "#03506f"

var currentDate = 6
var currentSensorData = []

var mapColor = "white"
var mapStrokeColor = "#000000"

var currentSensorType = 'all'

var currentSensor = ''

function runOnLoad(){
    Promise.all([d3.json(mapJSON),d3.json(gridJSON)]).then(function(values){
        mapData = values[0]
        gridData = values[1]

        mapWidth = (width - margin.left - margin.right)/2
        mapHeight = (height - margin.left - margin.right)*0.80
        areaWidth = (width - margin.left - margin.right)/2
        areaHeight = (height - margin.left - margin.right)/1.25
        gridWidth = width
        gridHeight = height - margin.top - margin.bottom

        mapSvg = canvasSvg.append("g")
        .attr("width", (width - margin.left - margin.right)/2)
        .attr("height", (height - margin.left - margin.right)*0.80)
        .attr('id','map')
        .attr("transform", `translate(${3*(-margin.left-margin.right)},${2*(-margin.right)})`);

        areaSvg = canvasSvg.append("g")
        .attr("width", (width - margin.left - margin.right)/2)
        .attr("height", (height))
        .attr('id','area')
        .attr("transform", `translate(${(mapWidth-margin.left)},${mapHeight/3.7})`);

        areaSvg.append("text")
        .attr("text-anchor","middle")
        .text("Click on a sensor for radiation plot")
        .attr("font-size","24")
        .attr("transform", `translate(${(mapWidth/2)},${mapHeight/4})`)
        
        gridLegendSvg = legendSvg.append("g")
        .attr("width", (width - margin.left - margin.right)/2)
        .attr("height", 200)
        .attr('id','gridsLegend')
        .attr("transform", "translate("+(0)+","+(50)+")")
        
        
        gridSvg = sensorGridSvg.append("g")
        .attr("width", (width))
        .attr("height", height - margin.top - margin.bottom)
        .attr('id','gridChart')
        .attr("transform", "translate("+width/2.2+","+(3*(-margin.left))+")")
        
        document.getElementById("dateSelect").disabled = true
        d3.select("#currentDate").text(currentDate+" April 2020")
        document.getElementById('dateSelect').value = currentDate
        document.getElementById('selectSensorType').value = currentSensorType

        plotMap()
        drawGridLegend()
        plotGrid()

    })
}

function drawGridLegend(){

    gridLegendSvg.append("text")
    .attr("x",340)
    .attr("y",40)
    .text("How to read this heat map?")
    .attr("font-size",20)
    .style("font-weight",700)
    .attr("text-anchor","middle")

    gridLegendSvg.append("rect")
    .attr("class","sensorLegend")
    .attr("x",250)
    .attr("y",100)
    .attr("height",75)
    .attr("width",75)
    .attr("fill", mobileColor)
    .style("cursor", "pointer")
    .on("mouseover",function(){
        if(currentSensorType === 'all'){
            d3.select(this).attr("fill",staticColor)
            d3.select('.legendHint').text("Static Sensor")
            d3.select('.endGradient').attr("stop-color", staticColor)
        }
    })
    .on("mouseout",function(){
        if(currentSensorType == 'all'){
            d3.select(this).attr("fill",mobileColor)
            d3.select('.legendHint').text("Mobile Sensor")
            d3.select('.endGradient').attr("stop-color", mobileColor)
        }
    })

    gridLegendSvg.append("text")
    .attr("class","legendHint")
    .attr("x",335)
    .attr("y",125)
    .text("Mobile Sensor")
    .style("font-size","18")
    .style("font-weight",700)

    gridLegendSvg.append("text")
    .attr("x",335)
    .attr("y",145)
    .text("on 6 Apr 2020 between 6AM - 12PM")
    .style("font-size","18")
    .style("font-weight",700)

    gridLegendSvg.append("text")
    .attr("x",250)
    .attr("y",85)
    .text("6 Apr 2020")
    .attr("font-size",12)
    .style("font-weight",700)

    gridLegendSvg.append("text")
    .attr("x",-145)
    .attr("y",235)
    .text("6AM - 12PM")
    .attr("font-size",12)
    .attr("text-anchor","middle")
    .style("font-weight",700)
    .attr("transform", "rotate(270)");

    gridLegendSvg.append("text")
    .attr("x",125)
    .attr("y",240)
    .text("% of readings")
    .style("font-size","18")
    .style("font-weight",700)

    var saturationSvg =  gridLegendSvg.append('g')
    .attr("width",250)
    .attr("height",25)
    .attr("transform","translate(300,210)")

    gridLegendSvg.append("text")
    .attr("x",280)
    .attr("y",220)
    .text("Low")
    .style("font-size","12")
    

    gridLegendSvg.append("text")
    .attr("x",525)
    .attr("y",220)
    .text("High")
    .style("font-size","12")

    var defs = saturationSvg.append("defs");

    var gradient = defs.append("linearGradient")
    .attr("id", "svgGradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "75%")
    .attr("y2", "100%");

    gradient.append("stop")
    .attr('class', 'startGradient')
    .attr("offset", "0%")
    .attr("stop-color", "#ebebeb")
    .attr("stop-opacity", 0);

    gradient.append("stop")
    .attr('class', 'endGradient')
    .attr("offset", "100%")
    .attr("stop-color", mobileColor)
    .attr("stop-opacity", 1);

    saturationSvg.append('rect')
    .attr('x', 0)
    .attr('y', 20)
    .attr('width', 250)
    .attr('height', 10)
    .attr('fill',"url(#svgGradient)")
    .attr('stroke','black');
    

}


function dateChanged(){
    currentDate = +document.getElementById("dateSelect").value
    // var sliderValue = d3.select("#dateSelect").property("value")
    d3.select("#currentDate").text(currentDate+" April 2020")
    plotArea()
    console.log(currentDate)
}

function selectionChanged(){
    currentSensorType = document.getElementById('selectSensorType').value;
    console.log(currentSensorType)
    d3.select(".sensorLegend").attr("fill", function(){
        if(currentSensorType === "static"){
            return staticColor
        }
        return mobileColor
    })
    d3.select(".legendHint").text(function(){
        if(currentSensorType === "static"){
            return "Static Sensor"
        }
        return "Mobile Sensor"
    })
    d3.select(".endGradient").attr("stop-color", function(){
        if(currentSensorType === "static"){
            return staticColor
        }
        return mobileColor
    })
    plotGrid()
}

function plotMap(){

    var plotX = gridWidth
    var plotY = height - margin.top - margin.bottom

    let projection = d3.geoMercator()
    .scale(100000)
    .center(d3.geoCentroid(mapData))
    
    let path = d3.geoPath()
    .projection(projection);

    let g = mapSvg.append('g')
    .attr("transform",`translate(${plotX},${plotY}`);

    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', d => { return d.properties.Nbrhood})
        .style('fill',mapColor)
        .style('stroke-width','0.5')
        .style('stroke',mapStrokeColor);

    g.selectAll('text')
    .data(mapData.features)
    .enter().append("text")
    .text(d => `${d.properties.Nbrhood}`)
    .attr("x",d => path.centroid(d)[0])
    .attr("y", d => path.centroid(d)[1])
    .attr("text-anchor","middle")
    .attr("font-size",10)

}


function plotTimeGrids(data,x,y,svg){
    var id = data.sensorID
    var type = data.sensorType
    var arr = data.readingsArr
    var centerX = x + 10
    var centerY = y + 10
    var rowCount = 1
    var count = 0
    var opacityArr = []

    var divToolTip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    var timeFrameArr = ['12AM - 6AM','6AM - 12PM','12PM - 6PM','6PM - 12AM']

    for(var i=0;i<20;i++){
        var date = (6+i%5).toString()+" Apr 2020"
        
        var time = ''

        if( i>=0 && i<5){
            time = timeFrameArr[0]
        }
        else if( i>=5 && i<10){
            time = timeFrameArr[1]
        }
        else if( i>=10 && i<15){
            time = timeFrameArr[2]
        }
        else if( i>=15 && i<20){
            time = timeFrameArr[3]
        }
        
        var obj = {
            "idx": i,
            "date": date,
            "time": time,
            "opacity": arr[i]
        }
        opacityArr.push(obj)
    }


    svg.selectAll("g")
    .data(opacityArr)
    .enter().append("rect")
    .attr("x",function(d){
        var idx = d.idx
        if(idx%5===0){
            centerX = x + 10
        }
        else{
            centerX = x + 10 + 30*(idx%5)
        }
        return centerX
    })
    .attr("y",function(d){
        var idx = d.idx
        if(idx%5===0){
            centerY = y + 10 + 6*(idx+1)
        }
        else{
            centerY = centerY             
        }
        return centerY
    })
    .attr("height",25)
    .attr("width",25)
    .style("stroke","#d3d3d3")
    .style("fill",function(){
        if(type==="static"){
            return staticColor
        }
        else{
            return mobileColor
        }
    })
    .style("fill-opacity", d=>d.opacity)
    .on("mouseover",function(d,i){
        var idx = d.idx

        divToolTip
        .transition()
        .duration(50)
        .style("opacity",1)

        var toolTipString = `Date: ${d.date} <br /> Time: ${d.time} <br /> Number of readings: ${parseInt(d.opacity*4320)} `
        
        divToolTip.html(toolTipString)
        .style("left",  (d3.event.pageX + 10)+'px' )
        .style("top", (d3.event.pageY + 10)+'px' );
    })
    .on("mousemove",function(d,i){
        divToolTip.style("left",  (d3.event.pageX + 10)+'px' )
        .style("top", (d3.event.pageY + 10)+'px');
    })
    .on("mouseout",function(d,i){
        divToolTip
        .transition()
        .duration('50')
        .style("opacity", 0)
    })    
}

function plotGrid(){
    gridSvg.selectAll('*').remove()
    
    var sensorSvg = gridSvg.append("g")
    .attr("width", gridWidth)
    .attr("height", gridHeight)
    .attr("transform", `translate(${0},${0})`);

    var data = gridData

    if(currentSensorType!='all'){
        data = gridData.filter(function(d){
            if(d.sensorType===currentSensorType){
                return d
            }
        })
    }

    sensorSvg.selectAll('*').remove()
    
    sensorSvg.selectAll("g")
    .data(data)
    .enter().append("rect")
    .attr("class","sensorGrid")
    .attr("x",function(d){
        var idx = data.indexOf(d)
        if(idx%4===0){
            return 50
        }
        else{
            return  50 + 200*(idx%4)
        }
    })
    .attr("y",function(d){
        var idx = data.indexOf(d)
        if(idx%4===0){
            return 50+(200*parseInt(idx/4))
        }
        else{
            return 50 + (200*parseInt(idx/5))
        }
    })
    .attr("height",175)
    .attr("width",175)
    .style("fill","none")

    sensorSvg.selectAll(".sensorID").remove()
    
    sensorSvg.selectAll("g")
    .data(data)
    .enter().append("text")
    .attr("class", "sensorID")
    .attr("x",function(d){
        var idx = data.indexOf(d)
        if(idx%4===0){
            return 85
        }
        else{
            return  85 + 200*(idx%4)
        }
    })
    .attr("y",function(d){
        var idx = data.indexOf(d)
        if(idx%4===0){
            return 210 + (200*parseInt(idx/4))
        }
        else{
            return 210 + (200*parseInt(idx/4))
        }
    })
    .text(function(d){
        return `SensorID: ${d.sensorID}`
    })
    .style("cursor","pointer")
    .attr("font-size", "15px")
    .attr("font-weight",800)
    .on("click",function(d){
        var dataFile = 'public/sensors/'+d.sensorType+'/'+d.sensorID+'.json'
        Promise.all([d3.json(dataFile)]).then(function(values){
            currentSensor = d.sensorType+'-'+d.sensorID
            currentSensorData = values[0]
            plotSensorOnMap(d,currentSensorData)
            document.getElementById("dateSelect").disabled = false
            plotArea()
            mapSvg.selectAll("circle").transition().duration(2000).attr('r','15px')
        }
    )});

    // Appending internal tiny rectangles
    for(var entry in data){
        var xCoord = null
        var yCoord = null
        
        if(entry%4===0){
            xCoord = 50
        }
        else{
            xCoord = 50 + 200*(entry%4)
        }

        if(entry%4===0){
            yCoord = 50+(200*parseInt(entry/4))
        }
        else{
            yCoord = 50 + (200*parseInt(entry/4))
        }

        plotTimeGrids(data[entry],xCoord,yCoord,sensorSvg)
    }
}

function plotSensorOnMap(sensorMD,sensorData){
    
    mapSvg.selectAll('*').remove()

    var plotX = mapWidth
    var plotY = mapHeight

    let projection = d3.geoMercator()
    .scale(100000)
    .center(d3.geoCentroid(mapData))
    
    let path = d3.geoPath()
    .projection(projection);

    let g = mapSvg.append('g')
    .attr("transform",`translate(${plotX},${plotY}`);

    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('id', d => { return d.properties.Nbrhood})
        .style('fill',mapColor)
        .style('stroke-width','0.5')
        .style('stroke',mapStrokeColor);

    if(sensorMD.sensorType==="static"){

        var location = [sensorData[0].Long,sensorData[0].Lat]

        mapSvg.selectAll("circle")
        .data([location]).enter()
		.append("circle")
		.attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
		.attr("cy", function (d) { return projection(d)[1]; })
		.attr("r", "0px")
        .attr("fill", staticColor)
        .style("opacity",0.75)
        .transition()
        .duration(2000)
        .attr("r", "10px")
    }
    else{
        var coords = []
        coords = sensorData.map( x => [x.Long,x.Lat])

        var pathObj =  {"type": "LineString", "coordinates": coords }

        const transitionPath = d3.transition().ease(d3.easeSin).duration(750);        


        var sensorLine =  mapSvg.selectAll(".sensorPath")
        .data([pathObj]).enter()
        .append("path")
        .attr('class','sensorPath')
        .attr("d", path)
        .attr("stroke",mobileColor)
        .attr("stroke-width",5)
        .attr("fill","none")
        .style("opacity",0.75);

        var totalLength = sensorLine.node().getTotalLength();
        console.log("length")
        console.log(totalLength)
        sensorLine
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(10000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
    }

    g.selectAll('text')
    .data(mapData.features)
    .enter().append("text")
    .text(d => `${d.properties.Nbrhood}`)
    .attr("x",d => path.centroid(d)[0])
    .attr("y", d => path.centroid(d)[1])
    .attr("text-anchor","middle")
    .attr("font-size",10)
    
}

function plotArea(){
    
    var data = currentSensorData
    var type = currentSensor.split('-')[0]
    areaSvg.selectAll('*').remove()
    var chosenDate = `2020-04-${currentDate} 00:00:00`
    var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    data = data.filter(function(d){
        if(parseTime(d.Timestamp).getDate()===parseTime(chosenDate).getDate()){
            return d
        }
    })

    // Appending Label for chart
    areaSvg.append("text")
    .attr("x",(areaWidth)/2)
    .attr("y",(- margin.top - margin.bottom))
    .attr("text-anchor","middle")
    .text(`Radiation chart for ${currentSensor} on 2020-04-${currentDate}`)
    .style("font-size","18px")
    .style("font-weight", "bold")
    .style("text-anchor", "middle")
    .style('text-decoration', 'underline')
    .attr("opacity",1)

    // Appending Label for X-Axis
    areaSvg.append("g")
        .attr("class", "areaSvgLabel")
        .append("text")
        .attr("x",(areaWidth - margin.left - margin.right)/2)
        .attr("y",(areaHeight))
        .attr("text-anchor","middle")
        .text("Time")
        .style("font-size","15px")
        .style("font-weight", "bold")

    // Appending Label for Y-Axis
    areaSvg.append("g")
        .append("text")
        .text("Radiation")
        .style("font-size","15px")
        .style("font-weight", "bold")
        .attr("transform", "translate(" + (-10+(margin.right)/2) + "," + (30+(areaHeight - margin.top - margin.bottom)/2) + ")rotate(270)");

    var dataArr = data.map( d => d.Value )

    var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return parseTime(d.Timestamp); }))
    .range([margin.left+margin.right, areaWidth])
    
    var y = d3.scaleLinear()
    .domain([0, d3.max(dataArr)])
    .range([(areaHeight)-margin.top-margin.bottom,0])

    var clip = areaSvg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", areaWidth - margin.left - margin.right)
    .attr("height", areaHeight )
    .attr("x", margin.left + margin.right)
    .attr("y", 0);    

    var brush = d3.brushX()                   
    .extent( [ [margin.left + margin.right,0], [areaWidth,areaHeight] ] )  
    .on("end", updateChart)     

    var area = areaSvg.append('g')
    .attr("clip-path", "url(#clip)")

    var areaGenerator = d3.area()
    .x(function(d) { return x(parseTime(d.Timestamp)) })
    .y0(y(0))
    .y1(function(d) { return y(d.Value) })    

    xAxis = areaSvg.append("g")
    .attr("id","areaX")
    .attr("transform", `translate(${0}, ${  - margin.left - margin.right + (areaHeight)})`)
    .call(d3.axisBottom(x));

    yAxis = areaSvg.append("g")
    .attr("id","areaY")
    .attr("transform", `translate(${margin.top+margin.bottom},${0})`)
    .call(d3.axisLeft(y).ticks(10).tickFormat(d => d/10).tickSize(10));

    area.append("path")
    .datum(data)
    .attr("class","areaPlot")
    .attr("fill", function(d){
        if(type==="static"){
            return staticColor
        }
        else{
            return mobileColor
        }
    })
    .attr("stroke", "black")
    .attr("fill-opacity", 0.5)
    .attr("stroke-width", 0.15)
    .attr("d", areaGenerator)
    
  

    area
    .append("g")
    .attr("class", "brush")
    .call(brush);

    var idleTimeout
    function idled() { idleTimeout = null; }


    function updateChart() {
        extent = d3.event.selection
        if(!extent){
            if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            x.domain([4,8])
        }
        else{
            x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
            area.select(".brush").call(brush.move, null) 
        }

        xAxis.transition().duration(1000).call(d3.axisBottom(x))
        area
            .select('.areaPlot')
            .transition()
            .duration(1000)
            .attr("d", areaGenerator)
    }

    areaSvg.on("dblclick",function(){
        x.domain(d3.extent(data, function(d) { return parseTime(d.Timestamp); }))
        xAxis.transition().call(d3.axisBottom(x))
        area
          .select('.areaPlot')
          .transition()
          .attr("d", areaGenerator)
    });    
    
}