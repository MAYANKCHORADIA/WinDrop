
const { deviceName } = require('./config');
const { startDiscovery } = require('./utils/discovery');
const { startSignalingServer } = require('./utils/signals');
const PORT = 3000;

const devices = startDiscovery(deviceName, (service) => {
    console.log('discovered: ', service.name);
});

startSignalingServer();

