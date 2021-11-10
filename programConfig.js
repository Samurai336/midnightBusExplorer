const {homedir} = require('os');
const util = require('util');
util.promisify(require('child_process').exec)
const exec = util.promisify(require('child_process').exec)
const fs = require('fs');

const defaultConfigPath = `${homedir()}/.midnightServiceBus.config`;

const GetAzCliConnections = () => {
  console.log('here')
  result = exec('ls');
  return result;
}

const SetConnectionsString = (envName, connectionString) => {
    let config = {}
  
    try {
      if (fs.existsSync(defaultConfigPath)) {
        let configData = fs.readFileSync(defaultConfigPath);
        config = JSON.parse(configData);
      }
    } catch(err) {
      console.log('Config not found: adding new config file'); 
    }
  
    config[envName] = connectionString;
  
    fs.writeFileSync(defaultConfigPath, JSON.stringify(config, null, 4), );
  };

  const ListConfiguredConnections = ({configPath = defaultConfigPath}) => {
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

  const LoadConnectionString = ({configPath = defaultConfigPath, connectionSettingName}) => {
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
  
  module.exports = {
    SetConnectionsString,
    ListConfiguredConnections,
    LoadConnectionString,
    GetAzCliConnections
  };