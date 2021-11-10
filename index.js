#!/usr/bin/env node
'use strict';

const { Command } = require('commander');

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
  const program = new Command();
  program
    .version('0.0.2')
    .description('Terminal tool for operation on azure service busses');
  
  const configureCommand = program.command('configure')
    .description('Manage service bus connection configurations');

  configureCommand
    .command('list')
    .description('List service bus connection configurations')
    .action(ListConfiguredConnections);

  configureCommand
    .command('set')
    .argument('<name>', 'a name for the connection, e.g. "dev"')
    .argument('<connection_string>', 'the service bus connection string')
    .description('Set the service bus connection')
    .action((envName, connectionString) => SetConnectionsString(envName, connectionString));
  
  const queueCommand = program.command('queue')
    .description('Manage service bus queues');

    queueCommand
    .command('list')
    .description('List service bus queues')
    .action(() => console.log('TODO list queues here'));

    queueCommand
    .command('monitor')
    .description('Monitor messages in a service bus queue')
    .action(() => console.log('TODO monitor queues here'));

    queueCommand
    .command('send')
    .description('Send a message to a service bus queue')
    .argument('<queue_name>', 'name of the queue')
    .argument('<file>', 'path of a json file containing the message body')
    .action(() => console.log('TODO send message here'));

    queueCommand
    .command('peek')
    .description('Peek service bus queues')
    .argument('<queue_name>', 'name of the queue')
    .option('-c, --message-count', 'count of messages to peek', 10)
    .option('-o, --message-offset', 'where to start from in the sub queue index', 0)
    .option('-s, --subqueue-name', 'Sub queue name you wish to peek', 'deadletter')
    .option('-f, --output-file', 'if provided with a filepath Will write subqueue contents to a specified file')
    .option('-r, --use-resend-format', 'format file output in a way consumable by queue-message-send', false)
    .option('-g, --filter-subject <pattern>', 'only return messages that contain the provided filter string')
    .action(() => console.log('TODO peek queues here'));
  
  program.parse();
  
  let inputArgs = process.argv.slice(2);
  const [action] = inputArgs;

  // switch (action) {
  //   case "configure":
  //     SetConnectionsString({operationArgs: inputArgs.slice(1)});
  //     return;
  //   case "listConfig":
  //     ListConfiguredConnections({});
  //     return;
  // }
  await processServiceBusAction({inputArgs});
  process.exit(0);
};

main().catch((err) => {
  console.log("Error occurred: ", err);
  process.exit(1);
});
