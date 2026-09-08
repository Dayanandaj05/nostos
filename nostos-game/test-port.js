const net = require('net');
const socket = new net.Socket();
const start = Date.now();
socket.setTimeout(50);
socket.connect(54321, '127.0.0.1', () => {
  console.log('Connected in', Date.now() - start, 'ms');
  socket.destroy();
});
socket.on('error', (err) => {
  console.log('Error in', Date.now() - start, 'ms:', err.message);
});
socket.on('timeout', () => {
  console.log('Timeout in', Date.now() - start, 'ms');
  socket.destroy();
});
