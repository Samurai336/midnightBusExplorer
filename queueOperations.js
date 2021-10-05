
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
  constructor(serviceBusClient) {
    this.serviceBusClient = serviceBusClient;
  }

  async ListQueues({operationArgs}) {
    const queuesIterator = await this.serviceBusClient.listQueuesRuntimeProperties();
    const operationOptions = buildOperationOptions({operationArgs});
    
    for await (const q of queuesIterator) {
      let queueDetails =  `${q.name}`
      
      if(operationOptions.showQueueCounts){
        queueDetails = ` ${queueDetails}: active: ${q.activeMessageCount} | DLQ: ${q.deadLetterMessageCount}`;
      }
      console.log(queueDetails)
    }
  }
}

module.exports = QueueOperations;