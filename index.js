var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  let urRoom = 'home';
  socket.join('home');

  socket.on('join', (data) => {
    console.log('username: ' + data.name + ' joined room: ' + data.room);
    if (data.room !== urRoom) {
      socket.leave(urRoom);
      socket.join(data.room);
      urRoom = data.room;
      io.to(urRoom).emit(
        'chat',
        `username: ${data.name} joined room : ${data.room}`
      );
    }
  });

  socket.on('chat', (data) => {
    // msg is data that we sent it can be a json
    console.log(data);

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
