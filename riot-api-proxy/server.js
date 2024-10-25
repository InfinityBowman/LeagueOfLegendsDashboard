const express = require("express");
const axios = require("axios");
const path = require("path");
const { match } = require("assert");
const app = express();
const port = 3000;

// Replace with your API key
const RIOT_API_KEY = "RGAPI-e7399da9-d21c-441b-a2ed-41c6b974dbcd";

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Route handler for the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route handler for the Riot API endpoint
app.get("/riot-api/:gameName/:tagLine", async (req, res) => {
  console.log("req.params", req.params);
  const { gameName, tagLine } = req.params;

  try {
    const response = await axios.get(
      `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName
      )}/${encodeURIComponent(tagLine)}?api_key=${RIOT_API_KEY}`
    );
    const puuid = response.data.puuid;

    // Fetch match data using the puuid
    const matchResponse = await axios.get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${RIOT_API_KEY}`
    );
    console.log("matchResponse", matchResponse.data[0]);
    let matchData = [];
    for(let i = 0; i < matchResponse.data.length; i++) {
      const singleMatchResponse = await axios.get(
        `https://americas.api.riotgames.com/lol/match/v5/matches/NA1_5137339902?api_key=${RIOT_API_KEY}`
      );
      matchData.push(singleMatchResponse.data);
    }
    res.json({
      puuidData: puuid,
      summonerData: response.data,
      matchIds: matchResponse.data,
      singleMatchData: matchData,
    });
  } catch (error) {
    console.error("Error fetching data from Riot API:", error.message);
    res.status(500).send("Error fetching data from Riot API");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
