// Constants for the charts, that would be useful.
const CHART_WIDTH = 450;
const CHART_HEIGHT = 200;
const MARGIN = { left: 30, bottom: 0, top: 20, right: 0 };
const ANIMATION_DUATION = 300;

let svgBar, svgLine, svgArea, svgScatter;

setup();

function setup () {

  console.log("in setup");
  // Fill in some d3 setting up here if you need
  // for example, svg for each chart, g for axis and shapes

  //event listeners
  d3.select("#dataset").on("change", changeData);
  d3.select("#metric").on("change", changeData);
  d3.select("#random").on("change", changeData);

  //svg for bar chart
  svgBar = d3.select('#Barchart-div')
    .append('svg')
    .attr('width', CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr('height', CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  //svg for line chart
  svgLine = d3.select('#Linechart-div')
    .append('svg')
    .attr('width', CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr('height', CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);
  svgLine.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT})`);
  svgLine.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT})`);

  //svg for area chart
  svgArea = d3.select('#Areachart-div')
    .append('svg')
    .attr('width', CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr('height', CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  //svg for scatter plot
  svgScatter = d3.select('#Scatterplot-div')
    .append('svg')
    .attr('width', CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr('height', CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append('g')
    .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

  changeData();
}

/**
 * Render the visualizations
 * @param data
 */
function update (data) {
  console.log("in update");
  // ****** TODO ******


  // Syntax for line generator.
  // when updating the path for line chart, use the function as the input for 'd' attribute.
  // https://github.com/d3/d3-shape/blob/main/README.md


  // const lineGenerator = d3.line()
  //   .x(d => the x coordinate for a point of the line)
  //   .y(d => the y coordinate for a point of the line);

  // Syntax for area generator.
  // the area is bounded by upper and lower lines. So you can specify x0, x1, y0, y1 seperately. Here, since the area chart will have upper and lower sharing the x coordinates, we can just use x(). 
  // Similarly, use the function as the input for 'd' attribute. 

  // const areaGenerator = d3.area()
  //   .x(d => the x coordinates for upper and lower lines, both x0 and x1)
  //   .y1(d => the y coordinate for the upper line)
  //   .y0(d=> the base line y coordinate for the area);


  //Set up scatter plot x and y axis. 
  //Since we are mapping death and case, we need new scales instead of the ones above. 
  //Cases would be the horizontal axis, so we need to use width related constants.
  //Deaths would be vertical axis, so that would need to use height related constants.


  //TODO 
  // call each update function below, adjust the input for the functions if you need to.

  const selectedMetric = d3.select("#metric").node().value;
  console.log(selectedMetric);
  updateBarChart(data);
  updateLineChart(data);
  updateAreaChart(data);
  updateScatterPlot(data);
}

/**
 * Update the bar chart
 */
function updateBarChart(data) {
  console.log("in updateBarChart");

  const metric = d3.select("#metric").node().value;

  // Define axes
  const xAxis = d3.scaleBand()
    .domain(data.map(d => d.date))
    .range([0, CHART_WIDTH])
    .padding(0.2);

  const yAxis = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[metric])])
    .range([CHART_HEIGHT, 0]);

  // Append x-axis
  svgBar.select('.x-axis').remove();
  svgBar.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll('line, path')
    .attr('stroke', 'black');

  // Append y-axis
  svgBar.select('.y-axis').remove();
  svgBar.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yAxis));

  // Draw the bars
  svgBar.selectAll('rect').remove();
  const bars = svgBar.selectAll('rect')
    .data(data);

  bars.enter()
    .append('rect')
    .attr('x', d => xAxis(d.date))
    .attr('y', d => yAxis(d[metric]))
    .attr('width', xAxis.bandwidth())
    .attr('height', d => CHART_HEIGHT - yAxis(d[metric]))
    .attr('fill', 'crimson');

  bars
    .attr('x', d => xAxis(d.date))
    .attr('y', d => yAxis(d[metric]))
    .attr('height', d => CHART_HEIGHT - yAxis(d[metric]));

  bars.exit().remove();
}


/**
 * Update the line chart
 */
function updateLineChart(data) {
  console.log("in updateLineChart");

  const metric = d3.select("#metric").node().value;

  // Define axes
  const xAxis = d3.scalePoint()
    .domain(data.map(d => d.date))
    .range([0, CHART_WIDTH])
    .padding(0);

  const yAxis = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[metric])])
    .range([CHART_HEIGHT, 0]);

  // Append x-axis
  svgLine.select('.x-axis').remove();
  svgLine.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll('line, path')
    .attr('stroke', 'black');

  // Append y-axis
  svgLine.select('.y-axis').remove();
  svgLine.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yAxis));

  // Draw the lines
  svgLine.selectAll('path.line').remove();

  //line generator
  const lineGenerator = d3.line()
    .x(d => xAxis(d.date))
    .y(d => yAxis(d[metric]));

  svgLine.append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('d', lineGenerator)
    .attr('fill', 'none')
    .attr('stroke', 'crimson')
    .attr('stroke-width', 2);
}



/**
 * Update the area chart 
 */
function updateAreaChart (data) {
  console.log("in updateAreaChart");

  const metric = d3.select("#metric").node().value;

  // Define axes
  const xAxis = d3.scalePoint()
    .domain(data.map(d => d.date))
    .range([0, CHART_WIDTH])

  const yAxis = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[metric])])
    .range([CHART_HEIGHT, 0]);

  // Append x-axis
  svgArea.select('.x-axis').remove();
  svgArea.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll('line, path')
    .attr('stroke', 'black');

  // Append y-axis
  svgArea.select('.y-axis').remove();
  svgArea.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yAxis));

  // Draw the area
  svgArea.selectAll('path.area').remove();

  //area generator
  const areaGenerator = d3.area()
    .x(d => xAxis(d.date))
    .y1(d => yAxis(d[metric]))
    .y0(CHART_HEIGHT);

  svgArea.append('path')
    .datum(data)
    .attr('class', 'area')
    .attr('d', areaGenerator)
    .attr('fill', 'crimson');
}

/**
 * update the scatter plot.
 */

function updateScatterPlot (data) {
  console.log("in updateScatterPlot");

  // x-axis for cases
  const xAxis = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.cases)])
    .range([0, CHART_WIDTH]);

  //y-axis for deaths
  const yAxis = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.deaths)])
    .range([CHART_HEIGHT, 0]);

  //Append x-axis
  svgScatter.select('.x-axis').remove();
  svgScatter.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll('line, path')
    .attr('stroke', 'black');

  // Append y-axis
  svgScatter.select('.y-axis').remove();
  svgScatter.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yAxis))
    .selectAll('line, path')
    .attr('stroke', 'black');

  //draw points
  svgArea.selectAll('circle').remove();
  const points = svgScatter.selectAll('circle')
    .data(data);

  points.enter()
    .append('circle')
    .attr('cx', d => xAxis(d.cases))
    .attr('cy', d => yAxis(d.deaths))
    .attr('r', 5)
    .attr('fill', 'crimson');

  points
    .attr('cx', d => xAxis(d.cases))
    .attr('cy', d => yAxis(d.deaths));

  points.exit().remove();

}





































/**
 * Update the data according to document settings
 */
function changeData () {
  console.log("in changeData");
  //  Load the file indicated by the select menu
  const dataFile = d3.select('#dataset').property('value');

  d3.csv(`data/${dataFile}.csv`)
    .then(dataOutput => {
      /**
       * D3 loads all CSV data as strings. While Javascript is pretty smart
       * about interpreting strings as numbers when you do things like
       * multiplication, it will still treat them as strings where it makes
       * sense (e.g. adding strings will concatenate them, not add the values
       * together, or comparing strings will do string comparison, not numeric
       * comparison).
       *
       * We need to explicitly convert values to numbers so that comparisons work
       * when we call d3.max()
       **/
      console.log(dataOutput);
      const dataResult = dataOutput.map((d) => ({
        cases: parseInt(d.cases),
        deaths: parseInt(d.deaths),
        date: d3.timeFormat("%m/%d")(d3.timeParse("%d-%b")(d.date))
      }));
      if (document.getElementById('random').checked) {
        // if random subset is selected
        update(randomSubset(dataResult));
      } else {
        update(dataResult);
      }
    }).catch(e => {
      console.log(e);
      alert('Error!');
    });
}

/**
 *  Slice out a random chunk of the provided in data
 *  @param data
 */
function randomSubset (data) {
  console.log("in randomSubset");
  return data.filter((d) => Math.random() > 0.5);
}
