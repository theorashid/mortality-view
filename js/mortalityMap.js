class MortalityMap {
    constructor(div) {
        this.width = 660;
        this.height = 800;
        this.startYear = 2002;
        this.endYear = 2018;
        this.cGender = "male";
        this.cYear = 2018;
        this.scale = 1;
        this.thinLine = 0.5;
        this.thickLine = 1.5;

        this.zoom = d3.zoom()
            .on('zoom', (event) => {
                this.scale = event.transform.k;
                this.mapSvg.attr('transform', event.transform);
                d3.selectAll(".map-path")
                    .style("stroke-width", this.thinLine/this.scale)
            })
            .scaleExtent([1, 40]);

        this.mapSvg = d3.select(div)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("id", "map-svg")
            .style("margin-left", "-24px")
            .call(this.zoom)
            .append("g");

        this.tooltip = d3.select("body").append("div").attr("class", "tooltip hidden");

        this.slider = document.getElementById("map-slider");
        noUiSlider.create(this.slider, {
            start: this.endYear,
            step: 1,
            range: {
                'min': this.startYear,
                'max': this.endYear
            }
        });

        this.linechart = new MortalityLineChart(document.getElementById("line-chart"));
    }

    getColor(dataJSON, d) {
        const color = d3.scaleDiverging([65, 79.5, 95], d3.interpolateRdBu);
        return color(dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][0]);
    }

    getTooltipText(dataJSON, d) {
        const msoa = dataJSON[d.properties["MSOA2011"]][0];
        const val = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][0];
        const low = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][1];
        const upp = dataJSON[d.properties["MSOA2011"]][3][this.cGender == "female" ? 1 : 0][this.cYear][2];
        return "<b>" + msoa + "</b><br>Mortality: " + val + " (" + low + " - " + upp + ")";
    }

    async draw() {
        // const MSOAGeoJSON = await d3.json("Data/MSOA2011_BGC.geojson");
        const MSOAGeoJSON = await d3.json("Data/MSOA2011_downloaded.geojson");
        const dataJSON = await d3.json("Data/MSOAnestede0.json");
    
        const projection = d3
            .geoMercator()
            .fitExtent([[20, 20], [this.width, this.height]], MSOAGeoJSON);
    
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
                "stroke": "#fff",
                "stroke-width": this.thinLine/this.scale,
                "fill": d => this.getColor(dataJSON, d),
                })

        // update stroke and add tooltip on mouseover
        mapPoly.on("mouseover", (event, d) => {
            d3.select(event.target).style("stroke-width", this.thickLine/this.scale);
            d3.select(event.target).style("stroke", "black");

            let tooltipText = this.getTooltipText(dataJSON, d);

            this.tooltip.classed("hidden", false)
                .html(tooltipText)
                .style("left", (event.x + 16) + "px")
                .style("top", (event.y - 16) + "px")
                .style("display", "block")
                .style("opacity", 1);
        })
        
        // update stroke and remove tooltip on mouseout
        mapPoly.on("mouseout", (event, d) => {
            d3.select(event.target).style("stroke-width", this.thinLine/this.scale);
            d3.select(event.target).style("stroke", "#fff");
            this.tooltip.classed("hidden", true);
        })

        mapPoly.on("click", (event, d) => {
            this.linechart.draw(dataJSON[d.properties["MSOA2011"]], this.cGender == "female" ? 1 : 0);
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
            this.cGender = document.getElementById("gender").value;

            mapPoly
                .style("fill", d => this.getColor(dataJSON, d));

            this.linechart.reset();
            this.linechart.draw(dataJSON[currMSOA], this.cGender == "female" ? 1 : 0);
        })
    }
    // todo reload force reset gender and year
    // d.properties["MSOA2011"] == "E02000001"
}

// const MSOAs = MSOAGeoJSON.features.map(d => d.properties.MSOA2011);

// Labels based on World Bank life expectancy data
// function e0Labels(x) {
//     if (x == 66.5) return "Rwanda";
//     if (x == 76.1) return "USA";
//     if (x == 79.5) return "UK";
//     if (x == 81.25) return "Japan";
//     return x;
// }

// svg
//   .append("g")
//   .attr("transform", "translate(100, 350)")
//   .append(() =>
//     legend({
//       color,
//       title: "Life expectancy",
//       tickValues: [70, 75, 80, 85, 90],
//       width: 260
//     })
//   );

// svg
//   .append("g")
//   .attr("transform", "translate(100, 400)")
//   .append(() =>
//     legend({
//       color,
//       tickValues: [66.5, 76.1, 81.25],
//       width: 260,
//       tickFormat: e0Labels
//     })
//   );