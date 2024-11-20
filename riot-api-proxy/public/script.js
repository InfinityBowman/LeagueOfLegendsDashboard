// Constants for the charts, that would be useful.
const CHART_WIDTH = 450;
const CHART_HEIGHT = 200;
const MARGIN = { left: 250, bottom: 0, top: 100, right: 0 };
const ANIMATION_DUATION = 300;

let svgBar, svgLine, svgArea, svgScatter;
let isDataLoaded = false,
  loadingData = false;
const tooltip = d3.select("#tooltip");

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
  svgBar = d3.select("#Barchart-div").append("svg").append("g").attr("transform", `translate(${MARGIN.left}, ${10})`);

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
  svgLine = d3.select("#Linechart-div").append("svg").append("g").attr("transform", `translate(${MARGIN.left}, ${10})`);

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
    .attr("transform", `translate(${MARGIN.left}, ${10})`);

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
  svgHeatmap = d3.select("#CalendarHeatmap-div").append("svg").attr("transform", `translate(0, -20)`).append("g");
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
}

/**
 * Update the bar chart
 */
function updateBarChart(data) {
  //Chat GPT aided

  if (!data || data.singleMatchData.length === 0) return;

  const tooltip = d3.select("#tooltip");

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
      tooltip
        .style("display", "block")
        .html(`${d.name}<br>Lane: ${lane}<br>Role: ${role}<br>Wins: ${d.wins}<br>Losses: ${d.losses}`)
        .style("left", event.pageX + 5 + "px")
        .style("top", event.pageY - 28 + "px")
        .style("background", "dimgray")
        .style("border", "1px solid white");

      d3.select(this).attr("fill", function () {
        const color = d3.color(d3.select(this).attr("fill")).brighter(1);
        return color;
      });
    })
    .on("mousemove", function (event) {
      tooltip.style("left", event.pageX + 5 + "px").style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.style("display", "none");
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

  points
    .enter()
    .append("circle")
    .attr("cx", (d) => xAxis(d.gamesAgo))
    .attr("cy", (d) => yAxis(d.goldPerSecond))
    .attr("r", 7)
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
      tooltip
        .style("display", "block")
        .html(`Gold/sec: ${d.goldPerSecond.toFixed(2)}`) // Display the gold per second
        .style("left", event.pageX + 5 + "px") // Position tooltip next to the cursor
        .style("top", event.pageY - 28 + "px") // Position above the cursor
        .style("background", "dimgray")
        .style("border", "1px solid white");

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
    .attr("fill", function (data) {
      if (data.gameId === selectedMatch) {
        return "gold";
      } else {
        return data.win ? "#85d0ff" : "#e54787";
      }
    })

    //Chat GPT aided
    .on("mouseover", function (event, d) {
      // Show the tooltip with kills and deaths
      tooltip
        .style("display", "block")
        .html(`Kills: ${d.kills}<br>Deaths: ${d.deaths}<br>Win: ${d.win}`) // Set the content
        .style("left", event.pageX + 5 + "px") // Position tooltip next to the cursor
        .style("top", event.pageY - 28 + "px") // Position above the cursor
        .style("background", "dimgray")
        .style("border", "1px solid white");

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
  console.log("heatmap", data);
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

    // Create a tooltip div
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("font-size", 10)
      .style("position", "absolute")
      .style("background", "2f2f2f")
      .style("color", "white")
      .style("padding", "10px")
      .style("border", "1px solid #aac8e4")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0);

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
        tooltip.transition().duration(50).style("opacity", 0.9);
        tooltip
          .html(() => {
            const winRate = d.wins / (d.wins + d.losses);
            return `Date: ${formatDate(d.date)}<br>Win Rate: ${format(winRate)}<br>Record: ${d.wins} - ${d.losses}`;
          })
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        // End hover effect
        d3.select(this).classed("scaled", false);
        tooltip.transition().duration(300).style("opacity", 0);
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
  //updateHeatmap(globalData);
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
  updateBarChart(data);
  updateLineChart(data);
  updateScatterPlot(data);
  updateHeatmap(data);

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
      new Date(data.singleMatchData[i].info.gameStartTimestamp).toLocaleDateString();
    matchIdMap.set(value.toLowerCase(), data.singleMatchData[i].info.gameId);
    matches.push(value);
  }

  console.log("matches", matches);

  //match selector
  fillMatchDropdown();
}

// method for match selector dropdown
function fillMatchDropdown() {
  console.log("in populateDropdown");
  const selector = document.getElementById("matchSelect");

  selector.innerHTML = "";

  console.log("matches in populate", matches);
  matches.forEach((option) => {
    const match = document.createElement("option");
    match.value = option.toLowerCase().replace(/\s+/g, "-"); // Format the value
    match.textContent = option; // Set the visible text
    selector.appendChild(match);
  });
}
