// Constants for the charts, that would be useful.
const CHART_WIDTH = 450;
const CHART_HEIGHT = 200;
const MARGIN = { left: 250, bottom: 0, top: 100, right: 0 };
const ANIMATION_DUATION = 300;

let svgBar, svgLine, svgArea, svgScatter;
let isDataLoaded = false,
  loadingData = false;
const tooltip = d3.select("#tooltip");

setup();

function setup() {
  console.log("in setup");
  // Fill in some d3 setting up here if you need
  // for example, svg for each chart, g for axis and shapes

  //event listeners
  d3.select("#dataset").on("change", changeData);
  d3.select("#metric").on("change", changeData);
  d3.select("#random").on("change", changeData);

  //svg for bar chart
  svgBar = d3
    .select("#Barchart-div")
    .append("svg")
    .attr("width", CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr("height", CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // Add x-axis label for Bar Chart
  svgBar
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", CHART_WIDTH / 2)
    .attr("y", CHART_HEIGHT + MARGIN.bottom + 50)
    .text("Champion")
    .style("fill", "white");

  // Add y-axis label for Bar Chart
  svgBar
    .append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -CHART_HEIGHT / 2)
    .attr("y", -30)
    .text("Frequency")
    .style("fill", "white");

  //svg for line chart
  svgLine = d3
    .select("#Linechart-div")
    .append("svg")
    .attr("width", CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr("height", CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // Add x-axis label for Line Chart
  svgLine
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", CHART_WIDTH / 2)
    .attr("y", CHART_HEIGHT + MARGIN.bottom + 50)
    .text("Games Ago")
    .style("fill", "white");

  // Add y-axis label for Line Chart
  svgLine
    .append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -CHART_HEIGHT / 2)
    .attr("y", -30)
    .text("Gold per Second")
    .style("fill", "white");

  //svg for scatter plot
  svgScatter = d3
    .select("#Scatterplot-div")
    .append("svg")
    .attr("width", CHART_WIDTH + MARGIN.left + MARGIN.right)
    .attr("height", CHART_HEIGHT + MARGIN.top + MARGIN.bottom)
    .append("g")
    .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

  // Add x-axis label for Scatter Plot
  svgScatter
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", CHART_WIDTH / 2)
    .attr("y", CHART_HEIGHT + MARGIN.bottom + 50)
    .text("Deaths")
    .style("fill", "white");

  // Add y-axis label for Scatter Plot
  svgScatter
    .append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -CHART_HEIGHT / 2)
    .attr("y", -30)
    .text("Kills")
    .style("fill", "white");
}

/**
 * Render the visualizations
 * @param data
 */
function update(data) {
  console.log("in update");

  const selectedMetric = d3.select("#metric").node().value;
  console.log(selectedMetric);
  updateBarChart(data);
  updateLineChart(data);
  updateScatterPlot(data);
}

/**
 * Update the bar chart
 */
function updateBarChart(data) {
  if (!data || data.singleMatchData.length === 0) return;
  console.log("in updateBarChart");

  const tooltip = d3.select("#tooltip");

  // Extract puuidData and prepare champion frequency map
  const puuidData = data.puuidData;
  const championCounts = {};

  // Iterate over each match to collect champion counts
  data.singleMatchData.forEach((match) => {
    const playerData = match.info.participants.find((participant) => participant.puuid === puuidData);

    if (playerData) {
      const championName = playerData.championName;
      championCounts[championName] = (championCounts[championName] || 0) + 1;
    }
  });

  // Transform championCounts object into an array for D3 processing
  const championData = Object.entries(championCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Define axes
  const xAxis = d3
    .scaleBand()
    .domain(championData.map((d) => d.name))
    .range([0, CHART_WIDTH])
    .padding(0.2);

  const yAxis = d3
    .scaleLinear()
    .domain([0, d3.max(championData, (d) => d.count)])
    .range([CHART_HEIGHT, 0]);

  // Append x-axis
  svgBar.select(".x-axis").remove();
  svgBar
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll("line, path")
    .attr("stroke", "white");

  // Append y-axis
  svgBar.select(".y-axis").remove();
  svgBar.append("g").attr("class", "y-axis").call(d3.axisLeft(yAxis));

  // Draw the bars
  svgBar.selectAll("rect").remove();
  const bars = svgBar.selectAll("rect").data(championData);

  bars
    .enter()
    .append("rect")
    .attr("x", (d) => xAxis(d.name))
    .attr("y", (d) => yAxis(d.count))
    .attr("width", xAxis.bandwidth())
    .attr("height", (d) => CHART_HEIGHT - yAxis(d.count))
    .attr("fill", "steelblue")

    //Chat GPT aided
    .on("mouseover", function (event, d) {
      // Find the participant data for the hovered champion
      const playerData = data.singleMatchData
        .find((match) =>
          match.info.participants.some(
            (participant) => participant.championName === d.name && participant.puuid === puuidData
          )
        )
        ?.info.participants.find((participant) => participant.championName === d.name);

      // Get lane and role information
      const lane = playerData ? playerData.lane : "Unknown lane";
      const role = playerData ? playerData.role : "Unknown role";

      // Set tooltip content
      tooltip
        .style("display", "block") // Show the tooltip
        .html(`Champion: ${d.name}<br>Lane: ${lane}<br>Role: ${role}`) // Set the content
        .style("left", event.pageX + 5 + "px") // Position tooltip next to the cursor
        .style("top", event.pageY - 28 + "px") // Position above the cursor
        .style("border-radius", "6px")
        .style("padding", "5px")
        .style("background-color", "#2f2f2f");

      d3.select(this).attr("fill", function () {
        const color = d3.color(d3.select(this).attr("fill")).brighter(1);
        return color;
      });
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 5 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none"); // Hide the tooltip on mouse out
      d3.select(this).attr("fill", "steelblue");
    });

  bars.exit().remove();
}

/**
 * Update the line chart
 */
function updateLineChart(data) {
  if (!data || data.singleMatchData.length === 0) return;
  console.log("in updateLineChart");

  const puuidData = data.puuidData;

  // Collect gold/sec data for each game
  const lineData = data.singleMatchData
    .map((match, index) => {
      const playerData = match.info.participants.find((participant) => participant.puuid === puuidData);

      return playerData
        ? {
            gamesAgo: data.singleMatchData.length - index, // index + 1 games ago, reversed
            goldPerSecond: playerData.goldEarned / playerData.timePlayed,
          }
        : null;
    })
    .filter(Boolean); // Remove any null entries in case the player wasn't found

  // Define x-axis as 'games ago'
  const xAxis = d3
    .scalePoint()
    .domain(lineData.map((d) => d.gamesAgo))
    .range([0, CHART_WIDTH])
    .padding(0);

  // Define y-axis as 'gold per second'
  const yAxis = d3
    .scaleLinear()
    .domain([0, d3.max(lineData, (d) => d.goldPerSecond)])
    .range([CHART_HEIGHT, 0]);

  // Append x-axis
  svgLine.select(".x-axis").remove();
  svgLine
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll("line, path")
    .attr("stroke", "white");

  // Append y-axis
  svgLine.select(".y-axis").remove();
  svgLine.append("g").attr("class", "y-axis").call(d3.axisLeft(yAxis));

  // Draw the line
  svgLine.selectAll("path.line").remove();

  // Line generator
  const lineGenerator = d3
    .line()
    .x((d) => xAxis(d.gamesAgo))
    .y((d) => yAxis(d.goldPerSecond));

  svgLine
    .append("path")
    .datum(lineData)
    .attr("class", "line")
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", "gold")
    .attr("stroke-width", 5);

  // Create circles for each point on the line
  svgLine.selectAll("circle").remove();
  const points = svgLine.selectAll("circle").data(lineData);

  points
    .enter()
    .append("circle")
    .attr("cx", (d) => xAxis(d.gamesAgo))
    .attr("cy", (d) => yAxis(d.goldPerSecond))
    .attr("r", 7)
    .attr("fill", "gold")

    //Chat GPT aided
    .on("mouseover", function (event, d) {
      // Show the tooltip with y-value (gold per second)
      console.log("d", d);
      tooltip
        .style("display", "block")
        .html(`Gold/sec: ${d.goldPerSecond.toFixed(2)}`) // Display the gold per second
        .style("left", event.pageX + 5 + "px") // Position tooltip next to the cursor
        .style("top", event.pageY - 28 + "px"); // Position above the cursor
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 5 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");

      d3.select(this).attr("fill", function () {
        const color = d3.color(d3.select(this).attr("fill")).brighter(1);
        return color;
      });
    })
    .on("mouseout", function () {
      tooltip.style("display", "none"); // Hide the tooltip on mouse out
      d3.select(this).attr("fill", "gold");
    });

  points.exit().remove();
}

/**
 * update the scatter plot.
 */

function updateScatterPlot(data) {
  if (!data || data.singleMatchData.length === 0) return;
  console.log("in updateScatterPlot");

  const puuidData = data.puuidData;

  // Collect deaths and kills data for each game
  const scatterData = data.singleMatchData
    .map((match) => {
      const playerData = match.info.participants.find((participant) => participant.puuid === puuidData);

      return playerData
        ? {
            deaths: playerData.deaths,
            kills: playerData.kills,
          }
        : null;
    })
    .filter(Boolean); // Remove null entries if player wasn't found

  // Define x-axis for deaths
  const xAxis = d3
    .scaleLinear()
    .domain([0, d3.max(scatterData, (d) => d.deaths)])
    .range([0, CHART_WIDTH]);

  // Define y-axis for kills
  const yAxis = d3
    .scaleLinear()
    .domain([0, d3.max(scatterData, (d) => d.kills)])
    .range([CHART_HEIGHT, 0]);

  // Append x-axis
  svgScatter.select(".x-axis").remove();
  svgScatter
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll("line, path")
    .attr("stroke", "white");

  // Append y-axis
  svgScatter.select(".y-axis").remove();
  svgScatter
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yAxis))
    .selectAll("line, path")
    .attr("stroke", "white");

  // Create the tooltip
  const tooltip = d3.select("#tooltip"); // Ensure this is defined

  // Draw points
  svgScatter.selectAll("circle").remove();
  const points = svgScatter.selectAll("circle").data(scatterData);

  points
    .enter()
    .append("circle")
    .attr("cx", (d) => xAxis(d.deaths))
    .attr("cy", (d) => yAxis(d.kills))
    .attr("r", 7)
    .attr("fill", "crimson")

    //Chat GPT aided
    .on("mouseover", function (event, d) {
      // Show the tooltip with kills and deaths
      tooltip
        .style("display", "block")
        .html(`Kills: ${d.kills}<br>Deaths: ${d.deaths}`) // Set the content
        .style("left", event.pageX + 5 + "px") // Position tooltip next to the cursor
        .style("top", event.pageY - 28 + "px"); // Position above the cursor

      // Change the color of the dot to lighter
      d3.select(this).attr("fill", function () {
        const color = d3.color(d3.select(this).attr("fill")).brighter(1);
        return color;
      });
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 5 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none"); // Hide the tooltip on mouse out

      // Change the color of the dot back to crimson
      d3.select(this).attr("fill", "crimson");
    });

  points.attr("cx", (d) => xAxis(d.deaths)).attr("cy", (d) => yAxis(d.kills));

  points.exit().remove();
}

/**
 * Toggle the chart section based on data loaded status
 *
 */
function toggleChartSection() {
  const chartSection = document.querySelector(".chart.section");
  if (isDataLoaded) {
    chartSection.style.display = "block";
  } else {
    chartSection.style.display = "none";
  }
}

function toggleLoading() {
  const loading = document.querySelector(".loading.icon");
  if (loadingData) {
    loading.style.display = "block";
  } else {
    loading.style.display = "none";
  }
}
/**
 * Update the data according to document settings
 */
function changeData() {
  console.log("in changeData");
  //  Load the file indicated by the select menu
  const dataFile = d3.select("#dataset").property("value");

  d3.csv(`data/${dataFile}.csv`)
    .then((dataOutput) => {
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
      console.log("data output", dataOutput);
      const dataResult = dataOutput.map((d) => ({
        cases: parseInt(d.cases),
        deaths: parseInt(d.deaths),
        date: d3.timeFormat("%m/%d")(d3.timeParse("%d-%b")(d.date)),
      }));
      if (document.getElementById("random").checked) {
        // if random subset is selected
        update(randomSubset(dataResult));
      } else {
        update(dataResult);
      }
    })
    .catch((e) => {
      console.log(e);
      alert("Error!");
    });
}

////// Riot API Proxy Code //////

document.getElementById("riotForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  loadingData = true;
  toggleLoading();

  const summonerName = document.getElementById("summonerName").value;
  const tagLine = document.getElementById("tagLine").value;

  try {
    const response = await fetch(`/riot-api/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Network response was not ok: ${errorText}`);
    }
    const data = await response.json();

    isDataLoaded = true;
    loadingData = false;
    toggleLoading();
    toggleChartSection();
    displayData(data);
  } catch (error) {
    document.getElementById("result").innerText = `Error: ${error.message}`;
    loadingData = false;
    toggleLoading();
  }
});

function displayData(data) {
  console.log("display data", data);
  // Call each update function with the API data as needed
  updateBarChart(data);
  updateLineChart(data);
  updateScatterPlot(data);
}
