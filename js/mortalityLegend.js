function toColorScale(stops, value) {
    const scaleBreadth = stops[stops.length - 1] - stops[0];
    return stops[0] + value * scaleBreadth;
}

class MortalityLegend {
    constructor(legend_div) {
        const legendWidth = legend_div.getBoundingClientRect().width * 0.7;
        const legendHeight = legend_div.getBoundingClientRect().height;
        this.legendSvg = d3.select(legend_div)
            .append("svg")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .append("g");

        // Create gradients for each gender
        const defs = this.legendSvg.append("defs");
        this.maleGradient = defs.append("linearGradient").attr("id", "male-gradient");
        this.maleGradient.selectAll("stop")
            .data((new Array(legendGradientStops)).fill(0).map((t, i, n) => ({
                offset: `${100 * i / n.length}%`,
                color: colorMale(toColorScale(colorMaleStops, i / n.length)) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
        
        this.femaleGradient = defs.append("linearGradient").attr("id", "female-gradient");
        this.femaleGradient.selectAll("stop")
            .data((new Array(legendGradientStops)).fill(0).map((t, i, n) => ({
                offset: `${100 * i / n.length}%`,
                color: colorFemale(toColorScale(colorFemaleStops, i / n.length)) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        this.legend = this.legendSvg.append('g')
            .append("rect")
            .attr("transform", "translate(0,30)")
            .attr("width", legendWidth)
            .attr("height", 15)
            .style("fill", "url(#female-gradient)");

        // Create legend axes
        this.legendAxisMale = d3.axisBottom(
            d3.scaleLinear()
            .range([0, legendWidth])
            .domain([67, 95])
        );

        this.legendAxisFemale = d3.axisBottom(
            d3.scaleLinear()
            .range([0, legendWidth])
            .domain([73, 95])
        );
            
        this.legendBar = this.legendSvg.append("g")
            .attr("transform", "translate(0,30)")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("class", "legend-tick-linesandtext")
            .call(this.legendAxisFemale)
            .attr("id", "legend-axis");

        const legendXAxis = document.getElementById("legend-axis");
        const legendAxisPath = legendXAxis.childNodes[0];
        legendAxisPath["id"] = "legend-axis-path";

        this.drawLegendLines();

        // Create legend text
        const legendText = this.legendSvg.append("text")
            .attr("transform", "translate(44,20)")
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .text("Life expectancy");
    }

    drawLegendLines() {
        const tickLines = d3.selectAll(".legend-tick-linesandtext").selectAll(".tick line")
            .attr("class", "legend-tick-lines")
            .attr("y2", 20);

        const tickText = d3.selectAll(".legend-tick-linesandtext").selectAll(".tick text")
            .attr("class", "legend-tick-text")
            .attr("dy", "2.31em");
    }

    draw(gender) {
        let genderGradient = gender == "female" ? "female-gradient" : "male-gradient";
        let genderAxis = gender == "female" ? this.legendAxisFemale : this.legendAxisMale;
        this.legend.style("fill", "url(#" + genderGradient + ")");
        this.legendBar.call(genderAxis);
        this.drawLegendLines();
    }
}