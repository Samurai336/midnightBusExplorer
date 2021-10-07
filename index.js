const {homedir} = require('os');
const fs = require('fs');
const defaultConfigPath = `${homedir()}/.midnightServiceBus.config`;
const QueueOperations = require("./queueOperations.js");

const setConnectionsString = ({operationArgs}) => {
  let config = {}

  try {
    if (fs.existsSync(defaultConfigPath)) {
      let configData = fs.readFileSync(defaultConfigPath);
      config = JSON.parse(configData);
    }
  } catch(err) {
    console.log('Config not found: adding new config file'); 
  }
  
  let [envName, connectionString ] = operationArgs; 

  config[envName] = connectionString;

  fs.writeFileSync(defaultConfigPath, JSON.stringify(config), );
}

const loadConnectionString = ({configPath = defaultConfigPath, connectionSettingName}) => {
  try {
    if (fs.existsSync(configPath)) {
      let configData = fs.readFileSync(configPath);
      let loadedConfig = JSON.parse(configData);
      return loadedConfig[connectionSettingName]
    }
  } catch(err) {
    throw new Error('Required');
  }
}

const listConfiguredConnections = ({configPath = defaultConfigPath}) => {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath);
      const loadedConfig = JSON.parse(configData);
      const configKeys =  Object.keys(loadedConfig);
      console.log(`Available configs: ${configKeys}`)
    }
  } catch(err) {
    throw new Error('Required');
  }
}

const processServiceBusAction = async ({inputArgs}) => {
  const [connectionSettingName, busAction] = inputArgs;
  const serviceBusConnectionString = loadConnectionString({connectionSettingName}); 
  const queueOperations = new QueueOperations(serviceBusConnectionString);
  const operationArgs = inputArgs.slice(2);

  switch(busAction) {
    case 'ListQueues':
      await queueOperations.ListQueues({operationArgs})
      break;
    case 'peekQueue': 
      await queueOperations.PeekMessageQueue({operationArgs});
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
      setConnectionsString({operationArgs: inputArgs.slice(1)});
      return;
    case "listConfig":
      listConfiguredConnections({});
      return;
  }
  await processServiceBusAction({inputArgs});
  process.exit(0);
};

main().catch((err) => {
  console.log("Error occurred: ", err);
  process.exit(1);
});
