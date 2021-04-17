const chromium = require("chrome-aws-lambda");
const { querySetup, pageQuery, writeToDb, getGpus } = require("./functs");
// const { staticGpus: gpus } = require("../lib/data");

const runScrape = async ({ prevInd, limit }) => {
  console.log("running");
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  console.log("browser open");

  const gpus = await getGpus({ prevInd, limit });

  console.log("got gpus");
  console.log({ gpus });

  let pages = await Promise.all(gpus.map(() => browser.newPage()));
  console.log("pages open");

  pages = querySetup(pages, gpus);

  let data = await pageQuery(pages);

  console.log("writing to db");
  const scrapeRes = await writeToDb(data);

  let openPages = await browser.pages();

  console.log("cleaning up");
  await Promise.all(openPages.map((page) => page.close()));

  await browser.close();

  return scrapeRes;
};

module.exports = runScrape;
