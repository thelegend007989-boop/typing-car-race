const socket = io();

// 🎮 DOM Elements
const modeSelection = document.getElementById('mode-selection');
const roomDisplay = document.getElementById('room-display');
const roomMenu = document.getElementById('room-menu');
const gameArea = document.getElementById('game-area');

const createRoomBtn = document.getElementById('create-room-btn');
const joinSubmitBtn = document.getElementById('join-room-btn');
const roomCodeInput = document.getElementById('room-code-input');
const myRoomCodeText = document.getElementById('my-room-code');
const playerStatus = document.getElementById('player-status');

const typingInput = document.getElementById('typing-input');
const textToType = document.getElementById('text-to-type').innerText;
const car1 = document.getElementById('car1');
const car2 = document.getElementById('car2');
const wpm1 = document.getElementById('wpm1');
const wpm2 = document.getElementById('wpm2');

let currentRoom = '';
let isPlayer1 = false; 
let startTime = null;
let matchOver = false;
let myFinalWpm = 0;

// ==========================================
// 🚀 1. LOBBY & ROOM LOGIC
// ==========================================

createRoomBtn.addEventListener('click', () => {
    socket.emit('createRoom');
});

socket.on('roomCreated', (roomCode) => {
    currentRoom = roomCode;
    isPlayer1 = true; 
    
    modeSelection.style.display = 'none';
    roomDisplay.style.display = 'block';
    myRoomCodeText.innerText = roomCode;
});

joinSubmitBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    if (code.length === 4) {
        socket.emit('joinRoom', code);
    } else {
        alert('Bhai, code 4 digit ka hona chahiye!');
    }
});

roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinSubmitBtn.click();
    }
});

socket.on('roomError', (msg) => {
    alert(msg);
});

socket.on('gameStarted', (roomCode) => {
    currentRoom = roomCode;
    matchOver = false; // Fresh start
    
    roomMenu.style.display = 'none';
    gameArea.style.display = 'block';
    
    playerStatus.innerText = "RACE STARTED! GO GO GO! 🔥";
    playerStatus.style.background = "transparent";
    playerStatus.style.color = "#D32F2F"; 
    playerStatus.style.textShadow = "none";
    playerStatus.style.border = "none";
    playerStatus.style.fontFamily = "'Segoe UI', Tahoma, sans-serif";
    playerStatus.style.fontWeight = "700";
    playerStatus.style.fontSize = "22px";
    
    typingInput.disabled = false;
    typingInput.value = '';
    typingInput.focus();
    startTime = new Date().getTime();
});

// ==========================================
// 🏎️ 2. GAMEPLAY & PROGRESS LOGIC
// ==========================================

typingInput.addEventListener('input', () => {
    if (matchOver) return; // Agar match khatam ho gaya toh kuch mat karo
    
    const typedText = typingInput.value;
    const cleanTyped = typedText.trim();
    const cleanTarget = textToType.trim();
    
    if (cleanTarget.startsWith(cleanTyped)) {
        typingInput.style.borderColor = 'green';
        typingInput.style.background = '#e8f8f5';
        
        const progress = (typedText.length / textToType.length) * 100;
        const timeElapsed = (new Date().getTime() - startTime) / 60000;
        const wordsTyped = typedText.length / 5;
        myFinalWpm = Math.round(wordsTyped / timeElapsed) || 0;

        if (isPlayer1) {
            car1.style.left = progress + '%';
            wpm1.innerText = `[${myFinalWpm} WPM]`;
        } else {
            car2.style.left = progress + '%';
            wpm2.innerText = `[${myFinalWpm} WPM]`;
        }

        socket.emit('typingProgress', { 
            roomCode: currentRoom, 
            progress: progress, 
            wpm: myFinalWpm, 
            isPlayer1: isPlayer1 
        });

        // 🏆 WIN CONDITION (Aap jeet gaye)
        if (cleanTyped === cleanTarget || progress >= 99) {
            matchOver = true;
            typingInput.disabled = true;
            
            // Show Win Popup
            document.getElementById('win-modal').style.display = 'flex';
            document.getElementById('win-title').innerText = "YOU WIN!";
            document.getElementById('win-title').style.color = "#000";
            document.getElementById('final-my-wpm').innerText = myFinalWpm;
            document.getElementById('final-opp-wpm').innerText = "0"; 
            
            // Server ko batao ki aap jeet gaye ho taaki wo opponent ko rokk sake
            socket.emit('playerWon', { roomCode: currentRoom, wpm: myFinalWpm });
        }

    } else {
        typingInput.style.borderColor = 'red';
        typingInput.style.background = '#fdedec';
    }
});

socket.on('updateOpponent', (data) => {
    if (matchOver) return;
    if (isPlayer1 && !data.isPlayer1) {
        car2.style.left = data.progress + '%';
        wpm2.innerText = `[${data.wpm} WPM]`;
    } 
    else if (!isPlayer1 && data.isPlayer1) {
        car1.style.left = data.progress + '%';
        wpm1.innerText = `[${data.wpm} WPM]`;
    }
});

// 🏁 LUZER / GAME OVER CONDITION (Jab opponent pehle jeet jaye)
socket.on('gameOver', (data) => {
    if (matchOver) return;
    matchOver = true;
    typingInput.disabled = true;

    // Show Lose Popup
    document.getElementById('win-modal').style.display = 'flex';
    document.getElementById('win-title').innerText = "YOU LOSE!";
    document.getElementById('win-title').style.color = "#D32F2F";
    
    document.getElementById('final-my-wpm').innerText = myFinalWpm;
    document.getElementById('final-opp-wpm').innerText = data.wpm;
});

// ==========================================
// 🔄 3. PLAY AGAIN LOGIC
// ==========================================

function restartGame() {
    socket.emit('playAgain', currentRoom);
}

// Server se jab restart signal milega
socket.on('restartGame', () => {
    // Popup chupao
    document.getElementById('win-modal').style.display = 'none';
    
    // Reset variables
    matchOver = false;
    startTime = new Date().getTime();
    
    // Reset Cars & WPM
    car1.style.left = '0%';
    car2.style.left = '0%';
    wpm1.innerText = '[0 WPM]';
    wpm2.innerText = '[0 WPM]';
    
    // Clear and enable input
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.style.borderColor = '#000';
    typingInput.style.background = '#fff';
    typingInput.focus();
});