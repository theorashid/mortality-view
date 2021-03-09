const startYear = 2002;
const endYear = 2018;
const thinLine = 0.5;
const colorMaleStops = [67, 80, 95];
const colorMale = d3.scaleDiverging(colorMaleStops, d3.interpolateRdBu);
const colorFemaleStops = [73, 83.5, 95];
const colorFemale = d3.scaleDiverging(colorFemaleStops, d3.interpolateRdBu);
const minmaxLifeExpectancy = [65, 105];
const legendGradientStops = 100;


class MortalityMap {
    constructor(div, legend_div, line_chart_div) {
        this.width = div.getBoundingClientRect().width;
        this.height = window.innerHeight * 0.8;

        this.cGender = "female";
        this.cYear = 2018;
        this.scale = 1;
        
        this.zoom = d3.zoom()
            .on('zoom', (event) => {
                this.scale = event.transform.k;
                this.mapSvg.attr('transform', event.transform);
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

        this.slider = document.getElementById("map-slider");
        noUiSlider.create(this.slider, {
            start: endYear,
            step: 1,
            range: {
                'min': startYear,
                'max': endYear
            }
        });

        this.linechart = new MortalityLineChart(line_chart_div);
        this.legend = new MortalityLegend(legend_div);
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
        return "<b>" + msoa + "</b><br>" + district + "<br>" + region + "<br>Life expectancy: " + val + "<br>(" + low + " - " + upp + ")";
    }

    async draw() {
        const MSOAGeoJSON = await d3.json("Data/MSOA2011_downloaded.geojson"); // 3300418 b
        // const MSOATopoJSON = await d3.json("Data/MSOA2011_BGC_0.7.json");
        // const topoGeoJSON = topojson.feature(MSOATopoJSON, "MSOA2011_BGC");

        const dataJSON = await d3.json("Data/MSOAnestede0.json");
        const projection = d3
            .geoMercator()
            .fitExtent([[0, 0], [this.width, this.height]], MSOAGeoJSON);
    
        const path = d3.geoPath().projection(projection);
        let currMSOA = null;
    
        //  associate MSOAGeoJSON data with svg paths
        let mapPoly = this.mapSvg
            .append("g")
            .selectAll("path")
            .data(MSOAGeoJSON.features)
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
            .datum(topojson.mesh(MSOATopoJSON, MSOATopoJSON.objects["MSOA2011_BGC"], (a, b) => a !== b))
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
                    "opacity": 1,
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
        this.slider.noUiSlider.on("change", () => {
            this.cYear = parseInt(this.slider.noUiSlider.get());
            document.getElementById("current-year").innerHTML = this.cYear;

            mapPoly
                .style("fill", d => this.getColor(dataJSON, d));
        })

        // update path fill colors when changing gender
        d3.select("#gender").on("change", (event, d) => {
            this.cGender = document.getElementById("gender").checked ? "male" : "female";

            mapPoly
                .style("fill", d => this.getColor(dataJSON, d));

            this.linechart.reset();
            if (currMSOA) {
                this.linechart.draw(dataJSON[currMSOA], this.cGender == "female" ? 1 : 0, minmaxLifeExpectancy);
            }

            this.legend.draw(this.cGender);
        })
    }
    // todo reload force reset gender and year
    // d.properties["MSOA2011"] == "E02000001"
}

// const MSOAs = MSOAGeoJSON.features.map(d => d.properties.MSOA2011);
