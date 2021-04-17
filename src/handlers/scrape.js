const createResponseObject = require("/opt/nodejs/createResponseObject");
const mongooseConnect = require("/opt/nodejs/mongooseConnect");
const { errorHandler } = require("/opt/nodejs/errorHandler");
const { CronCursor: Cursor, QueryData } = require("/opt/nodejs/models");
const runScrape = require("../lib/puppeteer");
const mongoConnect = mongooseConnect();

const handleCursorSetup = async () => {
  const queueLength = await QueryData.countDocuments();

  const res = await Cursor.findOne({
    _id: "607201452e0adb4254bb5bdd",
  }).lean();

  let { prevInd, limit } = res;

  prevInd = prevInd == null || prevInd >= queueLength ? 0 : prevInd;

  return { prevInd, limit };
};

module.exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const resp = await createResponseObject(event);

  try {
    console.log("Connecting to MongoDB");

    await mongoConnect;

    const { prevInd, limit } = await handleCursorSetup();

    const result = await runScrape({ prevInd, limit });

    const newCursor = {
      prevInd: prevInd + limit + 1,
    };

    await Cursor.update({ _id: "607201452e0adb4254bb5bdd" }, newCursor);

    resp.setBody(JSON.stringify(result));
  } catch (error) {
    errorHandler(error, resp, {
      requestId: context.awsRequestId,
      functionName: context.functionName,
    });
  } finally {
    console.log("finally");
    callback(null, resp.getPayload());
  }
};
