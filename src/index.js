require("aws-xray-sdk");
const data= require("./data.json");
const lambda = require("./helper/callLambda");
const AWS= require("aws-sdk");
AWS.config.apiVersions = {
  dynamodb: '2012-08-10',
};

const addConf = (confs) => {
  if (confs.length === 0) {
    return Promise.resolve();
  }
  const conf = confs.splice(0, 1)[0];
  return addConf(confs).then(() => {
    return lambda("addConference", {conference: conf});
  });
};

exports.handler = async () => {
  const dynamoDb = new AWS.DynamoDB();
  dynamoDb.deleteTable("pac-conference");
  dynamoDb.createTable("pac-conference");
  const confs = [...data.conferences];
  return addConf(confs);
};
