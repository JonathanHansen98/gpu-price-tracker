require("dotenv").config({ path: "../../.env" });
const runScrape = require("../lib/puppeteer");

module.exports.handler = async (event) => {
  await runScrape();

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Data Scraped.",
      },
      null,
      2
    ),
  };
};
