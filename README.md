# Midnight Bus Explorer
Terminal tool for adminstration and maintenance of Azure Service Buses 

# Install

`$ npm install midnight-bus-explorer -g` 

## Install local dev

In the project root directory run the following to install globally

`$ npm install -g ` p

# Configure

Before you can use Midnight Bus Explorer you need to configure your connection strings. The `configure` takes a name and a azure service bus connections string and will save it to a config file in your home folder. 

Ex: `$ midnightbus configure myazb "Endpoint=sb://myazb.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=notARealkey"`

Once you have an environment configured you can now start using the utility of Midnight bus explorer.

If you forget what configs you have or have set up use the `listConfig` call to see whats configured in the settings.

# Usage

## ListQueues:

This action will give you a list of the queues in your service bus. 

ex : `$ midnightbus myazb ListQueues` 

### Options

- showQueueCounts (true/false): takes true or false and will toggle showing number of messages in the active and dead letter queue. Default is false. 

## monitor:

This action allows you to monitor you queues in the terminal similar top in unix. 

ex: `$ midnightbus myazb monitor` 

### Options

- refresh(number): specify how frequently in seconds to refresh the display of queue information, default is two seconds. 

## peekQueue:

This action allows you to peek at whats in a particular queues subqueues, such as the active queue or the dead letter queue. 

### required

You must provide the name of the queue you want to peek into

ex: `$ midnightbus myazb peekQueue name-of-queue-to-peek` 

### Options 

- numberOfMessages: (number) takes how many messages to peek, default is 10. 
- messagesFromIndex (number): where to start from in the sub queue index, default is 0. 
- submessageQueue (number): Sub queue you wish to peek at, default is "deadLetter". 
- outputToFile (filePath): if provided with a filepath Will write subqueue contents to a specified file. 
- formatForResend (true/false): Will attempt to format file output in a way consumable by the `sendMessages`.
- filterSubject(string): will do simple pattern matching on the subject of a message in the sub queue and will only return messages that contain the provided filter string.

## sendMessages:

Will send messages from a provided json file to a queue. 

### required 

You must append the action with the bus you are sending too and the path to the json file containing the messages you are sending

EX: `$ midnightBus sendMessages name-of-queue-to-send-stuff ./myData/someData.json` 

Below is how the program expects you json file to be set up with the messages you are sending

```json
{
  "messages": [
    {
      "commandSubject": "DoTheThing+Command",
      "commandBody": {
        "someKindOfId": ";lkjhsdoidsjoijdfadsoijf",
        "somethingElse": "herpDerp",
        "someNumbersToo": 46546546549687464
      }
    }
  ]
}
```














