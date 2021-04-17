var SHA256 = require("crypto-js/sha256");
const { querys } = require("./data");
const lambdaRequest = require("/opt/nodejs/lambdaRequest");
const { QueryData } = require("/opt/nodejs/models");

const readPageData = async (puppPage) => {
  return await Promise.all(
    querys.map(async (q) => {
      const textArr = await evalNodeText(puppPage, q);
      return textArr;
    })
  );
};

const mapPageData = (pageData, gpu) => {
  const { titleArr, priceArr, soldDateArr } = pageData;

  return titleArr.map((text, ind) => {
    const priceItem = priceArr[ind];
    const dateItem = soldDateArr[ind];

    return {
      ...gpu,
      price: parseFloat(priceItem.slice(1).replace(",", "")),
      title: text,
      date_sold: new Date(dateItem.slice(5)),
      item_id: SHA256(text).toString(),
    };
  });
};

// Issue here where DOM content is not always loaded and pptr times out waiting for the
// query selector to become present.
// Ebay blocking network requests/ detecting headless modex? Something im doing wrong async wise? who knows

const evalNodeText = async (page, query) => {
  console.log({ query, page });

  let pageText = await page.$$eval(query, (nodes) => {
    return nodes.map((t) => t.innerText);
  });

  const pNodes = await page.$$eval(query, (nodes) => nodes.length);

  console.log({ pageText });
  console.log({ pNodes });

  if (!pNodes) {
    await page.reload()
    pageText = await page.$$eval(query, (nodes) => {
      return nodes.map((t) => t.innerText);
    });
  }

  return pageText;
};

module.exports.querySetup = (pages, gpuList) => {
  return pages.map((page, i) => {
    const gpu = gpuList[i];
    return {
      page: page,
      query: `${gpu.make}+${gpu.model.split(" ").join("+")}`,
      gpu: gpu,
    };
  });
};

module.exports.pageQuery = async (pages) => {
  console.log("running queries");
  console.log("pages");

  console.log({ pages });
  const pageData = await Promise.all(
    pages.map((page) => {
      return new Promise(async (resolve) => {
        const { page: puppPage, query, gpu } = page;

        const url = `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Sold=1&_ipg=50`;

        console.log({ url, gpu, query });

        await puppPage.goto(url);

        const queryText = await readPageData(puppPage);

        console.log({ querys });
        console.log({ queryText });

        const titleArr = queryText[0];
        const priceArr = queryText[1];
        const soldDateArr = queryText[2];

        const dataObj = mapPageData({ titleArr, priceArr, soldDateArr }, gpu);

        console.log({ dataObj });
        resolve(dataObj);
      });
    })
  );

  return pageData.flat();
};

module.exports.getGpus = async ({ prevInd, limit }) =>
  await QueryData.find({}).skip(prevInd).limit(limit).lean();

module.exports.writeToDb = async (data) => {
  return await lambdaRequest("gpu-api-dev-bulkWrite", "RequestResponse", data);
};
