const http = require('http');
const socketio = require('socket.io');
const { deviceName } = require('../config');
const SIGNAL_PORT = 4000;

function startSignalingServer() {
    const server = http.createServer();
    const ioServer = socketio(server);

    server.listen(SIGNAL_PORT, () => {
        console.log(`${deviceName} Signaling server running on port ${SIGNAL_PORT}`);
    });

    ioServer.on('connection', (socket) => {
        console.log('Peer Connected:', socket.id);

        socket.on('file-request', (data) => {
            console.log(`📥 ${data.from} wants to send a file: ${data.filename}`);

            socket.broadcast.emit('file-response', {
                to: data.from,
                accepted: true,
                message: "Ready to receive the file."
            });
        });
    });
}

module.exports = { startSignalingServer };