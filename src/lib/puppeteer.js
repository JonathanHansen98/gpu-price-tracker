const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const { querySetup, pageQuery, writeToDb } = require("./functs");
const { gpus } = require("./data");

const runScrape = async () => {
  try {
    const browser = await puppeteer.launch();

    let pages = await Promise.all(gpus.map(() => browser.newPage()));

    pages = querySetup(pages);

    let data = await pageQuery(pages);

    await writeToDb(data);

    await Promise.all([mongoose.disconnect(), browser.close()]);
  } catch (error) {
    console.log(error);
  }
};

module.exports = runScrape;
