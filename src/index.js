require("aws-xray-sdk");
const data= require("./data.json");
const lambda = require("./helper/callLambda");

exports.handler = async () => {
  data.conferences.forEach(conf => {
    lambda("addConference", conf);
  });
};
