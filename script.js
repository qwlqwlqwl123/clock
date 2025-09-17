// 获取DOM元素
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const dayElement = document.getElementById('day');
const clockContainer = document.getElementById('clock-container');
const inputContainer = document.getElementById('input-container');
const chatContainer = document.getElementById('chat-container');
const roomNumberElement = document.getElementById('room-number');
const currentRoomElement = document.getElementById('current-room');
const messagesElement = document.getElementById('messages');
const messageInputElement = document.getElementById('message-input');
const backToClockButton = document.getElementById('back-to-clock');
const leaveChatButton = document.getElementById('leave-chat');
const sendMessageButton = document.getElementById('send-message');
const keys = document.querySelectorAll('.key');

// 定义星期几的中文名称
const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

// 全局变量
let longPressTimer;
let currentRoomNumber = '000000';
let currentUserName = `用户${Math.floor(Math.random() * 10000)}`;
let currentUserGender = 'male';
let currentUserRegion = '北京';
let currentUserAge = 25;
let currentUserAvatar = '';
let chatMessages = {};
let goEasy;
let currentChannel = null;

// DOM元素
const userInfoContainer = document.getElementById('user-info-container');
const userNameInput = document.getElementById('user-name');
const genderInputs = document.querySelectorAll('input[name="gender"]');
const userRegionSelect = document.getElementById('user-region');
const userAgeInput = document.getElementById('user-age');
const userAvatarImg = document.getElementById('user-avatar');
const changeAvatarBtn = document.getElementById('change-avatar-btn');
const saveUserInfoBtn = document.getElementById('save-user-info-btn');

// 获取用户设备地域
function getUserRegion() {
    // 使用第三方IP地址查询服务获取用户地域
    // 这里使用ipapi.co服务，它提供免费的IP地理位置查询
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            if (data.city) {
                // 映射常见城市到预设的选项中
                const cityMap = {
                    '北京': '北京',
                    '上海': '上海',
                    '广州': '广州',
                    '深圳': '深圳',
                    '杭州': '杭州',
                    '南京': '南京',
                    '成都': '成都',
                    '武汉': '武汉'
                };
                
                // 转换为中文城市名称（如果需要）
                let city = data.city;
                // 尝试匹配预设城市
                for (const [key, value] of Object.entries(cityMap)) {
                    if (city.includes(key) || key.includes(city)) {
                        currentUserRegion = value;
                        if (userRegionSelect) {
                            userRegionSelect.value = value;
                        }
                        break;
                    }
                }
                
                console.log('自动获取到的地域:', currentUserRegion);
            }
        })
        .catch(error => {
            console.log('获取用户地域失败:', error);
            // 如果获取失败，保持默认值
        });
}

// 生成随机头像
function generateRandomAvatar(gender) {
    // 使用用户指定的头像API
    const API_KEY = '771jPhkLN8VhSUOwOs6Iex0vRe';
    const API_URL = 'https://api.t1qq.com/api/tool/sjtx';
    
    // 生成带随机参数的URL
    const randomSeed = Math.floor(Math.random() * 10000);
    
    // 构建API请求URL（根据性别区分）
    const apiUrl = `${API_URL}?key=${API_KEY}&random=${randomSeed}&gender=${gender}`;
    
    // 由于API可能不可用，添加后备头像方案
    const fallbackAvatar = gender === 'male' 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=male${randomSeed}` 
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=female${randomSeed}`;
    
    // 验证API是否可用，如果不可用则使用后备头像
    validateAvatarApi(apiUrl, fallbackAvatar).then(validUrl => {
        currentUserAvatar = validUrl;
        if (userAvatarImg) {
            userAvatarImg.src = validUrl;
        }
    });
    
    // 返回API URL，同时异步验证可用性
    return apiUrl;
}

// 验证头像API是否可用
function validateAvatarApi(apiUrl, fallbackUrl) {
    return new Promise((resolve) => {
        // 创建图片对象来测试URL是否可用
        const img = new Image();
        
        img.onload = function() {
            // 如果图片加载成功，使用API URL
            resolve(apiUrl);
        };
        
        img.onerror = function() {
            // 如果图片加载失败，使用后备URL
            console.log('头像API不可用，使用后备头像');
            resolve(fallbackUrl);
        };
        
        // 设置超时，防止长时间等待
        setTimeout(() => {
            console.log('头像API请求超时，使用后备头像');
            resolve(fallbackUrl);
        }, 2000);
        
        // 开始加载图片
        img.src = apiUrl;
    });
}

// 初始化GoEasy
function initGoEasy() {
    // 创建GoEasy实例 - 注意：实际使用时需要替换为您自己的appkey
    // 使用getInstance()方法创建实例，这与GoEasy 2.8.8版本兼容
    goEasy = GoEasy.getInstance({
        host: "hangzhou.goeasy.io", // GoEasy服务器地址
        appkey: "BC-c438cf76314946cba2dead37823389fa", // 这是一个示例appkey，实际使用时需要替换为您自己的
        modules: ['pubsub'] // 明确声明使用pubsub模块
    });
    
    // 建立连接
    goEasy.connect({
        onSuccess: function() {
            console.log('GoEasy连接成功');
        },
        onFailed: function(error) {
            console.log('GoEasy连接失败:', error);
        }
    });
}

// 更新时间函数
function updateClock() {
    // 获取当前时间
    const now = new Date();
    
    // 格式化时间 - 确保两位数
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // 格式化日期
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始
    const date = String(now.getDate()).padStart(2, '0');
    
    // 获取星期几
    const day = weekDays[now.getDay()];
    
    // 更新DOM元素
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    dateElement.textContent = `${year}-${month}-${date}`;
    dayElement.textContent = day;
}

// 长按开始事件
function handleLongPressStart() {
    longPressTimer = setTimeout(() => {
        showInputScreen();
    }, 1000); // 1秒长按触发
}

// 长按结束事件
function handleLongPressEnd() {
    clearTimeout(longPressTimer);
}

// 显示数字输入界面
function showInputScreen() {
    clockContainer.classList.add('hidden');
    inputContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    resetRoomNumber();
}

// 显示时钟界面
function showClockScreen() {
    clockContainer.classList.remove('hidden');
    inputContainer.classList.add('hidden');
    chatContainer.classList.add('hidden');
}

// 显示聊天室界面
function showChatScreen(roomNumber) {
    currentRoomNumber = roomNumber;
    currentRoomElement.textContent = roomNumber;
    
    clockContainer.classList.add('hidden');
    inputContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // 加载本地聊天室消息
    loadChatMessages(roomNumber);
    
    // 取消之前的订阅
    if (currentChannel) {
        goEasy.pubsub.unsubscribe({
            channel: currentChannel,
            onSuccess: function() {
                console.log('成功取消之前的订阅:', currentChannel);
            },
            onFailed: function(error) {
                console.log('取消之前的订阅失败:', error);
            }
        });
    }
    
    // 设置当前频道并订阅
    currentChannel = `chat_room_${roomNumber}`;
    goEasy.pubsub.subscribe({
        channel: currentChannel,
        onMessage: function(message) {
            // 接收到新消息
            const msgData = JSON.parse(message.content);
            
            // 只处理非自己发送的消息（自己发送的消息在publish成功后已经处理）
            if (msgData.user !== currentUserName) {
                // 添加消息到数组
                if (!chatMessages[currentRoomNumber]) {
                    chatMessages[currentRoomNumber] = [];
                }
                chatMessages[currentRoomNumber].push(msgData);
                
                // 保存并显示消息
                saveChatMessages(currentRoomNumber);
                displayMessages(currentRoomNumber);
            }
        },
        onSuccess: function() {
            console.log('成功订阅频道:', currentChannel);
            
            // 发送加入房间的通知
            sendRoomNotification('加入了聊天室');
        },
        onFailed: function(error) {
            console.log('订阅频道失败:', error);
        }
    });
    
    // 清空输入框
    messageInputElement.value = '';
    // 聚焦输入框
    messageInputElement.focus();
}

// 发送房间通知
function sendRoomNotification(action) {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const notification = {
        user: '系统',
        text: `${currentUserName} ${action}`,
        time: timeString,
        timestamp: now.getTime(),
        isNotification: true,
        avatar: '' // 系统通知没有头像
    };
    
    // 发送通知到频道
    goEasy.pubsub.publish({
        channel: currentChannel,
        message: JSON.stringify(notification),
        onSuccess: function() {
            console.log('通知发送成功');
        },
        onFailed: function(error) {
            console.log('通知发送失败:', error);
        }
    });
}

// 重置房间号
function resetRoomNumber() {
    currentRoomNumber = '000000';
    roomNumberElement.textContent = currentRoomNumber;
}

// 更新房间号显示
function updateRoomNumber(digit) {
    // 如果已经是6位数字，则替换最后一位
    if (currentRoomNumber.length >= 6) {
        currentRoomNumber = currentRoomNumber.substring(1) + digit;
    } else {
        // 否则添加新数字
        currentRoomNumber = currentRoomNumber.substring(currentRoomNumber.length - Math.min(currentRoomNumber.length, 5)) + digit;
        // 确保是6位数字
        currentRoomNumber = currentRoomNumber.padStart(6, '0');
    }
    roomNumberElement.textContent = currentRoomNumber;
}

// 显示用户信息设置界面
function showUserInfoScreen() {
    inputContainer.classList.add('hidden');
    userInfoContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    
    // 初始化表单值
    userNameInput.value = currentUserName;
    userRegionSelect.value = currentUserRegion;
    userAgeInput.value = currentUserAge;
    
    // 设置性别单选按钮
    genderInputs.forEach(input => {
        if (input.value === currentUserGender) {
            input.checked = true;
        }
    });
    
    // 生成并显示头像
    if (!currentUserAvatar) {
        generateRandomAvatar(currentUserGender);
    } else {
        userAvatarImg.src = currentUserAvatar;
    }
    
    // 尝试自动获取用户地域
    getUserRegion();
}

// 处理数字按键点击
function handleKeyPress(value) {
    switch(value) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            updateRoomNumber(value);
            break;
        case 'clear':
            resetRoomNumber();
            break;
        case 'enter':
            if (currentRoomNumber.length === 6 && /^\d+$/.test(currentRoomNumber)) {
                // 先进入用户信息设置界面，而不是直接进入聊天室
                showUserInfoScreen();
            }
            break;
    }
}

// 保存用户信息
function saveUserInfo() {
    // 获取并保存用户信息
    const userName = userNameInput.value.trim();
    if (userName) {
        currentUserName = userName;
    }
    
    // 获取选中的性别
    const selectedGender = document.querySelector('input[name="gender"]:checked').value;
    if (selectedGender !== currentUserGender) {
        currentUserGender = selectedGender;
        // 如果性别改变，生成新的头像
        generateRandomAvatar(currentUserGender);
    }
    
    // 获取地域和年龄
    currentUserRegion = userRegionSelect.value;
    const userAge = parseInt(userAgeInput.value);
    if (!isNaN(userAge) && userAge >= 1 && userAge <= 120) {
        currentUserAge = userAge;
    }
}

// 设置性别选择事件监听
function setupGenderListeners() {
    genderInputs.forEach(input => {
        input.addEventListener('change', function() {
            // 当性别改变时，更新用户头像
            currentUserGender = this.value;
            generateRandomAvatar(currentUserGender);
        });
    });
}

// 设置随机更换头像按钮事件监听
function setupChangeAvatarListener() {
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            // 获取当前选中的性别
            const selectedGender = document.querySelector('input[name="gender"]:checked').value;
            // 生成新的随机头像
            generateRandomAvatar(selectedGender);
        });
    }
}

// 设置保存用户信息按钮事件监听
function setupSaveUserInfoListener() {
    if (saveUserInfoBtn) {
        saveUserInfoBtn.addEventListener('click', function() {
            // 保存用户信息
            saveUserInfo();
            // 进入聊天室
            showChatScreen(currentRoomNumber);
        });
    }
}

// 加载聊天室消息
function loadChatMessages(roomNumber) {
    // 从本地存储获取消息
    const storedMessages = localStorage.getItem(`chat_${roomNumber}`);
    if (storedMessages) {
        chatMessages[roomNumber] = JSON.parse(storedMessages);
    } else {
        chatMessages[roomNumber] = [];
    }
    
    // 显示消息
    displayMessages(roomNumber);
}

// 保存聊天室消息
function saveChatMessages(roomNumber) {
    if (chatMessages[roomNumber]) {
        localStorage.setItem(`chat_${roomNumber}`, JSON.stringify(chatMessages[roomNumber]));
    }
}

// 显示消息
function displayMessages(roomNumber) {
    messagesElement.innerHTML = '';
    const messages = chatMessages[roomNumber] || [];
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (message.isNotification) {
            messageElement.classList.add('notification');
            const timeElement = document.createElement('div');
            timeElement.classList.add('time');
            timeElement.textContent = message.time;
            
            const contentElement = document.createElement('div');
            contentElement.textContent = message.text;
            
            messageElement.appendChild(timeElement);
            messageElement.appendChild(contentElement);
        } else {
            // 检查是否是自己发送的消息
            const isOwnMessage = message.user === currentUserName;
            if (isOwnMessage) {
                messageElement.classList.add('own-message');
            } else {
                messageElement.classList.add('other-message');
            }
            
            // 创建头像元素
            const avatarElement = document.createElement('img');
            avatarElement.classList.add('message-avatar');
            
            // 设置头像源
            if (message.avatar) {
                avatarElement.src = message.avatar;
            } else if (isOwnMessage) {
                avatarElement.src = currentUserAvatar;
            } else {
                // 为其他用户生成默认头像
                avatarElement.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user}`;
            }
            
            avatarElement.alt = `${message.user}'s avatar`;
            
            // 创建消息内容容器
            const contentElement = document.createElement('div');
            contentElement.classList.add('message-content');
            
            // 添加发送者和时间
            const senderElement = document.createElement('div');
            senderElement.classList.add('sender');
            senderElement.textContent = message.user;
            
            const timeElement = document.createElement('div');
            timeElement.classList.add('time');
            timeElement.textContent = message.time;
            
            // 添加消息头部
            const headerElement = document.createElement('div');
            headerElement.classList.add('message-header');
            headerElement.appendChild(senderElement);
            headerElement.appendChild(timeElement);
            
            // 添加消息文本
            const textElement = document.createElement('div');
            textElement.classList.add('message-text');
            textElement.textContent = message.text;
            
            // 组装消息内容
            contentElement.appendChild(headerElement);
            contentElement.appendChild(textElement);
            
            // 添加头像和内容到消息元素
            if (isOwnMessage) {
                messageElement.appendChild(contentElement);
                messageElement.appendChild(avatarElement);
            } else {
                messageElement.appendChild(avatarElement);
                messageElement.appendChild(contentElement);
            }
        }
        
        messagesElement.appendChild(messageElement);
    });
    
    // 滚动到底部
    messagesElement.scrollTop = messagesElement.scrollHeight;
}

// 发送消息
function sendMessage() {
    const text = messageInputElement.value.trim();
    if (text && currentRoomNumber && currentChannel) {
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const message = {
            user: currentUserName,
            text: text,
            time: timeString,
            timestamp: now.getTime(),
            isNotification: false,
            avatar: currentUserAvatar // 添加用户头像信息
        };
        
        // 通过GoEasy发送消息
        goEasy.pubsub.publish({
            channel: currentChannel,
            message: JSON.stringify(message),
            onSuccess: function() {
                console.log('消息发送成功');
                
                // 添加消息到本地数组
                if (!chatMessages[currentRoomNumber]) {
                    chatMessages[currentRoomNumber] = [];
                }
                chatMessages[currentRoomNumber].push(message);
                
                // 保存并显示消息
                saveChatMessages(currentRoomNumber);
                displayMessages(currentRoomNumber);
                
                // 清空输入框
                messageInputElement.value = '';
            },
            onFailed: function(error) {
                console.log('消息发送失败:', error);
                alert('消息发送失败，请检查网络连接');
            }
        });
    }
}

// 事件监听器
// 长按时间区域
if (timeElement) {
    timeElement.addEventListener('mousedown', handleLongPressStart);
    timeElement.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止默认行为
        handleLongPressStart();
    });
    
    timeElement.addEventListener('mouseup', handleLongPressEnd);
    timeElement.addEventListener('mouseleave', handleLongPressEnd);
    timeElement.addEventListener('touchend', handleLongPressEnd);
}

// 返回时钟按钮
if (backToClockButton) {
    backToClockButton.addEventListener('click', showClockScreen);
}

// 离开聊天室按钮
if (leaveChatButton) {
    leaveChatButton.addEventListener('click', function() {
        // 发送离开房间的通知
        if (currentChannel) {
            sendRoomNotification('离开了聊天室');
            
            // 取消订阅
            goEasy.pubsub.unsubscribe({
                channel: currentChannel,
                onSuccess: function() {
                    console.log('成功取消订阅频道:', currentChannel);
                    currentChannel = null;
                    showClockScreen();
                },
                onFailed: function(error) {
                    console.log('取消订阅频道失败:', error);
                    currentChannel = null;
                    showClockScreen();
                }
            });
        } else {
            showClockScreen();
        }
    });
}

// 数字键盘按键
keys.forEach(key => {
    key.addEventListener('click', () => {
        handleKeyPress(key.dataset.value);
    });
});

// 发送消息按钮
if (sendMessageButton) {
    sendMessageButton.addEventListener('click', sendMessage);
}

// 回车键发送消息
if (messageInputElement) {
    messageInputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// 初始化时钟
updateClock();

// 每秒更新一次时钟
setInterval(updateClock, 1000);

// 页面加载完成后初始化GoEasy和事件监听
window.addEventListener('load', function() {
    initGoEasy();
    setupGenderListeners();
    setupChangeAvatarListener();
    setupSaveUserInfoListener();
});