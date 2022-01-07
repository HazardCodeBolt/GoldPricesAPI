const PORT = process.env.PORT || 8000;
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.get("/:currency", async (req, res) => {
  const currencies_ratios =  await axios.get(
    "https://api.exchangerate-api.com/v4/latest/USD"
  );
  const currency_ratio = currencies_ratios.data.rates[req.params.currency];

  if (currency_ratio === undefined) {
    res.json("ERROR: No such currency is available");
    return;
  }

  axios.get("https://oman.gold-price-today.com/").then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);

    let elements = $('#main-table tr:contains("$")', html);
    let json_data = elements
      .toString()
      .replace(/\t|<tr>|<\/tr>/g, "")
      .split("\n");


    var new_json_data = [];
    for (let index = 0; index < json_data.length; index++) {
      const element = json_data[index];

      if ($(element).text().charAt(0) == "$") {
        let text = $(element).text().slice(1);
        new_json_data.push(parseFloat((parseFloat(text) * currency_ratio).toFixed(3)));
      }
    }
    var json_response = {
      currency: req.params.currency,
      karat_prices: {},
      nesab_alzakah: undefined,
    };

    var karats = [
      "karat_24",
      "karat_22",
      "karat_21",
      "karat_18",
      "karat_14",
      "karat_12",
    ];

    for (let index = 0; index < karats.length; index++) {
      json_response["karat_prices"][karats[index]] = new_json_data[index];
    }
    json_response["nesab_of_gold"] = new_json_data[0] * 85;

    json_response["price_update_time"] = $("#main-table td[colspan=3]", html)
      .text()
      .match(/\w+,\s\w+\s\d+,\s\d+\s\d+:\d+\s\w+/)[0] + " GMT +0400";

    var today = new Date();
    var date = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
    var time = `${today.getUTCHours()}:${today.getUTCMinutes()}:${today.getUTCSeconds()}`;
    var dateTime = `${date} ${time} GMT`;
    json_response["request_time"] = dateTime;

    res.json(json_response);
  });
});

app.listen(PORT, (e) => {
  console.log(`server running on port ${PORT}`);
});
