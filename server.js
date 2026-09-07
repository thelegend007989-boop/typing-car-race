const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

const rooms = {};

// 📝 Sentences list for Multiplayer Sync
const sentencesList = [
    "Push yourself because no one else is going to do it for you.",
    "Success doesn't just find you, you have to go out and get it.",
    "Dream bigger, do bigger, and never settle for anything less than your best.",
    "Hard work beats talent when talent doesn't work hard every single day.",
    "The secret of getting ahead is getting started right now without fear.",
    "Don't watch the clock; do what it does, keep going forward endlessly.",
    "Great things never come from staying inside your comfort zone.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Believe in yourself and all that you are capable of achieving.",
    "Your limitation—it's only your imagination holding you back from greatness.",
    "Ganpat University is the best place to learn computer engineering and build awesome projects.",
    "Web development is an amazing skill that allows you to create applications for the whole world.",
    "JavaScript powers the interactive parts of the web and makes modern websites come alive.",
    "Practice typing every day to increase your speed and become a professional programmer.",
    "Coding is not just about writing syntax, it is about solving complex real-world problems.",
    "Artificial intelligence and machine learning are shaping the future of modern technology.",
    "Building multiplayer games using socket io is a fantastic way to understand networking.",
    "Always write clean, readable code so that other developers can understand it easily.",
    "Success in programming comes from consistent practice and never giving up on errors.",
    "Full stack developers master both frontend interfaces and backend server logic seamlessly.",
    "Debugging is like being a detective in a crime movie where you are also the murderer.",
    "Technology is best when it brings people together and solves meaningful daily challenges.",
    "Cloud computing allows developers to deploy applications globally with high availability.",
    "A clean workspace and a focused mind are the true secret weapons of a great coder.",
    "Consistency beats talent when talent doesn't work hard enough on building projects."
];

// Helper to pick random sentence
function getRandomSentence() {
    return sentencesList[Math.floor(Math.random() * sentencesList.length)];
}

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
            
            const sentence = getRandomSentence(); // Server picks 1 common sentence
            io.to(roomCode).emit('gameStarted', { roomCode, sentence });
            console.log(`User ${socket.id} joined Room: ${roomCode}. Race Starting!`);
        } else {
            socket.emit('roomError', 'Invalid Room Code or Room is Full!');
        }
    });

    // Typing Progress Logic
    socket.on('typingProgress', (data) => {
        socket.to(data.roomCode).emit('updateOpponent', data);
    });

    // Player Won Logic
    socket.on('playerWon', (data) => {
        console.log(`Player won in room ${data.roomCode}`);
        socket.to(data.roomCode).emit('gameOver', data);
    });

    // 🔄 Play Again Logic
    socket.on('playAgain', (roomCode) => {
        const sentence = getRandomSentence(); // Sync new sentence for restart
        io.to(roomCode).emit('restartGame', { roomCode, sentence });
        console.log(`Restarting game for room: ${roomCode}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});