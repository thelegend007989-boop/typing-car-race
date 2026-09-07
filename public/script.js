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
const vsBotBtn = document.querySelector('.btn-bot');
const exitGameBtn = document.getElementById('exit-game-btn'); // Naya Exit Button

const typingInput = document.getElementById('typing-input');
const car1 = document.getElementById('car1');
const car2 = document.getElementById('car2');
const wpm1 = document.getElementById('wpm1');
const wpm2 = document.getElementById('wpm2');

// Modal Elements
const connectionHelpBtn = document.querySelector('.tag-blue'); 
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help-btn');
const gotItBtn = document.getElementById('got-it-btn');
const helpCreateBtn = document.getElementById('help-create-btn');

// Sentences just for VS Bot fallback (Multiplayer gets it from server)
const sentencesList = [
    "Push yourself because no one else is going to do it for you.",
    "Success doesn't just find you, you have to go out and get it.",
    "Dream bigger, do bigger, and never settle for anything less than your best.",
    "Hard work beats talent when talent doesn't work hard every single day.",
    "The secret of getting ahead is getting started right now without fear."
];

let textToType = "";
let currentRoom = '';
let isPlayer1 = false; 
let startTime = null;
let matchOver = false;
let myFinalWpm = 0;
let isVsBot = false;
let botInterval = null;

// ==========================================
// 🔴 EXIT BUTTON LOGIC
// ==========================================
exitGameBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to exit the game?")) {
        location.reload(); // Reloads page and returns to main menu
    }
});

// Help Popup Logic
if (connectionHelpBtn) {
    connectionHelpBtn.addEventListener('click', () => helpModal.style.display = 'flex');
    closeHelpBtn.addEventListener('click', () => helpModal.style.display = 'none');
    gotItBtn.addEventListener('click', () => helpModal.style.display = 'none');
    helpCreateBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
        createRoomBtn.click(); 
    });
}
window.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.style.display = 'none';
});

// ==========================================
// 🚀 LOBBY & ROOM LOGIC
// ==========================================
createRoomBtn.addEventListener('click', () => socket.emit('createRoom'));

socket.on('roomCreated', (roomCode) => {
    currentRoom = roomCode;
    isPlayer1 = true; 
    modeSelection.style.display = 'none';
    roomDisplay.style.display = 'block';
    myRoomCodeText.innerText = roomCode;
});

joinSubmitBtn.addEventListener('click', () => {
    const code = roomCodeInput.value.trim();
    if (code.length === 4) socket.emit('joinRoom', code);
    else alert('Bhai, code 4 digit ka hona chahiye!');
});

roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinSubmitBtn.click();
});

socket.on('roomError', (msg) => alert(msg));

// 🔥 SERVER SE AAYA SYNCED TEXT GET KARNA (Data me sentence bhi hai)
socket.on('gameStarted', (data) => {
    currentRoom = data.roomCode;
    textToType = data.sentence; // Server wala same sentence!
    document.getElementById('text-to-type').innerHTML = textToType;

    matchOver = false; 
    isVsBot = false;
    roomMenu.style.display = 'none';
    gameArea.style.display = 'block';
    
    playerStatus.innerText = "RACE STARTED! GO GO GO! 🔥";
    playerStatus.style.background = "transparent";
    playerStatus.style.color = "#D32F2F"; 
    
    typingInput.disabled = false;
    typingInput.value = '';
    typingInput.focus();
    startTime = new Date().getTime();
});

// ==========================================
// 🤖 VS BOT MODE LOGIC (Offline)
// ==========================================
vsBotBtn.addEventListener('click', () => {
    isVsBot = true;
    matchOver = false;
    roomMenu.style.display = 'none';
    gameArea.style.display = 'block';
    
    textToType = sentencesList[Math.floor(Math.random() * sentencesList.length)];
    document.getElementById('text-to-type').innerHTML = textToType;

    playerStatus.innerText = "VS BOT MODE - RACE STARTED! 🔥";
    playerStatus.style.background = "transparent";
    playerStatus.style.color = "#D32F2F"; 
    
    typingInput.disabled = false;
    typingInput.value = '';
    typingInput.focus();
    startTime = new Date().getTime();

    let botProgress = 0;
    let botWpm = Math.floor(Math.random() * (75 - 45 + 1)) + 45;

    botInterval = setInterval(() => {
        if (matchOver) return clearInterval(botInterval);

        botProgress += 1.5; 
        if (botProgress > 100) botProgress = 100;
        car2.style.left = botProgress + '%';
        wpm2.innerText = `[${botWpm} WPM]`;

        if (botProgress >= 100) {
            matchOver = true;
            clearInterval(botInterval);
            typingInput.disabled = true;
            document.getElementById('win-modal').style.display = 'flex';
            document.getElementById('win-title').innerText = "YOU LOSE! (BOT WON)";
            document.getElementById('win-title').style.color = "#D32F2F";
            document.getElementById('final-my-wpm').innerText = myFinalWpm;
            document.getElementById('final-opp-wpm').innerText = botWpm;
        }
    }, 300);
});

// ==========================================
// 🏎️ TYPING ENGINE & HIGHLIGHT LOGIC
// ==========================================
typingInput.addEventListener('input', () => {
    if (matchOver) return; 
    
    const typedText = typingInput.value;
    
    // 🎨 Live Blue Highlight Logic! 
    let matchCount = 0;
    for (let i = 0; i < typedText.length; i++) {
        if (typedText[i] === textToType[i]) matchCount++;
        else break; // Rukk jao jaha pehli galti ho
    }
    
    const matchedStr = textToType.substring(0, matchCount);
    const remainStr = textToType.substring(matchCount);
    // Background blue set ho jayega typed text par
    document.getElementById('text-to-type').innerHTML = `<span style="background: #33e1ff; color: #000; border-radius: 3px;">${matchedStr}</span>${remainStr}`;

    const cleanTyped = typedText.trim();
    const cleanTarget = textToType.trim();
    
    if (cleanTarget.startsWith(cleanTyped)) {
        typingInput.style.borderColor = 'green';
        typingInput.style.background = '#e8f8f5';
        
        const progress = (typedText.length / textToType.length) * 100;
        const timeElapsed = (new Date().getTime() - startTime) / 60000;
        const wordsTyped = typedText.length / 5;
        myFinalWpm = Math.round(wordsTyped / timeElapsed) || 0;

        if (isVsBot || isPlayer1) {
            car1.style.left = progress + '%';
            wpm1.innerText = `[${myFinalWpm} WPM]`;
        } else {
            car2.style.left = progress + '%';
            wpm2.innerText = `[${myFinalWpm} WPM]`;
        }

        if (!isVsBot) {
            socket.emit('typingProgress', { 
                roomCode: currentRoom, progress: progress, wpm: myFinalWpm, isPlayer1: isPlayer1 
            });
        }

        if (cleanTyped === cleanTarget || progress >= 99) {
            matchOver = true;
            typingInput.disabled = true;
            if (isVsBot && botInterval) clearInterval(botInterval);
            
            document.getElementById('win-modal').style.display = 'flex';
            document.getElementById('win-title').innerText = "YOU WIN!";
            document.getElementById('win-title').style.color = "#000";
            document.getElementById('final-my-wpm').innerText = myFinalWpm;
            document.getElementById('final-opp-wpm').innerText = isVsBot ? "Bot Failed" : "0"; 
            
            if (!isVsBot) socket.emit('playerWon', { roomCode: currentRoom, wpm: myFinalWpm });
        }
    } else {
        typingInput.style.borderColor = 'red';
        typingInput.style.background = '#fdedec';
    }
});

socket.on('updateOpponent', (data) => {
    if (matchOver || isVsBot) return;
    if (isPlayer1 && !data.isPlayer1) {
        car2.style.left = data.progress + '%';
        wpm2.innerText = `[${data.wpm} WPM]`;
    } 
    else if (!isPlayer1 && data.isPlayer1) {
        car1.style.left = data.progress + '%';
        wpm1.innerText = `[${data.wpm} WPM]`;
    }
});

socket.on('gameOver', (data) => {
    if (matchOver || isVsBot) return;
    matchOver = true;
    typingInput.disabled = true;

    document.getElementById('win-modal').style.display = 'flex';
    document.getElementById('win-title').innerText = "YOU LOSE!";
    document.getElementById('win-title').style.color = "#D32F2F";
    document.getElementById('final-my-wpm').innerText = myFinalWpm;
    document.getElementById('final-opp-wpm').innerText = data.wpm;
});

function restartGame() {
    if (isVsBot) {
        document.getElementById('win-modal').style.display = 'none';
        vsBotBtn.click();
    } else {
        socket.emit('playAgain', currentRoom);
    }
}

// Server restart par naya synced sentence bhejega
socket.on('restartGame', (data) => {
    if (isVsBot) return;
    document.getElementById('win-modal').style.display = 'none';
    matchOver = false;
    startTime = new Date().getTime();
    
    textToType = data.sentence; 
    document.getElementById('text-to-type').innerHTML = textToType;

    car1.style.left = '0%';
    car2.style.left = '0%';
    wpm1.innerText = '[0 WPM]';
    wpm2.innerText = '[0 WPM]';
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.style.borderColor = '#000';
    typingInput.style.background = '#fff';
    typingInput.focus();
});