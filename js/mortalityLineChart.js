const maleColor = "#35978f";
const femaleColor = "#A6611A";

class MortalityLineChart {
    constructor(div) {
        const actualWidth = div.getBoundingClientRect().width * 0.9;
        const actualHeight = actualWidth * 0.5;
        this.totalWidth = 600;
        this.totalHeight = 300;
        this.margins = { left: 34, right: 15, top: 6, bottom: 16 };
        this.width = this.totalWidth - this.margins.left - this.margins.right;
        this.height = this.totalHeight - this.margins.top - this.margins.bottom;
        const scaleRatio = actualWidth / this.totalWidth;
        this.svg = d3.select(div)
            .append("svg")
            .attr("width", actualWidth)
            .attr("height", actualHeight)
            .append("g").attr("transform",
                `scale(${scaleRatio},${scaleRatio}) translate(${this.margins.left},${this.margins.top})`);
        this.reset();
    }

    reset() {
        this.svg.selectAll("*").remove();

        // Prepare the line and stddev area (z-ordering matters)
        this.svg.append("path").attr("class", "mortalityLineArea");
        this.svg.append("path").attr("class", "mortalityLine");

        // Prepare X axis
        this.x = d3.scaleLinear().range([0, this.width]);
        this.xAxis = d3.axisBottom().scale(this.x).tickFormat(d3.format("d"));;
        this.xAxisG = this.svg.append("g").attr("transform", `translate(0,${this.height})`);

        // Prepare Y axis
        this.y = d3.scaleLinear().range([this.height, 0]);
        this.yAxis = d3.axisLeft().scale(this.y);
        this.yAxisG = this.svg.append("g");
        this.yAxisG.attr("id", "y-axis");

        this.hasContent = false;
    }

    draw(data, gender_id, minmax_age) {
        const maybeTransition = this.hasContent ? (obj => obj.transition().duration(1000)) : (obj => obj);

        const mortality = data[3][gender_id];
        const years = Object.keys(mortality).map(y => parseInt(y));
        const mortalityValues = Object.values(mortality);

        // Render the X axis
        const x = this.x;
        x.domain([d3.min(years), d3.max(years)]);
        this.xAxis.tickValues(years);
        maybeTransition(this.xAxisG).call(this.xAxis);

        // Render the Y axis
        const y = this.y;
        minmax_age = minmax_age || [d3.min(mortalityValues, m => m[1]) - 0.1, d3.max(mortalityValues, m => m[2]) + 0.1];
        y.domain(minmax_age);
        maybeTransition(this.yAxisG).call(this.yAxis);

        const yAxisNode = document.getElementById("y-axis");
        const yAxisPath = yAxisNode.childNodes[0];
        yAxisPath["id"] = "y-axis-path";

        // Render the stddev area
        const area = this.svg.selectAll(".mortalityLineArea").data([mortalityValues], (d, i) => i);
        maybeTransition(area.enter().append("path").attr("class", "mortalityLineArea").merge(area))
            .attr("d", d3.area().x((d, i) => x(years[i])).y0((d, i) => y(d[1])).y1((d, i) => y(d[2])))
            .attr("fill", gender_id == 0 ? maleColor : femaleColor)
            .attr("opacity", "0.3");

        // Render the line
        const line = this.svg.selectAll(".mortalityLine").data([mortalityValues]);
        maybeTransition(line.enter().append("path").attr("class", "mortalityLine").merge(line))
            .attr("d", d3.line().x((d, i) => x(years[i])).y((d, i) => y(d[0])))
            .attr("fill", "none")
            .attr("stroke", gender_id == 0 ? maleColor : femaleColor)
            .attr("stroke-width", 2.5);

        if (!this.hasContent) {
            this.svg.append("text")
                .style("text-anchor", "start")
                .attr("x", 10)
                .attr("y", "0.5em")
                .text("Life expectancy")
                .attr("font-weight", "bold")
                .attr("font-size", "12px");
            this.msoaName1 = this.svg.append("text")
                .style("text-anchor", "end")
                .attr("x", this.width)
                .attr("y", "0.5em")
                .attr("font-weight", "bold")
                .attr("font-size", "12px");
            this.msoaName2 = this.svg.append("text")
                .style("text-anchor", "end")
                .attr("x", this.width)
                .attr("y", "1.75em")
                .attr("font-size", "12px");
            this.msoaName3 = this.svg.append("text")
                .style("text-anchor", "end")
                .attr("x", this.width)
                .attr("y", "3em")
                .attr("font-size", "12px");
            this.hasContent = true;
        }
        this.msoaName1.text(data[0]);
        this.msoaName2.text(data[1]);
        this.msoaName3.text(data[2]);
    }
}
