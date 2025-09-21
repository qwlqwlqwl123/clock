// 获取DOM元素并设置全局变量
const DOM = {
    time: document.getElementById('time'),
    date: document.getElementById('date'),
    day: document.getElementById('day'),
    clockContainer: document.getElementById('clock-container'),
    inputContainer: document.getElementById('input-container'),
    chatContainer: document.getElementById('chat-container'),
    roomNumber: document.getElementById('room-number'),
    currentRoom: document.getElementById('current-room'),
    messages: document.getElementById('messages'),
    messageInput: document.getElementById('message-input'),
    backToClock: document.getElementById('back-to-clock'),
    leaveChat: document.getElementById('leave-chat'),
    sendMessage: document.getElementById('send-message'),
    keys: document.querySelectorAll('.key'),
    userInfoContainer: document.getElementById('user-info-container'),
    userName: document.getElementById('user-name'),
    genderInputs: document.querySelectorAll('input[name="gender"]'),
    userRegion: document.getElementById('user-region'),
    userAge: document.getElementById('user-age'),
    userAvatar: document.getElementById('user-avatar'),
    changeAvatar: document.getElementById('change-avatar-btn'),
    saveUserInfo: document.getElementById('save-user-info-btn'),
    registerLink: document.getElementById('register-link'),
    myPageBtn: document.getElementById('my-page-btn'),
    userInfoDrawer: document.getElementById('user-info-drawer'),
    closeDrawer: document.getElementById('close-drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawerUserAvatar: document.getElementById('drawer-user-avatar'),
    drawerUserName: document.getElementById('drawer-user-name'),
    drawerUserGender: document.getElementById('drawer-user-gender'),
    drawerUserRegion: document.getElementById('drawer-user-region'),
    drawerUserAge: document.getElementById('drawer-user-age'),
    roomList: document.getElementById('room-list'),
    addNewRoom: document.getElementById('add-new-room'),
    roomListPlaceholder: document.querySelector('.room-list-placeholder'),
    editUserInfoBtn: document.getElementById('edit-user-info-btn')
};

// 全局状态
const state = {
    longPressTimer: null,
    currentRoomNumber: '000000',
    currentUserName: `用户${Math.floor(Math.random() * 10000)}`,
    currentUserGender: 'male',
    currentUserRegion: '北京',
    currentUserAge: 25,
    currentUserAvatar: '',
    chatMessages: {},
    goEasy: null,
    currentChannel: null,
    weekDays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    // 用于存储Supabase用户ID（通过匿名登录获取）
    userId: localStorage.getItem('supabase_user_id') || null,
    // 存储进入过的聊天室列表
    visitedRooms: [],
    // 用户是否已注册
    isRegistered: false
};

// 初始化Supabase客户端
// 已配置用户提供的Supabase项目信息
const supabaseConfig = {
    url: 'https://ylzhswdqigqnrqfvtayi.supabase.co', // Supabase项目URL
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemhzd2RxaWdxbnJxZnZ0YXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTY2ODcsImV4cCI6MjA3MzczMjY4N30.GOESBmkHwI_nZNVtjJ5lC9P9EnGwbnpYy7l-HZX2HVE' // Supabase API密钥
};

// 初始化Supabase客户端
let supabase = null;

// 检查并初始化Supabase
function initializeSupabase() {
    try {
        // 检查是否可以创建客户端
        if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
            const client = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);
            
            // 验证客户端对象的完整性
            if (client.auth && typeof client.auth.signInAnonymously === 'function') {
                return client;
            }
        }
    } catch (error) {
        console.error('创建Supabase客户端失败:', error.message);
    }
    
    return null;
}

// 匿名登录函数
async function signInAnonymously() {
    if (!isSupabaseAvailable()) return null;
    
    try {
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            // 简化错误处理，保留重要错误类型提示
            if (error.code === '422') {
                alert('登录失败：请确认匿名登录功能已在Supabase控制台启用');
            } else if (error.message && error.message.includes('signInAnonymously is not enabled')) {
                alert('匿名登录功能未启用，请联系管理员');
            }
            
            return null;
        }
        
        if (data.user) {
            console.log('匿名登录成功，用户ID:', data.user.id);
            state.userId = data.user.id; // 使用Supabase的用户ID作为应用内用户ID
            
            // 存储用户ID到localStorage以便跨会话使用
            localStorage.setItem('supabase_user_id', data.user.id);
            
            return data.user;
        }
        
        return null;
    } catch (error) {
        console.error('匿名登录时发生异常:', error);
        console.error('异常类型:', error.name);
        console.error('异常堆栈:', error.stack);
        
        // 处理网络异常
        if (error.name === 'TypeError' && error.message && error.message.includes('Failed to fetch')) {
            console.error('网络连接错误：无法连接到Supabase服务器');
            alert('网络连接失败，请检查您的网络设置');
        }
        
        return null;
    }
}

// 检查会话状态
async function checkSession() {
    if (!isSupabaseAvailable()) return null;
    
    try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
            // 保存用户ID
            state.userId = data.session.user.id;
            
            // 检查用户是否已通过魔法链接验证（非匿名用户）
            const isAnonymous = data.session.user.user_metadata?.['provider'] === 'anon' || !data.session.user.email_confirmed_at;
            
            if (!isAnonymous) {
                // 用户已通过魔法链接验证
                state.isRegistered = true;
                
                // 如果是刚登录成功，显示欢迎消息
                const isNewLogin = localStorage.getItem('justLoggedIn') !== 'true';
                if (isNewLogin) {
                    // 标记为已登录状态，避免重复显示欢迎消息
                    localStorage.setItem('justLoggedIn', 'true');
                    
                    // 延迟执行，确保DOM已加载
                    setTimeout(() => {
                        showLoginStatusMessage(`欢迎回来，${data.session.user.email || '用户'}！您已成功登录。`);
                    }, 1000);
                }
            }
            
            // 登录成功后，自动加载用户信息
            await loadUserInfoFromSupabase();
            
            return data.session.user;
        }
        
        // 如果没有会话，尝试匿名登录
        return await signInAnonymously();
    } catch (error) {
        console.error('检查会话状态失败:', error.message);
        return null;
    }
}

// 用户登出函数
async function signOut() {
    if (!isSupabaseAvailable()) {
        console.log('Supabase不可用，无法进行登出操作');
        // 清除本地数据
        localStorage.removeItem('supabase_user_id');
        localStorage.removeItem('userName');
        localStorage.removeItem('gender');
        localStorage.removeItem('region');
        localStorage.removeItem('age');
        localStorage.removeItem('justLoggedIn');
        
        // 重置状态
        resetUserState();
        
        // 显示用户信息设置界面
        showUserInfoScreen();
        return;
    }
    
    try {
        console.log('尝试登出...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('登出失败:', error);
            alert('登出失败: ' + (error.message || '未知错误'));
            return;
        }
        
        console.log('登出成功');
        
        // 清除本地数据
        localStorage.removeItem('supabase_user_id');
        localStorage.removeItem('userName');
        localStorage.removeItem('gender');
        localStorage.removeItem('region');
        localStorage.removeItem('age');
        
        // 重置状态
        resetUserState();
        
        // 显示用户信息设置界面
        showUserInfoScreen();
    } catch (error) {
        console.error('登出时发生异常:', error);
        alert('登出失败，请重试');
    }
}

// 重置用户状态
function resetUserState() {
    state.userId = null;
    state.currentUserName = `用户${Math.floor(Math.random() * 10000)}`;
    state.currentUserGender = 'male';
    state.currentUserRegion = '北京';
    state.currentUserAge = 25;
    state.currentUserAvatar = '';
    
    // 重置DOM元素
    if (DOM.userName) DOM.userName.value = state.currentUserName;
    if (DOM.userRegion) DOM.userRegion.value = state.currentUserRegion;
    if (DOM.userAge) DOM.userAge.value = state.currentUserAge;
    
    if (DOM.genderInputs) {
        DOM.genderInputs.forEach(input => {
            input.checked = input.value === state.currentUserGender;
        });
    }
    
    // 生成新的随机头像
    generateRandomAvatar();
}

// 初始化Supabase客户端
supabase = initializeSupabase();

// 检查Supabase是否可用的函数
function isSupabaseAvailable() {
    return supabase !== null;
}

// 测试Supabase连接的简单函数
async function testSupabaseConnection() {
    if (!isSupabaseAvailable()) return false;
    
    try {
        // 执行简单的查询测试连接
        const { error } = await supabase.from('user').select('*').limit(1);
        
        if (error) {
            // 简化错误处理，只记录关键错误信息
            console.error('Supabase连接测试失败:', error.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Supabase连接测试异常:', error.message);
        return false;
    }
}

// 生成唯一用户ID（用于在本地标识用户）
function generateUserId() {
    let userId = localStorage.getItem('chat_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chat_user_id', userId);
    }
    return userId;
}

// 生成随机头像
generateRandomAvatar = (gender = state.currentUserGender) => {
    const API_KEY = '771jPhkLN8VhSUOwOs6Iex0vRe';
    const API_URL = 'https://api.t1qq.com/api/tool/sjtx';
    const randomSeed = Math.floor(Math.random() * 10000);
    const apiUrl = `${API_URL}?key=${API_KEY}&random=${randomSeed}&gender=${gender}`;
    const fallbackAvatar = gender === 'male' 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=male${randomSeed}` 
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=female${randomSeed}`;
    
    // 创建图片对象验证URL可用性
    const img = new Image();
    img.onload = () => {
        state.currentUserAvatar = apiUrl;
        DOM.userAvatar.src = apiUrl;
    };
    img.onerror = () => {
        state.currentUserAvatar = fallbackAvatar;
        DOM.userAvatar.src = fallbackAvatar;
    };
    
    // 设置2秒超时，防止长时间等待
    setTimeout(() => {
        if (!state.currentUserAvatar) {
            state.currentUserAvatar = fallbackAvatar;
            DOM.userAvatar.src = fallbackAvatar;
        }
    }, 2000);
    
    img.src = apiUrl;
    return apiUrl;
};

// 从Supabase加载用户信息
async function loadUserInfoFromSupabase() {
    if (!state.userId || !isSupabaseAvailable()) return;
    
    try {
        // 从Supabase加载用户信息
        const { data: results, error } = await supabase
            .from('user')
            .select('*')
            .eq('user_id', state.userId);
        
        // 手动处理结果，只有在有结果时才获取第一个元素
        const data = results && results.length > 0 ? results[0] : null;
        
        if (error) {
            // 简化错误处理，保留关键错误处理逻辑
            console.error('加载用户信息失败:', error.message);
            
            // 针对重要错误类型切换到本地存储模式
            if (error.code === '401' || error.message && error.message.includes('Unauthorized')) {
                supabase = null;
            }
            
            // 生成随机头像
            generateRandomAvatar();
            return;
        }
        
        if (data) {
            // 加载用户信息到状态
            state.currentUserName = data.user_name || state.currentUserName;
            state.currentUserGender = data.gender || state.currentUserGender;
            state.currentUserRegion = data.region || state.currentUserRegion;
            state.currentUserAge = data.age || state.currentUserAge;
            state.currentUserAvatar = data.avatar || state.currentUserAvatar;
            
            // 如果没有头像，生成一个新的
            if (!state.currentUserAvatar) {
                generateRandomAvatar(state.currentUserGender);
            }
        } else {
            // 生成随机头像
            generateRandomAvatar();
        }
    } catch (error) {
        console.error('加载用户信息异常:', error.message);
        
        // 如果发生异常，将supabase设置为null，切换到本地存储模式
        supabase = null;
        
        // 生成随机头像
        generateRandomAvatar();
    }
}

// 初始化GoEasy
initGoEasy = () => {
    state.goEasy = GoEasy.getInstance({
        host: "hangzhou.goeasy.io",
        appkey: "BC-c438cf76314946cba2dead37823389fa",
        modules: ['pubsub']
    });
    
    state.goEasy.connect({
        onSuccess: () => console.log('GoEasy连接成功'),
        onFailed: (error) => console.log('GoEasy连接失败:', error)
    });
};

// 更新时间
updateClock = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = state.weekDays[now.getDay()];
    
    DOM.time.textContent = `${hours}:${minutes}:${seconds}`;
    DOM.date.textContent = `${year}-${month}-${date}`;
    DOM.day.textContent = day;
};

// 长按处理函数
handleLongPressStart = () => {
    state.longPressTimer = setTimeout(() => {
        showInputScreen();
    }, 1000);
};

handleLongPressEnd = () => {
    clearTimeout(state.longPressTimer);
};

// 切换用户信息抽屉
function toggleUserInfoDrawer() {
    // 更新抽屉中的用户信息
    updateUserInfoDrawer();
    
    // 切换抽屉和遮罩层的显示状态
    DOM.userInfoDrawer.classList.toggle('active');
    DOM.drawerOverlay.classList.toggle('active');
}

// 更新用户信息抽屉中的数据
function updateUserInfoDrawer() {
    if (DOM.drawerUserAvatar) {
        DOM.drawerUserAvatar.src = state.currentUserAvatar || 'https://via.placeholder.com/120';
    }
    
    if (DOM.drawerUserName) {
        DOM.drawerUserName.textContent = state.currentUserName;
    }
    
    if (DOM.drawerUserGender) {
        DOM.drawerUserGender.textContent = state.currentUserGender === 'male' ? '男' : '女';
    }
    
    if (DOM.drawerUserRegion) {
        DOM.drawerUserRegion.textContent = state.currentUserRegion;
    }
    
    if (DOM.drawerUserAge) {
        DOM.drawerUserAge.textContent = state.currentUserAge;
    }
}

// 加载访问过的聊天室列表
function loadVisitedRooms() {
    try {
        const savedRooms = localStorage.getItem('visited_rooms');
        if (savedRooms) {
            state.visitedRooms = JSON.parse(savedRooms);
            // 按最后访问时间排序，最新的在前
            state.visitedRooms.sort((a, b) => b.lastVisited - a.lastVisited);
        } else {
            // 添加一些模拟数据，以便用户能看到效果
            const now = new Date().getTime();
            state.visitedRooms = [
                {
                    number: '123456',
                    lastVisited: now - 3600000, // 1小时前
                    messageCount: 5,
                    remark: '游戏聊天室'
                },
                {
                    number: '654321',
                    lastVisited: now - 7200000, // 2小时前
                    messageCount: 12,
                    remark: '工作交流'
                },
                {
                    number: '111111',
                    lastVisited: now - 10800000, // 3小时前
                    messageCount: 3
                }
            ];
            // 保存模拟数据到localStorage
            saveVisitedRooms();
        }
    } catch (error) {
        console.error('加载访问过的聊天室列表失败:', error);
        state.visitedRooms = [];
    }
}

// 保存访问过的聊天室列表
function saveVisitedRooms() {
    try {
        localStorage.setItem('visited_rooms', JSON.stringify(state.visitedRooms));
    } catch (error) {
        console.error('保存访问过的聊天室列表失败:', error);
    }
}

// 添加访问过的聊天室
function addVisitedRoom(roomNumber) {
    // 检查是否已经存在这个房间
    const existingRoomIndex = state.visitedRooms.findIndex(room => room.number === roomNumber);
    const currentTime = new Date().getTime();
    
    if (existingRoomIndex >= 0) {
        // 更新现有房间的最后访问时间
        state.visitedRooms[existingRoomIndex].lastVisited = currentTime;
    } else {
        // 添加新房间
        state.visitedRooms.push({
            number: roomNumber,
            lastVisited: currentTime,
            messageCount: 0,
            remark: ''
        });
        
        // 限制列表大小为20个房间
        if (state.visitedRooms.length > 20) {
            state.visitedRooms.pop();
        }
    }
    
    // 按最后访问时间排序
    state.visitedRooms.sort((a, b) => b.lastVisited - a.lastVisited);
    
    // 保存到本地存储
    saveVisitedRooms();
    
    // 重新渲染列表
    renderRoomList();
}

// 修改聊天室备注
function updateRoomRemark(roomNumber, newRemark) {
    const roomIndex = state.visitedRooms.findIndex(room => room.number === roomNumber);
    if (roomIndex >= 0) {
        state.visitedRooms[roomIndex].remark = newRemark;
        saveVisitedRooms();
        renderRoomList();
    }
}

// 删除聊天室
function deleteRoom(roomNumber) {
    if (confirm(`确定要删除聊天室 ${roomNumber} 吗？`)) {
        state.visitedRooms = state.visitedRooms.filter(room => room.number !== roomNumber);
        saveVisitedRooms();
        renderRoomList();
        
        // 如果没有聊天室了，显示占位符
        if (state.visitedRooms.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'room-list-placeholder';
            placeholder.textContent = '暂无进入过的聊天室';
            DOM.roomList.appendChild(placeholder);
        }
    }
}

// 渲染聊天室列表
function renderRoomList() {
    DOM.roomList.innerHTML = '';
    
    if (state.visitedRooms.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'room-list-placeholder';
        placeholder.textContent = '暂无进入过的聊天室';
        DOM.roomList.appendChild(placeholder);
        return;
    }
    
    state.visitedRooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        
        const roomContent = document.createElement('div');
        roomContent.className = 'room-content';
        
        const roomNumber = document.createElement('div');
        roomNumber.className = 'room-number';
        roomNumber.textContent = room.number;
        
        if (room.remark?.trim()) {
            const remarkEl = document.createElement('div');
            remarkEl.className = 'room-remark';
            remarkEl.textContent = room.remark;
            roomContent.appendChild(roomNumber);
            roomContent.appendChild(remarkEl);
        } else {
            roomContent.appendChild(roomNumber);
        }
        
        const roomInfo = document.createElement('div');
        roomInfo.className = 'room-info';
        
        // 格式化最后访问时间
        const lastVisited = document.createElement('div');
        lastVisited.className = 'last-visited';
        const date = new Date(room.lastVisited);
        lastVisited.textContent = `上次访问: ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        // 消息数量
        const messageCount = document.createElement('div');
        messageCount.className = 'message-count';
        messageCount.textContent = room.messageCount || 0;
        
        roomInfo.appendChild(lastVisited);
        roomInfo.appendChild(messageCount);
        
        roomItem.appendChild(roomContent);
        roomItem.appendChild(roomInfo);
        
        // 添加点击事件
        roomItem.addEventListener('click', () => {
            if (window.isLongPress) {
                window.isLongPress = false;
                return;
            }
            
            if (state.currentUserName && state.currentUserName !== `用户${Math.floor(Math.random() * 10000)}`) {
                showChatScreen(room.number);
            } else {
                state.currentRoomNumber = room.number;
                showUserInfoScreen();
            }
        });
        
        // 长按事件相关变量
        let longPressTimer;
        
        // 鼠标按下/触摸开始事件
        roomItem.addEventListener('mousedown', startLongPress);
        roomItem.addEventListener('touchstart', startLongPress);
        
        // 鼠标松开/离开/触摸结束事件
        roomItem.addEventListener('mouseup', cancelLongPress);
        roomItem.addEventListener('mouseleave', cancelLongPress);
        roomItem.addEventListener('touchend', cancelLongPress);
        
        function startLongPress() {
            window.isLongPress = false;
            longPressTimer = setTimeout(() => {
                window.isLongPress = true;
                cancelLongPress();
                createActionMenu(room);
            }, 800);
        }
        
        function createActionMenu(room) {
            // 移除可能存在的旧菜单
            document.querySelector('.room-action-menu')?.remove();
            
            // 创建菜单元素
            const menu = document.createElement('div');
            menu.className = 'room-action-menu';
            menu.innerHTML = `
                <div class="menu-item edit-remark">修改备注</div>
                <div class="menu-item delete-room">删除聊天室</div>
                <div class="menu-item cancel">取消</div>
            `;
            
            // 设置菜单位置
            const rect = roomItem.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.left = `${rect.left + rect.width / 2}px`;
            menu.style.top = `${rect.top + rect.height / 2}px`;
            menu.style.transform = 'translate(-50%, -50%)';
            
            // 添加到文档中
            document.body.appendChild(menu);
            
            // 添加事件监听器
            menu.querySelector('.edit-remark').addEventListener('click', () => {
                const newRemark = prompt('请输入聊天室备注：', room.remark || '');
                if (newRemark !== null) {
                    updateRoomRemark(room.number, newRemark.trim());
                }
                menu.remove();
            });
            
            menu.querySelector('.delete-room').addEventListener('click', () => {
                deleteRoom(room.number);
                menu.remove();
            });
            
            menu.querySelector('.cancel').addEventListener('click', () => menu.remove());
            
            // 点击页面其他地方关闭菜单
            function closeMenuOnClickOutside(event) {
                if (!menu.contains(event.target) && event.target !== roomItem) {
                    menu.remove();
                    document.removeEventListener('click', closeMenuOnClickOutside);
                }
            }
            
            document.addEventListener('click', closeMenuOnClickOutside);
        }
        
        function cancelLongPress() {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
        
        DOM.roomList.appendChild(roomItem);
    });
}

// 显示添加新聊天室的界面
function showAddRoomScreen() {
    // 暂时隐藏聊天室列表和添加按钮
    DOM.roomList.style.display = 'none';
    DOM.addNewRoom.style.display = 'none';
    
    // 创建数字键盘
    const keypadContainer = document.createElement('div');
    keypadContainer.id = 'keypad-container';
    keypadContainer.innerHTML = `
        <div id="room-number" class="room-input">000000</div>
        <div class="keypad">
            <button class="key" data-value="1">1</button>
            <button class="key" data-value="2">2</button>
            <button class="key" data-value="3">3</button>
            <button class="key" data-value="4">4</button>
            <button class="key" data-value="5">5</button>
            <button class="key" data-value="6">6</button>
            <button class="key" data-value="7">7</button>
            <button class="key" data-value="8">8</button>
            <button class="key" data-value="9">9</button>
            <button class="key" data-value="clear">清除</button>
            <button class="key" data-value="0">0</button>
            <button class="key" data-value="enter">进入</button>
        </div>
        <button id="cancel-add-room" class="cancel-button">取消</button>
    `;
    
    DOM.inputContainer.appendChild(keypadContainer);
    
    // 更新DOM.roomNumber的引用，指向动态创建的房间号显示元素
    DOM.roomNumber = keypadContainer.querySelector('#room-number');
    
    // 重置房间号
    resetRoomNumber();
    
    // 添加按键事件监听
    const keys = keypadContainer.querySelectorAll('.key');
    keys.forEach(key => {
        key.addEventListener('click', () => {
            handleKeyPress(key.dataset.value);
        });
    });
    
    // 添加取消按钮事件监听
    const cancelButton = keypadContainer.querySelector('#cancel-add-room');
    cancelButton.addEventListener('click', () => {
        // 移除数字键盘
        keypadContainer.remove();
        
        // 显示聊天室列表和添加按钮
        DOM.roomList.style.display = 'block';
        DOM.addNewRoom.style.display = 'block';
    });
}

// 界面切换函数
showInputScreen = () => {
    DOM.clockContainer.classList.add('hidden');
    DOM.inputContainer.classList.remove('hidden');
    DOM.chatContainer.classList.add('hidden');
    
    loadVisitedRooms();
    renderRoomList();
};

showClockScreen = () => {
    DOM.clockContainer.classList.remove('hidden');
    DOM.inputContainer.classList.add('hidden');
    DOM.chatContainer.classList.add('hidden');
    DOM.userInfoContainer.classList.add('hidden');
    
    // 关闭抽屉
    DOM.userInfoDrawer.classList.remove('active');
    DOM.drawerOverlay.classList.remove('active');
};

showChatScreen = (roomNumber) => {
    state.currentRoomNumber = roomNumber;
    DOM.currentRoom.textContent = roomNumber;
    
    // 添加到访问过的聊天室列表
    addVisitedRoom(roomNumber);
    
    DOM.clockContainer.classList.add('hidden');
    DOM.inputContainer.classList.add('hidden');
    DOM.userInfoContainer.classList.add('hidden');
    DOM.chatContainer.classList.remove('hidden');
    
    // 关闭抽屉
    DOM.userInfoDrawer.classList.remove('active');
    DOM.drawerOverlay.classList.remove('active');
    
    // 加载本地消息
    loadChatMessages(roomNumber);
    
    // 取消之前的订阅
    if (state.currentChannel) {
        state.goEasy.pubsub.unsubscribe({
            channel: state.currentChannel
        });
    }
    
    // 设置当前频道并订阅
    state.currentChannel = `chat_room_${roomNumber}`;
    state.goEasy.pubsub.subscribe({
        channel: state.currentChannel,
        onMessage: (message) => {
            const msgData = JSON.parse(message.content);
            // 只处理非自己发送的消息
            if (msgData.user !== state.currentUserName) {
                state.chatMessages[state.currentRoomNumber] = state.chatMessages[state.currentRoomNumber] || [];
                state.chatMessages[state.currentRoomNumber].push(msgData);
                saveChatMessages(state.currentRoomNumber);
                displayMessages(state.currentRoomNumber);
            }
        },
        onSuccess: () => {
            sendRoomNotification('加入了聊天室');
        }
    });
    
    DOM.messageInput.value = '';
    DOM.messageInput.focus();
};

// 用户信息相关函数
showUserInfoScreen = () => {
    DOM.inputContainer.classList.add('hidden');
    DOM.userInfoContainer.classList.remove('hidden');
    DOM.chatContainer.classList.add('hidden');
    
    // 初始化表单值
    DOM.userName.value = state.currentUserName;
    DOM.userRegion.value = state.currentUserRegion;
    DOM.userAge.value = state.currentUserAge;
    
    // 设置性别单选按钮
    DOM.genderInputs.forEach(input => {
        input.checked = input.value === state.currentUserGender;
    });
    
    // 根据用户注册状态控制游客提示的显示
    const visitorNotice = document.querySelector('.visitor-notice');
    if (visitorNotice) {
        if (state.isRegistered) {
            visitorNotice.classList.add('hidden');
        } else {
            visitorNotice.classList.remove('hidden');
        }
    }
    
    // 检查是否已登录并显示登录状态信息
    const userLoginInfo = document.getElementById('user-login-info');
    if (!userLoginInfo && isSupabaseAvailable()) {
        // 获取当前用户信息
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && !user.is_anonymous) {
                // 创建并显示用户登录信息
                const loginInfoDiv = document.createElement('div');
                loginInfoDiv.id = 'user-login-info';
                loginInfoDiv.style.margin = '10px 0';
                loginInfoDiv.style.padding = '10px';
                loginInfoDiv.style.backgroundColor = '#f0f9ff';
                loginInfoDiv.style.borderRadius = '6px';
                loginInfoDiv.style.fontSize = '12px';
                loginInfoDiv.style.color = '#0288d1';
                loginInfoDiv.innerHTML = `📧 已通过邮箱 ${user.email} 登录<br>👤 用户ID: ${user.id.substr(0, 8)}...`;
                
                // 插入到用户名输入框下方
                DOM.userName.parentNode.appendChild(loginInfoDiv);
            }
        });
    } else if (userLoginInfo && !state.isRegistered) {
        // 如果用户未注册，移除登录信息
        userLoginInfo.remove();
    }
    
    // 生成并显示头像
    if (!state.currentUserAvatar) {
        generateRandomAvatar();
    } else {
        DOM.userAvatar.src = state.currentUserAvatar;
    }
    
    // 检查是否已经有登出按钮，如果没有则添加
    let logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) {
        logoutButton = document.createElement('button');
        logoutButton.id = 'logoutButton';
        logoutButton.textContent = '退出登录';
        logoutButton.style.position = 'absolute';
        logoutButton.style.top = '10px';
        logoutButton.style.right = '10px';
        logoutButton.style.padding = '8px 16px';
        logoutButton.style.backgroundColor = '#f44336';
        logoutButton.style.color = 'white';
        logoutButton.style.border = 'none';
        logoutButton.style.borderRadius = '4px';
        logoutButton.style.cursor = 'pointer';
        
        // 添加点击事件
        logoutButton.addEventListener('click', async () => {
            // 确认对话框
            if (confirm('确定要退出登录吗？')) {
                await signOut();
            }
        });
        
        // 添加到用户信息容器
        DOM.userInfoContainer.appendChild(logoutButton);
    } else {
        // 如果已有登出按钮，确保它可见
        logoutButton.style.display = 'block';
    }
};

// 保存用户信息
saveUserInfo = async () => {
    // 获取表单值
    const name = DOM.userName.value.trim();
    const selectedGender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
    const region = DOM.userRegion.value.trim();
    const age = parseInt(DOM.userAge.value) || 25;
    
    // 简单验证
    if (!name || name.length > 10) {
        alert('昵称不能为空且长度不能超过10个字符');
        return;
    }
    
    if (age < 1 || age > 120) {
        alert('年龄必须在1-120之间');
        return;
    }
    
    // 更新状态
    state.currentUserName = name;
    state.currentUserGender = selectedGender;
    state.currentUserRegion = region || '北京';
    state.currentUserAge = age;
    
    // 保存到localStorage
    localStorage.setItem('userName', name);
    localStorage.setItem('gender', selectedGender);
    localStorage.setItem('region', region);
    localStorage.setItem('age', age.toString());
    
    // 保存到Supabase
    await saveUserInfoToSupabase();
    
    // 显示时钟界面
    showClockScreen();
};

// 保存用户信息到Supabase
async function saveUserInfoToSupabase() {
    // 确保已经通过匿名登录获取了用户ID
    if (!state.userId) {
        const user = await checkSession();
        if (!user) return;
    }
    
    // 检查Supabase是否可用
    if (!isSupabaseAvailable()) return;
    
    try {
        // 准备要保存的数据
        const userData = {
            user_id: state.userId,
            user_name: state.currentUserName,
            gender: state.currentUserGender,
            region: state.currentUserRegion,
            age: state.currentUserAge,
            avatar: state.currentUserAvatar,
            updated_at: new Date().toISOString()
        };
        
        // 保存用户信息到Supabase
        const { error } = await supabase
            .from('user')
            .upsert(userData)
            .select();
        
        if (error) {
            // 针对常见错误类型进行处理
            if (error.code === '401' || error.code === '42501' || 
                error.message?.includes('Unauthorized') || 
                error.message?.includes('No API key found')) {
                // 将supabase设置为null，切换到本地存储模式
                supabase = null;
            }
        }
    } catch (error) {
        // 如果发生异常，将supabase设置为null，切换到本地存储模式
        supabase = null;
    }
};

// 房间号处理函数
resetRoomNumber = () => {
    state.currentRoomNumber = '000000';
    DOM.roomNumber.textContent = state.currentRoomNumber;
};

updateRoomNumber = (digit) => {
    if (state.currentRoomNumber.length >= 6) {
        state.currentRoomNumber = state.currentRoomNumber.substring(1) + digit;
    } else {
        state.currentRoomNumber = (state.currentRoomNumber + digit).slice(-6).padStart(6, '0');
    }
    DOM.roomNumber.textContent = state.currentRoomNumber;
};

// 处理数字按键点击
handleKeyPress = (value) => {
    switch(value) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            updateRoomNumber(value);
            break;
        case 'clear':
            resetRoomNumber();
            break;
        case 'enter':
            if (state.currentRoomNumber.length === 6 && /^\d+$/.test(state.currentRoomNumber)) {
                addVisitedRoom(state.currentRoomNumber);
                
                const keypadContainer = document.getElementById('keypad-container');
                if (keypadContainer) {
                    keypadContainer.remove();
                    DOM.roomList.style.display = 'block';
                    DOM.addNewRoom.style.display = 'block';
                }
                
                if (state.currentUserName && state.currentUserName !== `用户${Math.floor(Math.random() * 10000)}`) {
                    showChatScreen(state.currentRoomNumber);
                } else {
                    showUserInfoScreen();
                }
            }
            break;
    }
};

// 聊天室消息处理函数
sendRoomNotification = (action) => {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const notification = {
        user: '系统',
        text: `${state.currentUserName} ${action}`,
        time: timeString,
        timestamp: now.getTime(),
        isNotification: true,
        avatar: ''
    };
    
    state.goEasy.pubsub.publish({
        channel: state.currentChannel,
        message: JSON.stringify(notification)
    });
};

loadChatMessages = (roomNumber) => {
    const storedMessages = localStorage.getItem(`chat_${roomNumber}`);
    state.chatMessages[roomNumber] = storedMessages ? JSON.parse(storedMessages) : [];
    displayMessages(roomNumber);
};

saveChatMessages = (roomNumber) => {
    if (state.chatMessages[roomNumber]) {
        localStorage.setItem(`chat_${roomNumber}`, JSON.stringify(state.chatMessages[roomNumber]));
    }
};

displayMessages = (roomNumber) => {
    DOM.messages.innerHTML = '';
    const messages = state.chatMessages[roomNumber] || [];
    
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
            const isOwnMessage = message.user === state.currentUserName;
            messageElement.classList.add(isOwnMessage ? 'own-message' : 'other-message');
            
            // 创建头像元素
            const avatarElement = document.createElement('img');
            avatarElement.classList.add('message-avatar');
            
            // 设置头像源
            avatarElement.src = message.avatar || (isOwnMessage ? state.currentUserAvatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user}`);
            avatarElement.alt = `${message.user}'s avatar`;
            
            // 创建消息内容容器
            const contentElement = document.createElement('div');
            contentElement.classList.add('message-content');
            
            // 添加消息文本
            const textElement = document.createElement('div');
            textElement.textContent = message.text;
            contentElement.appendChild(textElement);
            
            // 添加时间元素（自己消息的时间）
            if (isOwnMessage) {
                const timeElement = document.createElement('div');
                timeElement.classList.add('time');
                timeElement.textContent = message.time;
                contentElement.appendChild(timeElement);
            }
            
            // 添加头像和内容到消息元素
            if (isOwnMessage) {
                messageElement.appendChild(contentElement);
                messageElement.appendChild(avatarElement);
            } else {
                messageElement.appendChild(avatarElement);
                messageElement.appendChild(contentElement);
            }
        }
        
        DOM.messages.appendChild(messageElement);
    });
    
    // 滚动到底部
    DOM.messages.scrollTop = DOM.messages.scrollHeight;
};

sendMessage = () => {
    const text = DOM.messageInput.value.trim();
    if (text && state.currentRoomNumber && state.currentChannel) {
        const now = new Date();
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const message = {
            user: state.currentUserName,
            text: text,
            time: timeString,
            timestamp: now.getTime(),
            isNotification: false,
            avatar: state.currentUserAvatar
        };
        
        state.goEasy.pubsub.publish({
            channel: state.currentChannel,
            message: JSON.stringify(message),
            onSuccess: () => {
                // 简化消息数组初始化
                state.chatMessages[state.currentRoomNumber] = state.chatMessages[state.currentRoomNumber] || [];
                state.chatMessages[state.currentRoomNumber].push(message);
                saveChatMessages(state.currentRoomNumber);
                displayMessages(state.currentRoomNumber);
                DOM.messageInput.value = '';
            },
            onFailed: (error) => {
                alert('消息发送失败，请检查网络连接');
            }
        });
    }
};

// 设置事件监听
setupEventListeners = () => {
    // 长按时间区域
    DOM.time.addEventListener('mousedown', handleLongPressStart);
    DOM.time.addEventListener('mouseup', handleLongPressEnd);
    DOM.time.addEventListener('mouseleave', handleLongPressEnd);
    
    // 移动设备触摸事件
    DOM.time.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleLongPressStart();
    });
    DOM.time.addEventListener('touchend', handleLongPressEnd);
    
    // 页面交互事件
    DOM.myPageBtn.addEventListener('click', toggleUserInfoDrawer);
    DOM.addNewRoom.addEventListener('click', showAddRoomScreen);
    DOM.closeDrawer.addEventListener('click', toggleUserInfoDrawer);
    DOM.drawerOverlay.addEventListener('click', toggleUserInfoDrawer);
    DOM.backToClock.addEventListener('click', showClockScreen);
    
    // 魔法链接登录事件
    DOM.magicLinkLogin = document.getElementById('magic-link-login');
    DOM.magicLinkLogin.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认的链接行为
        handleMagicLinkLogin(); // 处理魔法链接登录
    });
    
    // 处理魔法链接登录
    async function handleMagicLinkLogin() {
        const email = prompt('请输入您的邮箱地址，我们将发送一个魔法链接到您的邮箱:');
        
        if (!email || !isValidEmail(email)) {
            alert('请输入有效的邮箱地址');
            return;
        }
        
        const result = await sendMagicLink(email);
        if (result) {
            showLoginStatusMessage('登录链接已发送到您的邮箱，请查收并点击链接完成登录。');
        }
    }
    
    // 发送魔法链接到用户邮箱
    async function sendMagicLink(email) {
        if (!isSupabaseAvailable()) {
            alert('登录功能不可用，请稍后再试');
            return false;
        }
        
        try {
            const { data, error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    // 使用相对路径而不是绝对路径，避免本地开发环境的问题
                    emailRedirectTo: 'index.html',
                    // 确保使用正确的验证类型
                    type: 'magiclink'
                }
            });
            
            if (error) {
                console.error('发送魔法链接失败:', error.message);
                alert(`发送魔法链接失败：${error.message}`);
                return false;
            }
            
            console.log('魔法链接发送成功:', data);
            return true;
        } catch (err) {
            console.error('发送魔法链接过程中发生异常:', err.message);
            alert('发送魔法链接过程中发生错误，请稍后再试');
            return false;
        }
    }
    
    // 显示登录状态消息
    function showLoginStatusMessage(message) {
        // 检查是否已存在消息容器
        let messageContainer = document.getElementById('login-status-message');
        
        if (!messageContainer) {
            // 创建消息容器
            messageContainer = document.createElement('div');
            messageContainer.id = 'login-status-message';
            messageContainer.className = 'login-status-message';
            document.body.appendChild(messageContainer);
        }
        
        // 设置消息内容
        messageContainer.textContent = message;
        
        // 显示消息
        messageContainer.classList.remove('hidden');
        
        // 3秒后自动隐藏
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 3000);
    }
    
    // 验证邮箱格式
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return emailRegex.test(email);
    }
    
    // 修改个人信息按钮事件
    DOM.editUserInfoBtn.addEventListener('click', () => {
        // 关闭抽屉
        DOM.userInfoDrawer.classList.remove('active');
        DOM.drawerOverlay.classList.remove('active');
        
        // 显示用户信息设置页面
        showUserInfoScreen();
        
        // 填充当前用户信息到表单
        if (DOM.userName) DOM.userName.value = state.currentUserName || '';
        if (DOM.userRegion) DOM.userRegion.value = state.currentUserRegion || '北京';
        if (DOM.userAge) DOM.userAge.value = state.currentUserAge || '';
        
        // 设置性别单选按钮
        if (DOM.genderInputs) {
            DOM.genderInputs.forEach(radio => {
                if (radio.value === state.currentUserGender) {
                    radio.checked = true;
                }
            });
        }
        
        // 设置头像
        if (DOM.userAvatar) {
            DOM.userAvatar.src = state.currentUserAvatar || 'https://via.placeholder.com/120';
        }
    });
    
    // 离开聊天室处理
    DOM.leaveChat.addEventListener('click', () => {
        if (state.currentChannel) {
            sendRoomNotification('离开了聊天室');
            
            state.goEasy.pubsub.unsubscribe({
                channel: state.currentChannel,
                onSuccess: () => {
                    state.currentChannel = null;
                    showClockScreen();
                },
                onFailed: () => {
                    state.currentChannel = null;
                    showClockScreen();
                }
            });
        } else {
            showClockScreen();
        }
    });
    
    // 数字键盘按键
    DOM.keys.forEach(key => {
        key.addEventListener('click', () => handleKeyPress(key.dataset.value));
    });
    
    // 发送消息相关
    DOM.sendMessage.addEventListener('click', sendMessage);
    DOM.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // 用户信息相关
    DOM.genderInputs.forEach(input => {
        input.addEventListener('change', function() {
            state.currentUserGender = this.value;
            generateRandomAvatar(this.value);
        });
    });
    
    DOM.changeAvatar.addEventListener('click', () => {
        const selectedGender = document.querySelector('input[name="gender"]:checked').value;
        generateRandomAvatar(selectedGender);
    });
    
    DOM.saveUserInfo.addEventListener('click', () => {
        saveUserInfo();
        showChatScreen(state.currentRoomNumber);
    });
};

// 从localStorage加载用户信息
function loadUserInfoFromLocalStorage() {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
        state.currentUserName = savedName;
        DOM.userName.value = savedName;
    }
    
    const savedGender = localStorage.getItem('gender');
    if (savedGender) {
        state.currentUserGender = savedGender;
        DOM.genderInputs.forEach(input => {
            input.checked = input.value === savedGender;
        });
    }
    
    const savedRegion = localStorage.getItem('region');
    if (savedRegion) {
        state.currentUserRegion = savedRegion;
        DOM.userRegion.value = savedRegion;
    }
    
    const savedAge = localStorage.getItem('age');
    if (savedAge) {
        state.currentUserAge = parseInt(savedAge);
        DOM.userAge.value = savedAge;
    }
}

// 获取用户地域
getCurrentRegion = async () => state.currentUserRegion;

// 初始化应用
async function initApp() {
    try {
        // 初始化GoEasy
        initGoEasy();
        
        // 更新时钟
        updateClock();
        setInterval(updateClock, 1000);
        
        // 设置事件监听
        setupEventListeners();
        
        // 获取用户地域
        await getCurrentRegion();
        
        // 尝试Supabase相关操作
        let anonymousUser = null;
        if (isSupabaseAvailable()) {
            // 测试Supabase连接
            const supabaseConnected = await testSupabaseConnection();
            
            // 如果连接测试失败，将supabase设置为null
            if (!supabaseConnected) {
                supabase = null;
            } else {
                // 如果Supabase可用，进行匿名登录
                anonymousUser = await checkSession();
                
                // 从Supabase加载用户信息
                if (anonymousUser) {
                    try {
                        await loadUserInfoFromSupabase();
                    } catch (supabaseError) {
                        console.error('加载用户信息失败:', supabaseError.message);
                        // 即使加载失败，也继续执行
                    }
                }
            }
        }
        
        // 从localStorage加载用户信息
        if (!isSupabaseAvailable() || !anonymousUser || !state.currentUserName || state.currentUserName === `用户${Math.floor(Math.random() * 10000)}`) {
            loadUserInfoFromLocalStorage();
            
            // 生成随机头像
            if (!state.currentUserAvatar) {
                generateRandomAvatar();
            }
            
            // 显示用户信息设置界面
            showUserInfoScreen();
        } else {
            // 显示时钟界面
            showClockScreen();
        }
    } catch (error) {
        console.error('应用初始化失败:', error.message);
        // 错误情况下，生成随机头像并显示用户信息界面
        generateRandomAvatar();
        showUserInfoScreen();
    }
}

// 启动应用
initApp();