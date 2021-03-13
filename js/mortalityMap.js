const startYear = 2002;
const endYear = 2018;
const thinLine = 0.8;
const colorMaleStops = [67, 80, 95];
const colorMale = d3.scaleDiverging(colorMaleStops, d3.interpolateRdBu);
const colorFemaleStops = [73, 83.5, 95];
const colorFemale = d3.scaleDiverging(colorFemaleStops, d3.interpolateRdBu);
const minmaxLifeExpectancy = [65, 105];
const legendGradientStops = 100;


class MortalityMap {
    constructor(div, legend_div, line_chart_div) {
        this.width = div.getBoundingClientRect().width;
        this.height = window.innerHeight * 0.75;

        this.cGender = "female";
        this.cYear = 2018;
        this.scale = 1;
        
        this.zoom = d3.zoom()
            .on("zoom", (event) => {
                this.scale = event.transform.k;
                this.mapSvg.attr("transform", event.transform);
                // d3.selectAll(".map-path")
                //     .style("stroke-width", thinLine/this.scale)
                d3.selectAll(".line-path")
                    .style("stroke-width", thinLine/this.scale)

            })
            .scaleExtent([1, 40]);

        this.mapSvg = d3.select(div)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("id", "map-svg")
            .call(this.zoom)
            .append("g");

        this.tooltip = d3.select("body").append("div").attr("class", "tooltip hidden");

        this.linechart = new MortalityLineChart(line_chart_div);
        this.legend = new MortalityLegend(legend_div);

        this.slider = this.drawSlider();
    }

    drawSlider() {
        const width = document.getElementById("map-slider").getBoundingClientRect().width * 0.9;
        console.log("width", width)
        const dataTime = d3.range(0, endYear - startYear + 1).map(function(d) {
            return new Date(startYear + d, 1, 1);
          });
        
        const sliderTime = d3
            .sliderBottom()
            .min(d3.min(dataTime))
            .max(d3.max(dataTime))
            .step(1000 * 60 * 60 * 24 * 365)
            .width(width * 0.8)
            .tickFormat(d3.timeFormat("%Y"))
            .tickValues(dataTime)
            .default(new Date(endYear, 1, 1));
    
        const gTime = d3
            .select("div#map-slider")
            .append("svg")
            .attr("width", width)
            .attr("height", 100)
            .append("g")
            .attr("transform", "translate(30,10)");
    
        gTime.call(sliderTime);
        d3.select("#current-year").text(d3.timeFormat("%Y")(sliderTime.value()));

        return sliderTime;
    }

    getColor(dataJSON, d) {
        let years = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][0];
        return this.cGender == "female" ? colorFemale(years) : colorMale(years);
    }

    getTooltipText(dataJSON, d) {
        const msoa = dataJSON[d.properties["MSOA2011"]][0];
        const district = dataJSON[d.properties["MSOA2011"]][1];
        const region = dataJSON[d.properties["MSOA2011"]][2];
        const val = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][0];
        const low = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][1];
        const upp = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][2];
        return "<b>" + msoa + "</b><br>" + district + "<br>" + region + "<br><br>" + val + " (" + low + " - " + upp + ") years";
    }

    async draw() {
        // const MSOAGeoJSON = await d3.json("Data/MSOA2011_downloaded.geojson"); // 3300418 b
        const LADTopoJSON = await d3.json("Data/LAD2020_BGC_0.4.json")

        const MSOATopoJSON = await d3.json("Data/MSOA2011_BGC_0.4.json");
        const topoGeoJSON = topojson.feature(MSOATopoJSON, "MSOA2011_BGC");

        const dataJSON = await d3.json("Data/MSOAnestede0.json");
        const projection = d3
            .geoMercator()
            .fitExtent([[0, 0], [this.width, this.height]], topoGeoJSON);
    
        const path = d3.geoPath().projection(projection);
        let currMSOA = null;
    
        //  associate MSOAGeoJSON data with svg paths
        let mapPoly = this.mapSvg
            .append("g")
            .selectAll("path")
            .data(topoGeoJSON.features)
            .join("path")

        // style paths
        mapPoly
            .attr("d", path)
            .attr("class", "map-path")
            .styles({
                // "stroke": "#fff",
                // "stroke-width": thinLine/this.scale,
                "fill": d => this.getColor(dataJSON, d),
                })

        // add mesh lines here
        this.mapSvg.append("path")
            .datum(topojson.mesh(LADTopoJSON, LADTopoJSON.objects["LAD2020_BGC"], (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", thinLine/this.scale)
            .attr("stroke-linejoin", "round")
            .attr("d", path)
            .attr("class", "line-path");

        // update stroke and add tooltip on mouseover
        mapPoly.on("mouseover", (event, d) => {
            d3.select(event.target).style("opacity", 0.5);

            let tooltipText = this.getTooltipText(dataJSON, d);

            this.tooltip.classed("hidden", false)
                .html(tooltipText)
                .styles({
                    "left": (event.x + 16) + "px",
                    "top": (event.y - 16) + "px",
                    "display": "block",
                    "opacity": 0.9,
                })
        })
        
        // update stroke and remove tooltip on mouseout
        mapPoly.on("mouseout", (event, d) => {
            d3.select(event.target).style("opacity", 1);

            this.tooltip.classed("hidden", true);
        })

        mapPoly.on("click", (event, d) => {
            this.linechart.draw(dataJSON[d.properties["MSOA2011"]], this.cGender == "female" ? 1 : 0, minmaxLifeExpectancy);
            currMSOA = d.properties["MSOA2011"];
        })
        
        // update year and path fill colors when changing year using slider
        this.slider.on("end", val => {
            this.cYear = val.getFullYear();
            d3.select("#current-year").text(d3.timeFormat("%Y")(val));

            mapPoly
                .style("fill", d => this.getColor(dataJSON, d))
        })

        // update path fill colors when changing gender
        d3.select("#gender").on("change", (event, d) => {
            this.cGender = document.getElementById("gender").checked ? "male" : "female";

            this.legend.draw(this.cGender);

            mapPoly
                .style("fill", d => this.getColor(dataJSON, d));

            this.linechart.reset();
            if (currMSOA) {
                this.linechart.draw(dataJSON[currMSOA], this.cGender == "female" ? 1 : 0, minmaxLifeExpectancy);
            }            
        })
    }
    // d.properties["MSOA2011"] == "E02000001"
}

// const MSOAs = MSOAGeoJSON.features.map(d => d.properties.MSOA2011);
