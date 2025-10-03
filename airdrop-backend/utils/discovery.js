const Bonjour = require('bonjour');
const bonjour = new Bonjour();
const PORT = 3000;
let discoveredDevices = {};

function startDiscovery(deviceName, callback) {
    // Broadcast
    bonjour.publish({ name: deviceName, type: 'airdrop', port: PORT });

    // Listen
    bonjour.find({ type: 'airdrop' }, function(service) {
        if (service.name !== deviceName && !discoveredDevices[service.name]) {
            discoveredDevices[service.name] = service;
            callback(service);
        }
    });

    return discoveredDevices;
}

module.exports = { startDiscovery };
