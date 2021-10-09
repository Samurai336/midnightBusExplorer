const {
  v4: uuidv4,
} = require('uuid');
const bodyWraper = require("./WrapCommandBody.js")
const _chunk = require("lodash.chunk");

module.exports = async ({ messagesToSend, queueName }) => {
  const {messages} = messagesToSend;
  const arrayChunks = _chunk(messages, 100);
  const batchCommandList = [];

  const sessionId = uuidv4();

  for(let c = 0; c < arrayChunks.length; c = c + 1 ){
    const commandChunks = arrayChunks[c];
    const commandsToSend = [];
    for(let i = 0; i < commandChunks.length; i = i + 1) {
      const {commandBody, commandSubject}= commandChunks[i]
      const command = bodyWraper({commandBody, commandSubject, sessionId});
      commandsToSend.push(command);
    }
    batchCommandList.push({
      commandsToSend,
      queueName
    });
  }
  return batchCommandList;
}
