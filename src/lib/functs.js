const { GPU } = require("../models");
const sha256 = require("crypto-js/sha256");
const { querys, gpus } = require("./data");
const mongoose = require("mongoose");

const readPageData = async (puppPage) => {
  return await Promise.all(
    querys.map((q) => {
      return new Promise(async (queryRes) => {
        const textArr = evalNodeText(puppPage, q);
        queryRes(textArr);
      });
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
      item_id: sha256(text + dateItem).toString(),
    };
  });
};

const evalNodeText = async (page, query) =>
  await page.$$eval(query, (nodes) => nodes.map((t) => t.innerText));

module.exports.querySetup = (pages) => {
  return pages.map((page, i) => {
    const gpu = gpus[i];
    return {
      page: page,
      query: `${gpu.make}+${gpu.model}`,
      gpu: gpu,
    };
  });
};

module.exports.pageQuery = async (pages) => {
  const pageData = await Promise.all(
    pages.map((page) => {
      return new Promise(async (resolve) => {
        const { page: puppPage, query, gpu } = page;

        await puppPage.goto(
          `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Sold=1&_ipg=200`
        );

        const queryText = await readPageData(puppPage);

        const titleArr = queryText[0];
        const priceArr = queryText[1];
        const soldDateArr = queryText[2];

        const dataObj = mapPageData({ titleArr, priceArr, soldDateArr }, gpu);

        resolve(dataObj);
      });
    })
  );

  return pageData.flat();
};

module.exports.writeToDb = async (data) => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const bulkOps = data.map((doc) => ({
    updateOne: {
      filter: { item_id: doc.item_id },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const { nUpserted, nModified } = await GPU.bulkWrite(bulkOps);

  console.log("# of items scraped: ", data.length);
  console.log("# of items modified: ", nModified);
  console.log("# of items upserted: ", nUpserted);
};
