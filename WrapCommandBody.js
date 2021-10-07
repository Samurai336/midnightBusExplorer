const {
  v4: uuidv4,
} = require('uuid');

module.exports = ({commandBody, commandSubject, sessionId, contenType = "application/json"}) => {
  return {
    body: commandBody,
    subject: commandSubject,
    messageId: uuidv4(),
    sessionId,
    content_type: contenType
  }
}