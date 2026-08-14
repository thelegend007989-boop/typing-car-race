const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// HTML, CSS, JS files public folder se uthane ke liye
app.use(express.static(__dirname + '/public'));

// Active rooms ka record
const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Create Room Logic
    socket.on('createRoom', () => {
        const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        socket.join(roomCode);
        rooms[roomCode] = { players: [socket.id] };
        
        socket.emit('roomCreated', roomCode);
        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    // Join Room Logic
    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode] && rooms[roomCode].players.length === 1) {
            socket.join(roomCode);
            rooms[roomCode].players.push(socket.id);
            
            io.to(roomCode).emit('gameStarted', roomCode);
            console.log(`User ${socket.id} joined Room: ${roomCode}. Race Starting!`);
        } else {
            socket.emit('roomError', 'Invalid Room Code or Room is Full!');
        }
    });

    // Typing Progress Logic
    socket.on('typingProgress', (data) => {
        socket.to(data.roomCode).emit('updateOpponent', data);
    });

    // Player Won Logic (Broadcast Game Over to opponent)
    socket.on('playerWon', (data) => {
        console.log(`Player won in room ${data.roomCode}`);
        socket.to(data.roomCode).emit('gameOver', data);
    });

    // 🔄 Play Again Logic (Restart Game for Both Players)
    socket.on('playAgain', (roomCode) => {
        io.to(roomCode).emit('restartGame', roomCode);
        console.log(`Restarting game for room: ${roomCode}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});