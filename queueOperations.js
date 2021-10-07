const fs = require('fs');
const { ServiceBusClient, ServiceBusAdministrationClient  } = require("@azure/service-bus");

const buildOperationOptions = ({operationArgs}) => {
  let operationOptions = {};

  for( let i = 0; i < operationArgs.length; i = i + 2) {
    let option = operationArgs[i];
    let value = operationArgs[i+1];

    operationOptions[option] = JSON.parse(value);
  }

  return operationOptions;
};

class QueueOperations {
  constructor(serviceBusConnectionString) {
    this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(serviceBusConnectionString);
    this.serviceBusClient = new ServiceBusClient(serviceBusConnectionString);
  }

  async ListQueues({operationArgs}) {
    const operationOptions = buildOperationOptions({operationArgs});
    const queuesIterator = await this.serviceBusAdministrationClient.listQueuesRuntimeProperties();
    
    for await (const q of queuesIterator) {
      let queueDetails =  `${q.name}`
      
      if(operationOptions.showQueueCounts){
        queueDetails = ` ${queueDetails}: active: ${q.activeMessageCount} | DLQ: ${q.deadLetterMessageCount}`;
      }
      console.log(queueDetails)
    }
  }

  async PeekMessageQueue({operationArgs}) {
    const [queueId] = operationArgs
    const operationOptions = buildOperationOptions({operationArgs: operationArgs.slice(1)});
    const numberOfMessages = operationOptions.numberOfMessages ? operationOptions.numberOfMessages : 10;
    const messagesFromIndex = operationOptions.messagesFromIndex ? operationOptions.messagesFromIndex : 0;
    const submessageQueue = operationOptions.subMesageQueue ? operationOptions.subMesageQueue : "deadLetter";
    const outputToFile = operationOptions.outputToFile;
    const messagesInSubqueue = [];

    const receiver = this.serviceBusClient.createReceiver(queueId, {
      receiveMode: "peekLock",
      subQueueType: submessageQueue
    });

    const messages = await receiver.peekMessages(numberOfMessages, {
      messagesFromIndex
    });

    for(let i = 0; i < messages.length; i = i + 1){
      messagesInSubqueue.push(messages[i]);
    }

    const outputObject = {};

    outputObject[queueId] = {}
    outputObject[queueId][submessageQueue] = messagesInSubqueue;
    const outputString = JSON.stringify(outputObject, null, 4);
    console.log(outputString);

    if(outputToFile) {
      try {
        fs.writeFileSync(outputToFile, JSON.stringify(outputObject));
      } catch(err) {
        console.log(`coudld not output data: ${err}`); 
      }
    }
  }
}

module.exports = QueueOperations;