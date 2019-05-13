var AWS = require("aws-sdk");
var lambda = new AWS.Lambda({
  region: "eu-central-1"
});

module.exports = (identifier, payload) => {
  return new Promise((resolve, reject) => {
    lambda.invoke(
      {
        FunctionName: "pd-pac-conference-dal-" + process.env.PD_PAC_ENVIRONMENT,
        Payload: JSON.stringify({
          identifier,
          ...payload
        })
      },
      (error, data) => {
        console.log("result from call", data, "error", error);
        if (error) {
          reject(error);
          return;
        }
        if (data.Payload) {
          resolve(data.Payload);
          return;
        }
        reject(new Error("Unknown state"));
      }
    );
  });
};
