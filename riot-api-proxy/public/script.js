// Constants for the charts, that would be useful.
const CHART_WIDTH = 450;
const CHART_HEIGHT = 200;
const MARGIN = { left: 250, bottom: 0, top: 100, right: 0 };
const ANIMATION_DUATION = 300;

let svgBar, svgLine, svgArea, svgScatter, svgHeatmap, svgDualBar;
let isDataLoaded = false,
  loadingData = false;
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("font-size", 10)
  .style("position", "absolute")
  .style("background-color", "#000000")
  .style("color", "white")
  .style("padding", "10px")
  .style("border", "1px solid #aac8e4")
  .style("border-radius", "5px")
  .style("pointer-events", "none")
  .style("opacity", 0);

const matches = [];
let selectedMatch = null;

let globalData = null;
let matchIdMap = new Map();

setup();

function setup() {
  // Fill in some d3 setting up here if you need
  // for example, svg for each chart, g for axis and shapes

  //event listeners
  d3.select("#matchSelect").on("change", changeSelectedMatch);
  document.addEventListener("DOMContentLoaded", fillMatchDropdown);

  //svg for bar chart
  svgBar = d3
    .select("#Barchart-div")
    .append("svg")
    .append("g")
    .attr("transform", `translate(${MARGIN.left - 200}, ${10})`);

  // Add x-axis label for Bar Chart
  svgBar
    .append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", CHART_WIDTH / 2)
    .attr("y", CHART_HEIGHT + MARGIN.bottom + 60)
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
    .append("g")
    .attr("transform", `translate(${MARGIN.left - 200}, ${10})`);

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
    .append("g")
    .attr("transform", `translate(${MARGIN.left - 200}, ${10})`);

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

  // svg for calendar heatmap
  svgHeatmap = d3
    .select("#CalendarHeatmap-div")
    .append("svg")
    .attr("width", 120)
    .append("g")
    .attr("transform", `translate(100, -15)`);

  svgDualBar = d3
    .select("#DualBarChart-div")
    .append("svg")
    .attr("width", CHART_WIDTH + MARGIN.left + MARGIN.right - 30)
    .attr("height", CHART_HEIGHT + MARGIN.top + MARGIN.bottom - 2000)
    .append("g") // Add a group to handle transformations
    .attr("transform", `translate(${50}, ${MARGIN.top - 50})`);
}

/**
 * Render the visualizations
 * @param data
 */
function update(data) {
  const selectedMetric = d3.select("#metric").node().value;
  updateBarChart(data);
  updateLineChart(data);
  updateScatterPlot(data);
  updateHeatmap(data);
  updateDualBarChart(data);
}

/**
 * Update the bar chart
 */
function updateBarChart(data) {
  //Chat GPT aided

  if (!data || data.singleMatchData.length === 0) return;

  const puuidData = data.puuidData;
  const championCounts = {};

  // Create an object to track wins and losses for each champion
  data.singleMatchData.forEach((match) => {
    const playerData = match.info.participants.find((participant) => participant.puuid === puuidData);

    if (playerData) {
      const championName = playerData.championName;
      if (!championCounts[championName]) {
        championCounts[championName] = { wins: 0, losses: 0 };
      }
      if (playerData.win) {
        championCounts[championName].wins += 1;
      } else {
        championCounts[championName].losses += 1;
      }
    }
  });

  // Transform championCounts into an array
  const championData = Object.entries(championCounts).map(([name, counts]) => ({
    name,
    wins: counts.wins,
    losses: counts.losses,
  }));

  const xAxis = d3
    .scaleBand()
    .domain(championData.map((d) => d.name))
    .range([0, CHART_WIDTH])
    .padding(0.2);

  const yAxis = d3
    .scaleLinear()
    .domain([0, d3.max(championData, (d) => d.wins + d.losses)]) // Scale based on total games
    .range([CHART_HEIGHT, 0]);

  svgBar.select(".x-axis").remove();
  svgBar
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xAxis))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .selectAll("line, path")
    .attr("stroke", "white");

  svgBar.select(".y-axis").remove();
  svgBar.append("g").attr("class", "y-axis").call(d3.axisLeft(yAxis));

  svgBar.selectAll("g.bar-group").remove();
  const bars = svgBar
    .selectAll("g.bar-group")
    .data(championData)
    .enter()
    .append("g")
    .attr("class", "bar-group")
    .attr("transform", (d) => `translate(${xAxis(d.name)}, 0)`);

  // Append losses bars
  bars
    .append("rect")
    .attr("class", "loss-bar")
    .attr("x", 0)
    .attr("y", (d) => yAxis(d.losses))
    .attr("width", xAxis.bandwidth())
    .attr("height", (d) => CHART_HEIGHT - yAxis(d.losses))
    .attr("fill", "#e54787")
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // Append wins bars on top of losses
  bars
    .append("rect")
    .attr("class", "win-bar")
    .attr("x", 0)
    .attr("y", (d) => yAxis(d.losses + d.wins))
    .attr("width", xAxis.bandwidth())
    .attr("height", (d) => CHART_HEIGHT - yAxis(d.wins))
    .attr("fill", "#85d0ff")
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // Add tooltip functionality to both sections
  bars
    .on("mouseover", function (event, d) {
      const playerData = data.singleMatchData
        .find((match) =>
          match.info.participants.some(
            (participant) => participant.championName === d.name && participant.puuid === puuidData
          )
        )
        ?.info.participants.find((participant) => participant.championName === d.name);

      const lane = playerData ? playerData.lane : "Unknown lane";
      const role = playerData ? playerData.role : "Unknown role";
      // Hover effect
      d3.select(this).classed("scaled", true);
      tooltip.transition().duration(50).style("opacity", 1);
      tooltip
        .html(() => {
          return `${d.name}<br>Lane: ${lane}<br>Role: ${role}<br>Record: ${d.wins} - ${d.losses}`;
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("background-color", "rgba(0, 0, 0, 0.8)");

      // d3.select(this).attr("fill", function () {
      //   const color = d3.color(d3.select(this).attr("fill")).brighter(1);
      //   return color;
      // });
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      // End hover effect
      d3.select(this).classed("scaled", false);
      tooltip.transition().duration(200).style("opacity", 0);
    });
}

/**
 * Update the line chart
 */
function updateLineChart(data) {
  if (!data || data.singleMatchData.length === 0) return;

  const puuidData = data.puuidData;

  // Collect gold/sec data for each game
  const lineData = data.singleMatchData
    .map((match, index) => {
      const playerData = match.info.participants.find((participant) => participant.puuid === puuidData);

      return playerData
        ? {
            gamesAgo: data.singleMatchData.length - index, // index + 1 games ago, reversed
            goldPerSecond: playerData.goldEarned / playerData.timePlayed,
            win: playerData.win,
            gameId: data.singleMatchData[index].info.gameId,
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
    // .selectAll("text")
    // .attr("transform", "rotate(-45)")
    // .style("text-anchor", "end")
    //only show odd numbers

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
    .attr("stroke", "white")
    .attr("stroke-width", 2);

  // Create circles for each point on the line
  svgLine.selectAll("circle").remove();
  const points = svgLine.selectAll("circle").data(lineData);
  const radius = 7;

  points
    .enter()
    .append("circle")
    .attr("cx", (d) => xAxis(d.gamesAgo))
    .attr("cy", (d) => yAxis(d.goldPerSecond))
    .attr("r", radius)
    .attr("fill", function (data) {
      if (data.gameId === selectedMatch) {
        return "gold";
      } else {
        return data.win ? "#85d0ff" : "#e54787";
      }
    })

    //Chat GPT aided
    .on("mouseover", function (event, d) {
      // Show the tooltip with y-value (gold per second)
      d3.select(this).classed("scaled", true);
      tooltip.transition().duration(50).style("opacity", 1);
      tooltip
        .html(() => {
          return `Gold/sec: ${d.goldPerSecond.toFixed(2)}`;
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("background-color", "rgba(0, 0, 0, 0.8)");

      const color = d3.color(d3.select(this).attr("fill"));

      // Add a floating border circle
      d3.select(this.parentNode)
        .append("circle")
        .attr("class", "floating-border")
        .attr("cx", d3.select(this).attr("cx"))
        .attr("cy", d3.select(this).attr("cy"))
        .attr("r", radius)
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .style("opacity", 0)
        .transition()
        .duration(100)
        .attr("r", radius + 2)
        .style("opacity", 1);

      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", radius - 0.5);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      // End hover effect
      d3.select(this).classed("scaled", false);
      tooltip.transition().duration(200).style("opacity", 0);

      // Remove the floating border circle with transition
      d3.select(this.parentNode)
        .selectAll(".floating-border")
        .transition()
        .duration(300)
        .attr("r", radius)
        .style("opacity", 0)
        .remove();

      // Reset the size of the inner circle with transition
      d3.select(this)
        .transition()
        .duration(300)
        .attr("r", radius + 0.5);

      d3.select(this).attr("fill", function (data) {
        if (data.gameId === selectedMatch) {
          return "gold";
        } else {
          return data.win ? "#85d0ff" : "#e54787";
        }
      });
    });

  points.exit().remove();
}

/**
 * update the scatter plot.
 */

function updateScatterPlot(data) {
  if (!data || data.singleMatchData.length === 0) return;

  const puuidData = data.puuidData;

  // Collect deaths and kills data for each game
  const scatterData = data.singleMatchData
    .map((match) => {
      const playerData = match.info.participants.find((participant) => participant.puuid === puuidData);

      return playerData
        ? {
            deaths: playerData.deaths,
            kills: playerData.kills,
            win: playerData.win,
            gameId: match.info.gameId,
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

  // Draw points
  svgScatter.selectAll("circle").remove();
  const points = svgScatter.selectAll("circle").data(scatterData);
  const radius = 7;

  points
    .enter()
    .append("circle")
    .attr("cx", (d) => xAxis(d.deaths))
    .attr("cy", (d) => yAxis(d.kills))
    .attr("r", radius)
    .attr("fill", function (data) {
      if (data.gameId === selectedMatch) {
        return "gold";
      } else {
        return data.win ? "#85d0ff" : "#e54787";
      }
    })

    .on("mouseover", function (event, d) {
      // Hover effect
      d3.select(this).classed("scaled", true);
      tooltip.transition().duration(50).style("opacity", 1);
      tooltip
        .html(() => {
          return `Kills: ${d.kills}<br>Deaths: ${d.deaths}<br>Win: ${d.win}`;
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("background-color", "rgba(0, 0, 0, 0.8)");
      const color = d3.color(d3.select(this).attr("fill"));

      // Add a floating border circle
      d3.select(this.parentNode)
        .append("circle")
        .attr("class", "floating-border")
        .attr("cx", d3.select(this).attr("cx"))
        .attr("cy", d3.select(this).attr("cy"))
        .attr("r", radius)
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .style("opacity", 0)
        .transition()
        .duration(100)
        .attr("r", radius + 2)
        .style("opacity", 1);

      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", radius - 0.5);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      // End hover effect
      d3.select(this).classed("scaled", false);
      tooltip.transition().duration(200).style("opacity", 0);

      // Remove the floating border circle with transition
      d3.select(this.parentNode)
        .selectAll(".floating-border")
        .transition()
        .duration(300)
        .attr("r", radius)
        .style("opacity", 0)
        .remove();

      // Reset the size of the inner circle with transition
      d3.select(this)
        .transition()
        .duration(300)
        .attr("r", radius + 0.5);

      // Change the color of the dot back
      d3.select(this).attr("fill", function (data) {
        if (data.gameId === selectedMatch) {
          return "gold";
        } else {
          return data.win ? "#85d0ff" : "#e54787";
        }
      });
    });

  points.attr("cx", (d) => xAxis(d.deaths)).attr("cy", (d) => yAxis(d.kills));

  points.exit().remove();
}

/**
 * update the calendar heatmap.
 */
function updateHeatmap(data) {
  if (!data || data.singleMatchData.length === 0) return;
  const heatmapData = d3
    .rollups(
      data.singleMatchData,
      (matches) => {
        const wins = matches.filter(
          (match) => match.info.participants.find((participant) => participant.puuid === data.puuidData).win
        ).length;
        const losses = matches.length - wins;
        return { wins, losses };
      },
      (match) => new Date(match.info.gameCreation).toDateString()
    )
    .map(([date, { wins, losses }]) => ({
      Date: new Date(date).toISOString().split("T")[0], // Format date as YYYY-MM-DD
      wins: wins.toString(),
      losses: losses.toString(),
    }));

  // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
  sample = heatmapData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

  const dateValues = sample.map((dv) => ({
    date: d3.timeDay(new Date(dv.Date)),
    wins: Number(dv.wins),
    losses: Number(dv.losses),
  }));

  const svg = svgHeatmap;

  function draw() {
    const years = Array.from(
      d3.group(dateValues, (d) => d.date.getUTCFullYear()),
      ([key, values]) => ({ key, values })
    ).reverse();

    const cellSize = 22;
    const yearHeight = cellSize * 7;

    const group = svg.append("g");

    const year = group
      .selectAll("g")
      .data(years)
      .join("g")
      .attr("transform", (d, i) => `translate(50, ${yearHeight * i + cellSize * 1.5})`);

    const formatDay = (d) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d.getUTCDay()];
    const countDay = (d) => d.getUTCDay();
    const timeWeek = d3.utcSunday;
    const formatDate = d3.utcFormat("%x");
    const colorFn = d3
      .scaleThreshold()
      .domain([0.49, 0.51, 0.75]) // Define thresholds for the categories
      .range(["#e54787", "white", "#1dc49b", "#85d0ff"]); // Define colors for the categories

    const format = (value) => {
      const formattedValue = d3.format(".1%")(value);
      return formattedValue.replace(/\.0+%$/, "%");
    };

    year
      .append("g")
      .attr("text-anchor", "end")
      .selectAll("text")
      .data(d3.range(7).map((i) => new Date(1995, 0, i)))
      .join("text")
      .attr("x", -5)
      .attr("y", (d) => (countDay(d) + 0.5) * cellSize)
      .attr("dy", "0.31em")
      .attr("font-size", 12)
      .style("fill", "white")
      .text(formatDay);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Generate a complete list of dates within the range
    const allDates = [];
    for (let d = new Date(twoMonthsAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d));
    }

    // Merge the complete list of dates with existing data
    const completeData = allDates.map((date) => {
      const existingData = dateValues.find((d) => d3.timeDay(d.date).getTime() === d3.timeDay(date).getTime());
      return existingData ? existingData : { date, wins: null, losses: null };
    });

    const formatMonth = d3.timeFormat("%b"); // Format for abbreviated month name

    // Get the unique months from the data
    const uniqueMonths = Array.from(new Set(completeData.map((d) => d.date.getMonth()))).sort((a, b) => a - b);

    year
      .append("g")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(uniqueMonths.map((month) => new Date(1995, month, 1))) // Use unique months as data
      .join("text")
      .attr("x", (d, i) => (i + 0.5) * cellSize * 4) // Position the text elements horizontally
      .attr("y", -10) // Position the text elements on top
      .attr("dy", "0.31em")
      .attr("font-size", 12)
      .style("fill", "white")
      .text(formatMonth);

    year
      .append("g")
      .selectAll("rect")
      .data((d) => completeData)
      .join("rect")
      .attr("width", cellSize - 3)
      .attr("height", cellSize - 3)
      .attr("x", (d, i) => timeWeek.count(twoMonthsAgo, d.date) * cellSize + 10)
      .attr("y", (d) => countDay(d.date) * cellSize + 0.5)
      .attr("fill", (d) => (d.wins != null ? colorFn(d.wins / (d.wins + d.losses)) : "#333333"))
      .attr("stroke", (d) => (d.wins != null ? colorFn(d.wins / (d.wins + d.losses)) : "#333333"))
      .attr("stroke-width", "0px")
      .attr("opacity", (d) => {
        const totalGames = d.wins + d.losses;
        if (totalGames >= 7) {
          return 1; // Highest opacity
        } else if (totalGames >= 5) {
          return 0.8;
        } else if (totalGames >= 3) {
          return 0.6;
        } else if (totalGames > 0) {
          return 0.4;
        } else {
          return 1; // Lowest opacity for no games
        }
      })
      .attr("rx", 2) // Rounded Corners
      .attr("ry", 2)
      .on("mouseover", function (event, d) {
        // Hover effect
        if (d.wins + d.losses === 0) return;
        d3.select(this).classed("scaled", true);
        tooltip.transition().duration(50).style("opacity", 1);
        tooltip
          .html(() => {
            const winRate = d.wins / (d.wins + d.losses);
            return `Date: ${formatDate(d.date)}<br>Win Rate: ${format(winRate)}<br>Record: ${d.wins} - ${d.losses}`;
          })
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
          .style("background-color", "rgba(0, 0, 0, 0.8)");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px") // Update position on move
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        // End hover effect
        d3.select(this).classed("scaled", false);
        tooltip.transition().duration(200).style("opacity", 0);
      });

    const legend = group.append("g").attr("transform", `translate(10, ${years.length * yearHeight + cellSize * 4})`);

    // Set the bottom legend and on click toggles
    const names = ["bad day", "", "", "good day"];
    const bounds = [0, 49, 51, 75];
    const boundMaxes = [49, 51, 75, 100];
    const categoriesCount = 4;
    const categories = [...Array(categoriesCount)].map((_, i) => {
      const name = names[i];
      const bound = bounds[i];
      const boundMax = boundMaxes[i];

      return {
        name,
        bound,
        boundMax,
        color: colorFn(bound / 100),
        selected: true,
      };
    });

    const legendWidth = 50;
    const legendMargin = 5;

    function toggle(legend) {
      const { bound, boundMax, selected } = legend.srcElement.__data__;

      legend.srcElement.__data__.selected = !selected;

      d3.select(legend.srcElement)
        .transition()
        .duration(200)
        .style("fill-opacity", legend.srcElement.__data__.selected ? 1 : 0.6);

      const highlightedDates = years.map((y) => {
        const filteredValues = y.values.filter((v) => {
          const winRate = v.wins / (v.wins + v.losses);
          const isInBound = winRate > bound / 100 && winRate <= boundMax / 100;
          return isInBound;
        });
        return {
          key: y.key,
          values: filteredValues,
        };
      });

      year
        .data(highlightedDates)
        .selectAll("rect")
        .data(
          (d) => d.values,
          (d) => d.date
        )
        .transition()
        .duration(400)
        .attr("fill", (d) => (legend.srcElement.__data__.selected ? colorFn(d.wins / (d.wins + d.losses)) : "grey"));
    }

    legend
      .selectAll("rect")
      .data(categories)
      .enter()
      .append("rect")
      .attr("fill", (d) => d.color)
      .attr("x", (d, i) => i * (legendWidth + legendMargin)) // Adjust x position to include margin
      .attr("width", legendWidth)
      .attr("height", 15)
      .attr("rx", 2) // Set x-axis radius for rounded corners
      .attr("ry", 2) // Set y-axis radius for rounded corners;
      .on("click", toggle);

    legend
      .selectAll("text")
      .data(categories)
      .join("text")
      .attr("x", (d, i) => i * (legendWidth + legendMargin))
      .attr("y", 30) // Set a constant y position
      .attr("text-anchor", "start")
      .attr("font-size", 11)
      .style("fill", "white")
      .text((d) => `${d.name}`);

    legend
      .append("text")
      .attr("dy", -5)
      .attr("font-size", 14)
      .style("fill", "white")
      .attr("text-decoration", "underline")
      .text("Click on category to select/deselect days");
  }

  draw();
}

function updateDualBarChart(data) {
  let dataSelf, dataOpponent;

  //averages data
  if (selectedMatch == null) {
    // Calculate averages
    const puuid = data.puuidData;

    playerTotals = new Map();
    opponentTotals = new Map();

    for (let i = 0; i < data.singleMatchData.length; i++) {
      //get player data
      const match = data.singleMatchData[i];
      const playerData = match.info.participants.find((participant) => participant.puuid === puuid);

      //find opponent w/ matching lane
      const opponentData = match.info.participants.find(
        (participant) => participant.individualPosition === playerData.individualPosition && participant.puuid !== puuid
      );

      //add player data
      for (let [key, value] of Object.entries(playerData)) {
        if (playerTotals.has(key)) {
          playerTotals.set(key, playerTotals.get(key) + value);
        } else {
          playerTotals.set(key, value);
        }
      }

      //add opponent data
      for (let [key, value] of Object.entries(opponentData)) {
        if (opponentTotals.has(key)) {
          opponentTotals.set(key, opponentTotals.get(key) + value);
        } else {
          opponentTotals.set(key, value);
        }
      }
    }

    //calculate averages
    for (let [key, value] of playerTotals) {
      playerTotals.set(key, value / data.singleMatchData.length);
    }

    for (let [key, value] of opponentTotals) {
      opponentTotals.set(key, value / data.singleMatchData.length);
    }

    dataSelf = [
      { label: "Kills", value: playerTotals.get("kills") },
      { label: "Assists", value: playerTotals.get("assists") },
      { label: "Deaths", value: playerTotals.get("deaths") },
      { label: "Damage Taken", value: playerTotals.get("totalDamageTaken") },
      { label: "Total Damage", value: playerTotals.get("totalDamageDealt") },
      { label: "Gold Earned", value: playerTotals.get("goldEarned") },
      { label: "Minion Kills", value: playerTotals.get("totalMinionsKilled") },
      { label: "Time Dead", value: playerTotals.get("totalTimeSpentDead") },
    ];

    dataOpponent = [
      { label: "Kills", value: opponentTotals.get("kills") },
      { label: "Assists", value: opponentTotals.get("assists") },
      { label: "Deaths", value: opponentTotals.get("deaths") },
      { label: "Damage Taken", value: opponentTotals.get("totalDamageTaken") },
      { label: "Total Damage", value: opponentTotals.get("totalDamageDealt") },
      { label: "Gold Earned", value: opponentTotals.get("goldEarned") },
      { label: "Minion Kills", value: opponentTotals.get("totalMinionsKilled") },
      { label: "Time Dead", value: opponentTotals.get("totalTimeSpentDead") },
    ];
  }
  //specific match data
  else {
    const match = data.singleMatchData.find((match) => match.info.gameId === selectedMatch);
    const puuid = data.puuidData;
    const playerData = match.info.participants.find((participant) => participant.puuid === puuid);
    dataSelf = [
      { label: "Kills", value: playerData.kills },
      { label: "Assists", value: playerData.assists },
      { label: "Deaths", value: playerData.deaths },
      { label: "Damage Taken", value: playerData.totalDamageTaken },
      { label: "Total Damage", value: playerData.totalDamageDealt },
      { label: "Gold Earned", value: playerData.goldEarned },
      { label: "Minion Kills", value: playerData.totalMinionsKilled },
      { label: "Time Dead", value: playerData.totalTimeSpentDead },
    ];

    //find opponent
    const opponentData = match.info.participants.find(
      (participant) => participant.individualPosition === playerData.individualPosition && participant.puuid !== puuid
    );
    dataOpponent = [
      { label: "Kills", value: opponentData.kills },
      { label: "Assists", value: opponentData.assists },
      { label: "Deaths", value: opponentData.deaths },
      { label: "Damage Taken", value: opponentData.totalDamageTaken },
      { label: "Total Damage", value: opponentData.totalDamageDealt },
      { label: "Gold Earned", value: opponentData.goldEarned },
      { label: "Minion Kills", value: opponentData.totalMinionsKilled },
      { label: "Time Dead", value: opponentData.totalTimeSpentDead },
    ];
  }

  //selected match data
  let dataExample = [
    { label: "Kills", value: 50 },
    { label: "Deaths", value: 30 },
    { label: "Assists", value: 70 },
    { label: "Damage", value: 90 },
    { label: "Healing", value: 20 },
    { label: "Gold", value: 60 },
    { label: "Vision", value: 40 },
    { label: "Objectives", value: 80 },
  ];

  //chat gpt aided in generation, improvements by us

  // Ensure both datasets are compatible
  if (dataSelf.length !== dataOpponent.length || !dataSelf.every((d, i) => d.label === dataOpponent[i].label)) {
    console.error("Data arrays are not compatible.");
    return;
  }

  // Calculate percentages
  const map = dataSelf.map((d1, i) => {
    const d2 = dataOpponent[i];
    const total = d1.value + d2.value;
    return {
      label: d1.label,
      top: (d2.value / total) * 100, // Orange bar (top)
      bottom: (d1.value / total) * 100, // Blue bar (bottom)
      selfValue: d1.value,
      opponentValue: d2.value,
    };
  });

  // Clear existing chart elements
  svgDualBar.selectAll("*").remove();

  // Add a group element for the chart
  const chartGroup = svgDualBar;

  // Define scales, axes, and chart elements
  const xScale = d3
    .scaleBand()
    .domain(map.map((d) => d.label))
    .range([0, CHART_WIDTH])
    .padding(0.2);

  const yScale = d3.scaleLinear().domain([0, 100]).range([CHART_HEIGHT, 0]);

  // Add top x-axis
  chartGroup
    .append("g")
    .attr("transform", `translate(0, -1)`) // -1 due to borders
    .call(d3.axisTop(xScale).tickSize(0))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "start")
    .style("fill", "white");

  // Add bottom x-axis
  chartGroup
    .append("g")
    .attr("transform", `translate(0, ${CHART_HEIGHT})`)
    .call(d3.axisBottom(xScale).tickSize(0))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end")
    .style("fill", "white");

  // Render the blue bars (bottom)
  chartGroup
    .selectAll(".bar-bottom")
    .data(map)
    .enter()
    .append("rect")
    .attr("class", "bar-bottom")
    .attr("x", (d) => xScale(d.label))
    .attr("y", (d) => yScale(d.bottom))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(0) - yScale(d.bottom))
    .attr("fill", "#85d0ff")
    .attr("opacity", 0.8)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.9);

  // Render the orange bars (top)
  chartGroup
    .selectAll(".bar-top")
    .data(map)
    .enter()
    .append("rect")
    .attr("class", "bar-top")
    .attr("x", (d) => xScale(d.label))
    .attr("y", 0) // Start from the top axis
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(0) - yScale(d.top))
    .attr("fill", "#e54787")
    .attr("opacity", 0.8)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0.9);

  // Add dashed line at 50%
  chartGroup
    .append("line")
    .attr("x1", 0)
    .attr("x2", CHART_WIDTH)
    .attr("y1", yScale(50))
    .attr("y2", yScale(50))
    .attr("stroke", "white")
    .attr("stroke-dasharray", "4");

  chartGroup
    .selectAll("rect")
    .on("mouseover", function (event, d) {
      // Hover effect
      if (d.wins + d.losses === 0) return;
      d3.select(this).classed("scaled", true);
      tooltip.transition().duration(50).style("opacity", 1);
      tooltip
        .html(() => {
          if (selectedMatch == null) {
            return `Your Average: ${d.selfValue.toFixed(2)}<br>Opponent's Average: ${d.opponentValue.toFixed(2)}`;
          } else {
            return `You: ${d.selfValue}<br>Opponent: ${d.opponentValue}`;
          }
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("background-color", "rgba(0, 0, 0, 0.8)");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px") // Update position on move
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      // End hover effect
      d3.select(this).classed("scaled", false);
      tooltip.transition().duration(200).style("opacity", 0);
    });

  console.log("updateDualBarChart out");
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
 * Update the data
 */
function changeSelectedMatch() {
  let value = document.getElementById("matchSelect").value;

  //replace - with space
  value = value.replace(/-/g, " ");
  //lookup match id
  selectedMatch = matchIdMap.get(value);

  console.log("selectedMatch", selectedMatch);

  updateBarChart(globalData);
  updateLineChart(globalData);
  updateScatterPlot(globalData);
  // updateHeatmap(globalData);
  updateDualBarChart(globalData);
}

////// Riot API Proxy Code //////

document.getElementById("riotForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  loadingData = true;
  toggleLoading();

  const summonerName = document.getElementById("summonerName").value;
  const tagLine = document.getElementById("tagLine").value;
  const matchCount = document.getElementById("matchCount").value;

  try {
    const response = await fetch(
      `/riot-api/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}?matchCount=${matchCount}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Network response was not ok: ${errorText}`);
    }
    const data = await response.json();

    isDataLoaded = true;
    loadingData = false;
    toggleLoading();
    toggleChartSection();
    globalData = data;
    displayData(data);
  } catch (error) {
    document.getElementById("result").innerText = `Error: ${error.message}`;
    loadingData = false;
    toggleLoading();
  }
});

function displayData(data) {
  // Call each update function with the API data as needed
  console.log("data", data);
  updateBarChart(data);
  updateLineChart(data);
  updateScatterPlot(data);
  updateHeatmap(data);
  updateDualBarChart(data);

  matches.push("Select a match");

  //find self puuid
  const puuid = data.puuidData;

  for (let i = 0; i < data.singleMatchData.length; i++) {
    //find self in the match
    const playerData = data.singleMatchData[i].info.participants.find((participant) => participant.puuid === puuid);

    //create string
    let value =
      playerData.championName +
      " " +
      data.singleMatchData[i].info.gameMode +
      " " +
      new Date(data.singleMatchData[i].info.gameStartTimestamp).toLocaleDateString() +
      " ";

    if (playerData.win) {
      value += "Win";
    } else {
      value += "Loss";
    }
    matchIdMap.set(value.toLowerCase(), data.singleMatchData[i].info.gameId);
    matches.push(value);
  }

  //match selector
  fillMatchDropdown();
}

// method for match selector dropdown
function fillMatchDropdown() {
  const selector = document.getElementById("matchSelect");

  selector.innerHTML = "";

  matches.forEach((option) => {
    const match = document.createElement("option");
    match.value = option.toLowerCase().replace(/\s+/g, "-"); // Format the value
    match.textContent = option; // Set the visible text
    selector.appendChild(match);
  });
}
