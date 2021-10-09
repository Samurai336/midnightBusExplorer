#!/usr/bin/env node
'use strict';

const QueueOperations = require("./queueOperations.js");
const {  SetConnectionsString, ListConfiguredConnections, LoadConnectionString} = require("./programConfig.js");

const processServiceBusAction = async ({inputArgs}) => {
  const [connectionSettingName, busAction] = inputArgs;
  const serviceBusConnectionString = LoadConnectionString({connectionSettingName}); 
  const queueOperations = new QueueOperations(serviceBusConnectionString);
  const operationArgs = inputArgs.slice(2);

  switch(busAction) {
    case 'listQueues':
      await queueOperations.ListQueues({operationArgs})
      break;
    case "monitor":
      await queueOperations.Monitor({operationArgs})
      break;
    case 'peekQueue':
      await queueOperations.PeekMessageQueue({operationArgs});
      break;
    case 'sendMessages':
      await queueOperations.SendMessages({operationArgs});
      break;
    default:
      return;
  }
  return;
}

async function main() {
  let inputArgs = process.argv.slice(2);
  const [action] = inputArgs;

  switch (action) {
    case "configure":
      SetConnectionsString({operationArgs: inputArgs.slice(1)});
      return;
    case "listConfig":
      ListConfiguredConnections({});
      return;
  }
  await processServiceBusAction({inputArgs});
  process.exit(0);
};

main().catch((err) => {
  console.log("Error occurred: ", err);
  process.exit(1);
});
