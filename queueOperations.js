const fs = require('fs');
const { ServiceBusClient, ServiceBusAdministrationClient } = require("@azure/service-bus");
const BuildCommandBatchesFromJson = require("./BuildCommandsFromJson.js");
const _uniqBy = require("lodash.uniqby");

const buildOperationOptions = ({ operationArgs }) => {
  let operationOptions = {};

  for (let i = 0; i < operationArgs.length; i = i + 2) {
    let option = operationArgs[i];
    let value = operationArgs[i + 1];

    operationOptions[option] = JSON.parse(value);
  }

  return operationOptions;
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class QueueOperations {
  constructor(serviceBusConnectionString) {
    this.serviceBusAdministrationClient = new ServiceBusAdministrationClient(serviceBusConnectionString);
    this.serviceBusClient = new ServiceBusClient(serviceBusConnectionString);
  }

  async Monitor({ operationArgs }){
    const operationOptions = buildOperationOptions({ operationArgs });
    const refreshSpeed = operationOptions.refresh ? (operationOptions.refresh * 1000) : 2000;
    const argsForMonitor = ["showQueueCounts", "true", "streamMode", "true"];

    do{
      const queueDetails = await this.ListQueues({operationArgs: argsForMonitor});
      console.clear();
      this._outPutDataToScreen({dataToShowOnScreen: queueDetails});
      await sleep(refreshSpeed);
    }while(true);
  }

  async ListQueues({ operationArgs }) {
    const operationOptions = buildOperationOptions({ operationArgs });
    const queuesIterator = await this.serviceBusAdministrationClient.listQueuesRuntimeProperties();
    const streamMode = operationOptions.streamMode ? operationOptions.streamMode : false;
    const queueDetailsToPrint = [];

    for await (const q of queuesIterator) {
      let queueDetails = `${q.name}`

      if (operationOptions.showQueueCounts) {
        queueDetails = ` ${queueDetails}: active: ${q.activeMessageCount} | DLQ: ${q.deadLetterMessageCount}`;
      }
      queueDetailsToPrint.push(queueDetails);
    }
    if(streamMode){
      return queueDetailsToPrint;
    }
    this._outPutDataToScreen({dataToShowOnScreen: queueDetailsToPrint});
    return queueDetailsToPrint;
  }

  async SendMessages({ operationArgs }) {
    const [queueId, filePathToMessages] = operationArgs
    const operationOptions = buildOperationOptions({ operationArgs: operationArgs.slice(2) });
    const delayBetweenSends = operationOptions.delayBetweenSends ? (operationOptions.delayBetweenSends * 1000) : 10000;
    let messagesToSend = {};

    try {
      if (fs.existsSync(filePathToMessages)) {
        let fileData = fs.readFileSync(filePathToMessages);
        messagesToSend = JSON.parse(fileData);
      }
    } catch (err) {
      console.log(`Could not find file ${filePathToMessages}`);
      return;
    }
    const commandsFromFiles = await BuildCommandBatchesFromJson({ messagesToSend, queueName: queueId });
    console.log("sending messages");
    for (let i = 0; i < commandsFromFiles.length; i = i + 1) {
      const commandsInstructions = commandsFromFiles[i];
      await this._sendCommandBatches({ commandsInstructions });
      console.log(`Chunk ${i + 1} of ${commandsFromFiles.length} sent`)
      await sleep(delayBetweenSends);
    }
  }

  async PeekMessageQueue({ operationArgs }) {
    const [queueId] = operationArgs
    const operationOptions = buildOperationOptions({ operationArgs: operationArgs.slice(1) });
    const numberOfMessages = operationOptions.numberOfMessages ? operationOptions.numberOfMessages : 10;
    const messagesFromIndex = operationOptions.messagesFromIndex ? operationOptions.messagesFromIndex : 0;
    const submessageQueue = operationOptions.subMesageQueue ? operationOptions.subMesageQueue : "deadLetter";
    const formatForResend = operationOptions.formatForResend ? operationOptions.formatForResend : false;
    const filterSubject = operationOptions.filterSubject ? operationOptions.filterSubject : false;
    const outputToFile = operationOptions.outputToFile;
    const messagesInSubqueue = [];

    const receiver = this.serviceBusClient.createReceiver(queueId, {
      receiveMode: "peekLock",
      subQueueType: submessageQueue
    });


    const messages = await this._getMessagesFromSubQueue({ receiver, numberOfMessages, messagesFromIndex })


    for (let i = 0; i < messages.length; i = i + 1) {
      const message = messages[i];
      if(filterSubject !== false) {
        const {subject} = message;
        if(subject.includes(filterSubject) === false){
          continue;
        }
      }
      messagesInSubqueue.push(message);
    }

    const outputObject = {};

    outputObject[queueId] = {}
    outputObject[queueId][submessageQueue] = messagesInSubqueue;
    console.log(JSON.stringify(outputObject, null, 4));

    if (outputToFile) {
      try {
        let dataToFileWrite = formatForResend ? this._formatForResend({ messagesForFormatting: messagesInSubqueue }) : outputObject;

        fs.writeFileSync(outputToFile, JSON.stringify(dataToFileWrite, null, 4));
      } catch (err) {
        console.log(`coudld not output data: ${err}`);
      }
    }
  }

  _outPutDataToScreen({dataToShowOnScreen}){
    for(let i = 0; i < dataToShowOnScreen.length; i = i + 1){
      const dataScreenLine = dataToShowOnScreen[i];
      console.log(dataScreenLine);
    }
  }

  async _getMessagesFromSubQueue({ receiver, numberOfMessages, messagesFromIndex }) {
    let messages = [];
    let peekBatch = [];

    // this is goofy because it does not work the way the docs describe it and M$ has no examples.
    // https://docs.microsoft.com/en-us/javascript/api/@azure/service-bus/servicebusreceiver?view=azure-node-latest#peekMessages_number__PeekMessagesOptions_
    do {
        peekBatch = await receiver.peekMessages(numberOfMessages, {
        messagesFromIndex
      });
      messages = messages.concat(peekBatch);
    } while (messages.length < numberOfMessages && peekBatch.length !== 0);

    messages = _uniqBy(messages, 'messageId');

    return messages;
  }

  _formatForResend({ messagesForFormatting }) {
    let resendableOutPut = {
      messages: []
    }

    for (let i = 0; i < messagesForFormatting.length; i = i + 1) {
      const { body, subject} = messagesForFormatting[i];
      const resendMessage = {
        commandSubject: subject,
        commandBody: body
      };
      resendableOutPut.messages.push(resendMessage);
    }
    return resendableOutPut;
  }

  async _sendCommandBatches({ commandsInstructions }) {
    const { queueName, commandsToSend } = commandsInstructions;
    const sender = this.serviceBusClient.createSender(queueName);

    try {
      // Tries to send all messages in a single batch.
      // Will fail if the messages cannot fit in a batch.
      // await sender.sendMessages(messages);

      // create a batch object
      let batch = await sender.createMessageBatch();
      for (let i = 0; i < commandsToSend.length; i++) {
        console.log()
        // for each message in the array
        // try to add the message to the batch
        if (!batch.tryAddMessage(commandsToSend[i])) {
          // if it fails to add the message to the current batch
          // send the current batch as it is full
          await sender.sendMessages(batch);

          // then, create a new batch 
          batch = await sender.createMessageBatch();

          // now, add the message failed to be added to the previous batch to this batch
          if (!batch.tryAddMessage(commandsToSend[i])) {
            // if it still can't be added to the batch, the message is probably too big to fit in a batch
            throw new Error("Message too big to fit in a batch");
          }
        }
      }
      // Send the last created batch of messages to the queue
      await sender.sendMessages(batch);
      await sender.close();
    } catch (err) {
      console.log(`Error Sending data to ${queueName}: ${err}`);
    }
  }
}

module.exports = QueueOperations;