// DOM元素
const clockElement = document.getElementById('clock');
const dateDisplay = document.getElementById('dateDisplay');
const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');
const chatDialog = document.getElementById('chatDialog');
const closeDialog = document.getElementById('closeDialog');
const roomInput = document.getElementById('roomInput');
const joinRoom = document.getElementById('joinRoom');
const chatRoom = document.getElementById('chatRoom');
const roomName = document.getElementById('roomName');
const leaveRoom = document.getElementById('leaveRoom');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessage = document.getElementById('sendMessage');
const backgroundContainer = document.querySelector('.background-container');

// 长按相关变量
let longPressTimer;
let isLongPress = false;

// 聊天数据
let currentRoom = '';
let mockMessages = {};
// 生成唯一用户ID和用户名
let userId = localStorage.getItem('chatUserId') || generateUniqueId();
let username = localStorage.getItem('chatUsername') || ('用户' + Math.floor(Math.random() * 1000));

// 保存用户ID和用户名
localStorage.setItem('chatUserId', userId);
localStorage.setItem('chatUsername', username);

// 随机高清背景图片数组（来自Unsplash）
const backgroundImages = [
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1476842634003-7dcca8f832de?auto=format&fit=crop&q=80&w=2070',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=2070'
];

// 生成唯一ID
function generateUniqueId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 初始化随机背景
function initBackground() {
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    backgroundContainer.style.backgroundImage = `url('${randomImage}')`;
}

// 更新指针时钟
function updateClock() {
    const now = new Date();
    
    // 计算指针角度
    const secondsRatio = now.getSeconds() / 60;
    const minutesRatio = (secondsRatio + now.getMinutes()) / 60;
    const hoursRatio = (minutesRatio + now.getHours()) / 12;
    
    // 设置指针旋转
    setRotation(secondHand, secondsRatio);
    setRotation(minuteHand, minutesRatio);
    setRotation(hourHand, hoursRatio);
    
    // 格式化日期
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 更新日期显示
    dateDisplay.textContent = `${year}-${month}-${day}`;
}

// 设置指针旋转角度
function setRotation(element, rotationRatio) {
    element.style.setProperty('--rotation', rotationRatio * 360);
}

// 开始长按计时器
function startLongPressTimer() {
    isLongPress = false;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
        isLongPress = true;
        chatDialog.classList.remove('hidden');
        clockElement.classList.add('long-press-active');
        setTimeout(() => clockElement.classList.remove('long-press-active'), 500);
    }, 2000);
}

// 取消长按计时器
function cancelLongPressTimer() {
    clearTimeout(longPressTimer);
}

// 从localStorage加载聊天记录
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('chatAppData');
    if (savedData) {
        const data = JSON.parse(savedData);
        mockMessages = data.messages || {};
    }
}

// 保存聊天记录到localStorage
function saveToLocalStorage() {
    const data = {
        messages: mockMessages,
        lastUpdated: Date.now()
    };
    localStorage.setItem('chatAppData', JSON.stringify(data));
}

// 加入聊天室
function enterChatRoom(room) {
    if (!room || !room.startsWith('#')) {
        roomInput.classList.add('input-error');
        setTimeout(() => roomInput.classList.remove('input-error'), 1000);
        return;
    }
    
    currentRoom = room;
    roomName.textContent = currentRoom;
    chatDialog.classList.add('hidden');
    chatRoom.classList.remove('hidden');
    loadChatMessages();
    messageInput.focus();
}

// 加载聊天记录
function loadChatMessages() {
    chatMessages.innerHTML = '';
    
    if (!mockMessages[currentRoom]) {
        mockMessages[currentRoom] = [];
    }
    
    // 显示所有消息
    mockMessages[currentRoom].forEach(msg => {
        addMessage(msg.userId, msg.username, msg.text);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加消息（区分自己和他人）
function addMessage(senderId, senderName, text) {
    const messageElement = document.createElement('div');
    const isOwnMessage = senderId === userId;
    
    messageElement.classList.add('message');
    messageElement.classList.add(isOwnMessage ? 'own-message' : 'other-message');
    
    if (isOwnMessage) {
        messageElement.innerHTML = `<div class="message-content">${text}</div>`;
    } else {
        messageElement.innerHTML = `<div class="message-user">${senderName}</div><div class="message-content">${text}</div>`;
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 发送消息
function sendChatMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentRoom) return;
    
    // 保存消息
    if (!mockMessages[currentRoom]) {
        mockMessages[currentRoom] = [];
    }
    
    mockMessages[currentRoom].push({ 
        userId: userId, 
        username: username, 
        text: text,
        timestamp: Date.now()
    });
    
    // 保存到localStorage并触发存储事件
    saveToLocalStorage();
    
    // 手动触发存储事件以便在当前标签页也能更新
    triggerStorageEvent();
    
    // 清空输入框并添加发送动画
    messageInput.value = '';
    sendMessage.classList.add('sending');
    setTimeout(() => sendMessage.classList.remove('sending'), 300);
}

// 触发存储事件
function triggerStorageEvent() {
    const event = new Event('storage');
    event.key = 'chatAppData';
    event.newValue = localStorage.getItem('chatAppData');
    window.dispatchEvent(event);
}

// 处理存储事件，实现实时同步
function handleStorageEvent(e) {
    if (e.key === 'chatAppData' && e.newValue) {
        try {
            const data = JSON.parse(e.newValue);
            mockMessages = data.messages || {};
            
            // 如果当前在聊天室中，更新聊天记录
            if (currentRoom) {
                loadChatMessages();
            }
        } catch (error) {
            console.error('Failed to parse storage data:', error);
        }
    }
}

// 事件监听器
clockElement.addEventListener('mousedown', startLongPressTimer);
clockElement.addEventListener('mouseup', cancelLongPressTimer);
clockElement.addEventListener('mouseleave', cancelLongPressTimer);
clockElement.addEventListener('touchstart', startLongPressTimer, { passive: true });
clockElement.addEventListener('touchend', cancelLongPressTimer);
clockElement.addEventListener('touchmove', cancelLongPressTimer);

closeDialog.addEventListener('click', () => chatDialog.classList.add('hidden'));

joinRoom.addEventListener('click', () => {
    enterChatRoom(roomInput.value.trim());
    roomInput.value = '';
});

roomInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        enterChatRoom(roomInput.value.trim());
        roomInput.value = '';
    }
});

leaveRoom.addEventListener('click', () => {
    chatRoom.classList.add('hidden');
    currentRoom = '';
});

sendMessage.addEventListener('click', sendChatMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// 添加存储事件监听器，实现标签页间实时同步
window.addEventListener('storage', handleStorageEvent);

// 初始化
initBackground();
loadFromLocalStorage();
updateClock();
setInterval(updateClock, 1000);