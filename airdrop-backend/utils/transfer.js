const net = require('net');
const fs = require('fs');
const path = require('path');

// ---- Receiver ----
function startFileReceiver(port = 5000, savePath = './received', onProgress = null, onError = null) {
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath);

    const server = net.createServer((socket) => {
        console.log('📥 Incoming file transfer...');

        let fileStream;
        let fileName;
        let fileSize;
        let receivedBytes = 0;

        socket.on('data', (chunk) => {
            try {
                // First packet contains file metadata
                if (!fileName) {
                    const headerEnd = chunk.indexOf('\n');
                    const header = chunk.slice(0, headerEnd).toString();
                    const [name, size] = header.split(':');
                    fileName = name;
                    fileSize = parseInt(size);
                    console.log(`Receiving ${fileName} (${fileSize} bytes)`);

                    fileStream = fs.createWriteStream(path.join(savePath, fileName));

                    fileStream.on('error', (err) => {
                        console.error('File write error:', err);
                        if (onError) onError(err);
                        socket.end();
                    });

                    // Write the rest of this chunk as file data
                    fileStream.write(chunk.slice(headerEnd + 1));
                    receivedBytes += chunk.length - (headerEnd + 1);
                } else {
                    // Write file chunks
                    fileStream.write(chunk);
                    receivedBytes += chunk.length;
                }

                // Progress callback
                const percent = ((receivedBytes / fileSize) * 100).toFixed(2);
                process.stdout.write(`\rProgress: ${percent}%`);
                if (onProgress) onProgress(percent, receivedBytes, fileSize);

                if (receivedBytes >= fileSize) {
                    console.log('\n✅ File received successfully!');
                    fileStream.end();
                    socket.end();
                }
            } catch (err) {
                console.error('Receiver error:', err);
                if (onError) onError(err);
                socket.end();
            }
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
            if (onError) onError(err);
        });
    });

    server.listen(port, () => {
        console.log(`📡 File receiver running on port ${port}`);
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        if (onError) onError(err);
    });
}

// ---- Sender ----
function sendFile(host, port, filePath, onProgress = null, onError = null) {
    const client = new net.Socket();
    let sentBytes = 0;
    let fileSize = 0;
    let fileName = '';

    try {
        const stats = fs.statSync(filePath);
        fileName = path.basename(filePath);
        fileSize = stats.size;
    } catch (err) {
        console.error('File stat error:', err);
        if (onError) onError(err);
        return;
    }

    client.connect(port, host, () => {
        console.log(`🚀 Sending ${fileName} (${fileSize} bytes) to ${host}:${port}`);
        const fileStream = fs.createReadStream(filePath);

        // Send metadata first
        client.write(`${fileName}:${fileSize}\n`);

        fileStream.on('data', (chunk) => {
            sentBytes += chunk.length;
            const percent = ((sentBytes / fileSize) * 100).toFixed(2);
            process.stdout.write(`\rProgress: ${percent}%`);
            if (onProgress) onProgress(percent, sentBytes, fileSize);
        });

        fileStream.on('error', (err) => {
            console.error('File read error:', err);
            if (onError) onError(err);
            client.end();
        });

        // Pipe file stream to socket
        fileStream.pipe(client);

        fileStream.on('end', () => {
            console.log('\n✅ File sent successfully!');
            client.end();
        });
    });

    client.on('error', (err) => {
        console.error('Client socket error:', err);
        if (onError) onError(err);
    });
}

module.exports = { startFileReceiver, sendFile };
