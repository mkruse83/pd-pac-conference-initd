// require("aws-xray-sdk");
const confs = require("./_confs.json");
// const fixConfs = require("./_fixData.json");
const locations = require("./_location.json");
const talks = require("./_talkTitles.json");
const room = require("./_room.json");
const speaker = require("./_speaker.json");
const topics = require("./_topics.json");

const lambda = require("./helper/callLambda");
const AWS = require("aws-sdk");
AWS.config.apiVersions = {
    dynamodb: "2012-08-10",
};

const createMainTable = {
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    AttributeDefinitions: [
        {
            AttributeName: "partkey",
            AttributeType: "S"
        },
        {
            AttributeName: "sortkey",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "partkey",
            KeyType: "HASH"
        },
        {
            AttributeName: "sortkey",
            KeyType: "RANGE"
        },
    ],
    TableName: "pac-conference"
};
const createOps = {
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    },
    AttributeDefinitions: [
        {
            AttributeName: "partkey",
            AttributeType: "S"
        },
        {
            AttributeName: "sortkey",
            AttributeType: "S"
        }
    ],
    KeySchema: [
        {
            AttributeName: "partkey",
            KeyType: "HASH"
        },
        {
            AttributeName: "sortkey",
            KeyType: "RANGE"
        },
    ],
    TableName: "pac-conference-ops"
};

const sleep = () => {
    return new Promise((resolve) => setTimeout(resolve, 1000));
};

const getRandomValue = (arr) => {
    const rand = Math.round(getRandom(0, arr.length - 1));
    return arr[rand];
};

const getRandom = (min, max) => {
    return Math.round(Math.random() * (+max - +min) + +min);
};

const getRandomarray = (arr, min = 1, max = 3) => {
    const arrayLength = getRandom(Math.min(arr.length, min), Math.min(arr.length, max));
    const result = [];
    for (let i = 0; i < arrayLength; i++) {
        result.push(getRandomValue(arr));
    }
    return result;
};

const createConf = (conf) => {

    const result = {
        ...conf,
        topics: getRandomarray(topics),
        location: getRandomValue(locations),
    };

    const from = new Date(conf.from);
    const to = new Date(conf.to);
    let current = new Date(from);

    result.talks = [];
    const rooms = getRandomarray(room, 2, 4)
        .filter((room, index, self) => self.indexOf(room) === index);
    while (current.getTime() < to.getTime()) {
        rooms.forEach(room => {
            let currentTime = new Date(current);
            while (currentTime.getHours() < 17) {
                let targetTime = new Date(currentTime);
                targetTime.setHours(targetTime.getHours() + 2);
                let talk = {
                    from: currentTime,
                    to: targetTime,
                    room: room,
                };
                if (getRandom(0, 1)) {
                    talk = {
                        ...talk,
                        name: getRandomValue(talks),
                        speaker: getRandomValue(speaker),
                        topics: getRandomarray(topics)
                    };

                }
                result.talks.push(talk);
                currentTime = new Date(targetTime);
            }
        });
        current.setDate(current.getDate() + 1);
    }

    return result;
};

const addConfs = (confs) => {
    if (confs.length === 0) {
        return Promise.resolve();
    }
    const conf = confs.splice(0, 1)[0];
    return addConfs(confs).then(() => {
        return lambda("addConference", {conference: conf});
    });
};

const deleteTable = (dynamoDb, table) => {
    return new Promise((resolve, reject) => {
        dynamoDb.deleteTable({TableName: table}, (err, data) => {
            if (err) {
                console.log("ERROR: could not delete", err);
                reject(err);
            } else {
                console.log("SUCCESS: deleted table", data);
                resolve(data);
            }
        })
    });
};

const listTables = (dynamoDb) => {
    return new Promise((resolve, reject) => {
        dynamoDb.listTables({}, (err, data) => {
            if (err) {
                console.log("ERROR: could list tables", err);
                reject(err);
            } else {
                console.log("SUCCESS: listed table", data);
                resolve(data.TableNames);
            }
        })
    });
};

const createTable = (dynamoDb, params) => {
    return new Promise((resolve, reject) => {
        dynamoDb.createTable(params, (err, data) => {
            if (err) {
                console.log("ERROR: could not create", err);
                reject(err);
            } else {
                console.log("SUCCESS: create table", data);
                resolve(data);
            }
        })
    });
};

exports.handler = async () => {
    const dynamoDb = new AWS.DynamoDB();
    try {
        await deleteTable(dynamoDb, "pac-conference");
        await deleteTable(dynamoDb, "pac-conference-ops");
    } catch (e) {
        const test = "Requested resource not found: Table: pac-conference not found";
        if (!e.message.includes(test)) {
            throw e;
        }
    }
    while (true) {
        const tables = await listTables(dynamoDb);
        if (tables.indexOf("pac-conference") === -1) {
            break;
        }
        await sleep();
    }
    await createTable(dynamoDb, createMainTable);
    await createTable(dynamoDb, createOps);
    while (true) {
        const tables = await listTables(dynamoDb);
        if (tables.indexOf("pac-conference") >= 0) {
            await sleep();
            await sleep();
            await sleep();
            await sleep();
            await sleep();
            await sleep();
            break;
        }
        await sleep();
    }
    const newConfs = [];
    confs.conferences.forEach(con => {
        const newConf = createConf(con);
        newConfs.push(newConf);
    });
    return addConfs(newConfs);
    // return addConfs(fixConfs);
};
