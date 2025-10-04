
const { deviceName } = require('./config');
const { startDiscovery } = require('./utils/discovery');
const { startSignalingServer } = require('./utils/signals');
const { startFileReceiver, sendFile } = require('./utils/transfer');
const { io } = require('socket.io-client');
const PORT = 3000;

let targetDevice = null;

const devices = startDiscovery(deviceName, (service) => {
    console.log('discovered: ', service.name);
    // Example: send a file request to the first discovered device
    if (!targetDevice) {
        targetDevice = service;
        socket.emit('file-request', {
            from: deviceName,
            filename: 'sample.txt'
        });
    }
});

startSignalingServer();

startFileReceiver(5000, './received', (percent, received, total) => {
    process.stdout.write(`\rReceive Progress: ${percent}% (${received}/${total} bytes)`);
}, (err) => {
    console.error('File receive error:', err);
});

// Connect to signaling server
const socket = io('http://localhost:4000');

socket.on('file-response', (data) => {
    if (data.accepted && targetDevice) {
        console.log(`📩 ${targetDevice.name} accepted file request`);
        // send actual file
        sendFile(targetDevice.host, 5000, './sample.txt', (percent, sent, total) => {
            process.stdout.write(`\rSend Progress: ${percent}% (${sent}/${total} bytes)`);
        }, (err) => {
            console.error('File send error:', err);
        });
    } else if (targetDevice) {
        console.log(`❌ ${targetDevice.name} rejected file request`);
    }
});
