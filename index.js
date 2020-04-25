const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const redis = require('redis');
const client = redis.createClient({ host: '172.0.0.3', port: 6379 });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  let urRoom = 'home';
  socket.join('home');

  client.setnx(urRoom, '');

  client.get(urRoom, (err, k) => {
    console.log('error: ' + err);
    console.log(`redus get from ${urRoom} ` + k);
    client.get(urRoom, (err, k) => {
      var ls = k.split('&');
      for (const i of ls) {
        socket.emit('chat', i);
      }
    });
  });

  socket.on('join', (data) => {
    console.log('username: ' + data.name + ' joined room: ' + data.room);
    if (data.room !== urRoom) {
      socket.leave(urRoom);
      socket.join(data.room);
      urRoom = data.room;
      client.setnx(urRoom, '');
      client.get(urRoom, (err, k) => {
        var ls = k.split('&');
        for (const i of ls) {
          socket.emit('chat', i);
        }
      });

      const d = `username: ${data.name} joined room : ${data.room}`;

      client.append(urRoom, d + '&');

      io.to(urRoom).emit('chat', d);
    }
  });

  socket.on('chat', (data) => {
    // msg is data that we sent it can be a json
    console.log(data);

    client.append(urRoom, data + '&');

    client.get(urRoom, (err, k) => {
      console.log('error' + err);
      console.log(`redus get from ${urRoom} ` + k);
    });

    // send to everyone except socket that emit data
    // socket.broadcast.emit('chat', msg);

    //send to everyone include socket that emit data
    //option volatie to send interval data for socket that lost and can't receive data
    //function binary is for send data with binary format
    io.volatile.binary(true).to(urRoom).emit('chat', data);
  });

  socket.on('disconnect', () => {
    console.log('a user disconnect');
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
