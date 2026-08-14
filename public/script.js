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

const typingInput = document.getElementById('typing-input');
const car1 = document.getElementById('car1');
const car2 = document.getElementById('car2');
const wpm1 = document.getElementById('wpm1');
const wpm2 = document.getElementById('wpm2');

// 💡 Connection Help Modal Elements
const connectionHelpBtn = document.querySelector('.tag-blue'); 
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help-btn');
const gotItBtn = document.getElementById('got-it-btn');
const helpCreateBtn = document.getElementById('help-create-btn');

// 📝 MOTIVATION & SUCCESS SENTENCES LIST (25+ Sentences)
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

let textToType = "";
let currentRoom = '';
let isPlayer1 = false; 
let startTime = null;
let matchOver = false;
let myFinalWpm = 0;
let isVsBot = false;
let botInterval = null;

// Helper function to pick a random sentence
function setNewSentence() {
    textToType = sentencesList[Math.floor(Math.random() * sentencesList.length)];
    document.getElementById('text-to-type').innerText = textToType;
}

// ==========================================
// 💡 CONNECTION HELP MODAL LOGIC
// ==========================================

if (connectionHelpBtn) {
    connectionHelpBtn.style.cursor = 'pointer';
    connectionHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });
}

if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
}

if (gotItBtn) {
    gotItBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
}

if (helpCreateBtn) {
    helpCreateBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
        createRoomBtn.click(); 
    });
}

window.addEventListener('click', (e) => {
    if (e.target === helpModal) {
        helpModal.style.display = 'none';
    }
});

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
    matchOver = false; 
    isVsBot = false;
    
    roomMenu.style.display = 'none';
    gameArea.style.display = 'block';
    
    setNewSentence();

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
// 🤖 2. VS BOT MODE LOGIC
// ==========================================

vsBotBtn.addEventListener('click', () => {
    isVsBot = true;
    matchOver = false;
    
    roomMenu.style.display = 'none';
    gameArea.style.display = 'block';
    
    setNewSentence();

    playerStatus.innerText = "VS BOT MODE - RACE STARTED! 🔥";
    playerStatus.style.background = "transparent";
    playerStatus.style.color = "#D32F2F"; 
    playerStatus.style.fontFamily = "'Segoe UI', Tahoma, sans-serif";
    playerStatus.style.fontWeight = "700";
    playerStatus.style.fontSize = "22px";
    
    typingInput.disabled = false;
    typingInput.value = '';
    typingInput.focus();
    startTime = new Date().getTime();

    let botProgress = 0;
    let botWpm = Math.floor(Math.random() * (75 - 45 + 1)) + 45;

    botInterval = setInterval(() => {
        if (matchOver) {
            clearInterval(botInterval);
            return;
        }

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
// 🏎️ 3. GAMEPLAY & PROGRESS LOGIC
// ==========================================

typingInput.addEventListener('input', () => {
    if (matchOver) return; 
    
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

        if (isVsBot) {
            car1.style.left = progress + '%';
            wpm1.innerText = `[${myFinalWpm} WPM]`;
        } else if (isPlayer1) {
            car1.style.left = progress + '%';
            wpm1.innerText = `[${myFinalWpm} WPM]`;
        } else {
            car2.style.left = progress + '%';
            wpm2.innerText = `[${myFinalWpm} WPM]`;
        }

        if (!isVsBot) {
            socket.emit('typingProgress', { 
                roomCode: currentRoom, 
                progress: progress, 
                wpm: myFinalWpm, 
                isPlayer1: isPlayer1 
            });
        }

        // 🏆 WIN CONDITION
        if (cleanTyped === cleanTarget || progress >= 99) {
            matchOver = true;
            typingInput.disabled = true;
            if (isVsBot && botInterval) clearInterval(botInterval);
            
            document.getElementById('win-modal').style.display = 'flex';
            document.getElementById('win-title').innerText = "YOU WIN!";
            document.getElementById('win-title').style.color = "#000";
            document.getElementById('final-my-wpm').innerText = myFinalWpm;
            document.getElementById('final-opp-wpm').innerText = isVsBot ? (botWpm > 0 ? "50" : "0") : "0"; 
            
            if (!isVsBot) {
                socket.emit('playerWon', { roomCode: currentRoom, wpm: myFinalWpm });
            }
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

// ==========================================
// 🔄 4. PLAY AGAIN LOGIC
// ==========================================

function restartGame() {
    if (isVsBot) {
        document.getElementById('win-modal').style.display = 'none';
        vsBotBtn.click();
    } else {
        socket.emit('playAgain', currentRoom);
    }
}

socket.on('restartGame', () => {
    if (isVsBot) return;
    document.getElementById('win-modal').style.display = 'none';
    
    matchOver = false;
    startTime = new Date().getTime();
    
    setNewSentence();

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