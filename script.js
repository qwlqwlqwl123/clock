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
    roomListPlaceholder: document.querySelector('.room-list-placeholder')
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
    // 用于存储Supabase用户ID
    userId: null,
    // 存储进入过的聊天室列表
    visitedRooms: []
};

// 初始化Supabase客户端
// 已配置用户提供的Supabase项目信息
const supabaseConfig = {
    url: 'https://ylzhswdqigqnrqfvtayi.supabase.co', // Supabase项目URL
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemhzd2RxaWdxbnJxZnZ0YXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTY2ODcsImV4cCI6MjA3MzczMjY4N30.GOESBmkHwI_nZNVtjJ5lC9P9EnGwbnpYy7l-HZX2HVE' // Supabase API密钥
};

// 初始化Supabase客户端
// 改进的初始化逻辑，添加详细调试日志和认证配置
let supabase = null;

// 检查并初始化Supabase
function initializeSupabase() {
    console.log('开始初始化Supabase客户端...');
    
    // 检查window对象是否存在
    if (typeof window === 'undefined') {
        console.log('window对象不存在，无法初始化Supabase');
        return null;
    }
    
    // 检查是否加载了Supabase客户端库
    if (!window.supabase || !window.supabase.createClient) {
        console.error('未找到Supabase客户端库或createClient函数');
        // 显示错误信息给用户
        setTimeout(() => {
            alert('Supabase客户端库加载失败，将使用本地存储模式');
        }, 1000);
        return null;
    }
    
    try {
        // 确保使用正确的方式创建Supabase客户端
        // 对于v2版本，我们使用window.supabase.createClient并添加auth选项
        const client = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            global: {
                headers: {
                    // 明确设置API密钥头，确保每个请求都包含认证信息
                    'apikey': supabaseConfig.key,
                    'Authorization': `Bearer ${supabaseConfig.key}`,
                    // 添加Content-Type和Accept头以避免406 Not Acceptable错误
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        });
        
        console.log('Supabase客户端创建成功，客户端对象:', client);
        console.log('API密钥配置检查:', supabaseConfig.key ? '已配置' : '未配置');
        console.log('项目URL检查:', supabaseConfig.url ? '已配置' : '未配置');
        
        return client;
    } catch (error) {
        console.error('创建Supabase客户端时发生错误:', error);
        console.error('错误类型:', error.name);
        console.error('错误信息:', error.message);
        // 显示错误信息给用户
        setTimeout(() => {
            alert('创建Supabase连接失败: ' + (error.message || '未知错误'));
        }, 1000);
        return null;
    }
}

// 初始化Supabase客户端
console.log('检查是否加载了Supabase客户端库...');
console.log('window对象:', typeof window !== 'undefined');
console.log('全局createClient:', typeof createClient !== 'undefined' ? '已定义' : '未定义');
console.log('window.createClient:', window && window.createClient ? '已定义' : '未定义');
console.log('window.supabase:', window && window.supabase ? '已定义' : '未定义');

supabase = initializeSupabase();

// 检查Supabase是否可用的函数
function isSupabaseAvailable() {
    return supabase !== null;
}

// 添加详细的测试函数，验证Supabase连接
async function testSupabaseConnection() {
    if (!isSupabaseAvailable()) {
        console.log('Supabase不可用，跳过连接测试');
        return false;
    }
    
    console.log('开始测试Supabase连接...');
    console.log('Supabase客户端对象:', typeof supabase === 'object' ? '已创建' : '未创建');
    
    try {
        // 尝试一个简单的查询来测试连接
        // 注意：根据Supabase错误提示，表名应为'user'而非'users'
        console.log('正在执行查询：from(\'user\').select(\'*\').limit(1)');
        
        const { data, error } = await supabase.from('user').select('*').limit(1);
        
        if (error) {
            console.error('Supabase连接测试失败:', error);
            console.error('错误代码:', error.code);
            console.error('错误详情:', error.details);
            console.error('错误提示:', error.hint);
            console.error('完整错误对象:', JSON.stringify(error));
            
            // 针对不同类型的错误提供更具体的反馈和建议
            if (error.code === 'PGRST205' || error.message && error.message.includes('could not find the table')) {
                console.error('表不存在错误：请确保在Supabase控制台创建了user表');
                console.error('建议：登录Supabase控制台，在公共架构下创建名为user的表，包含必要的字段');
            } else if (error.code === '42501' || error.message && error.message.includes('permission denied')) {
                console.error('权限错误：API密钥可能没有足够的权限访问该表或违反了行级安全策略');
                console.error('具体错误：', error.message);
                console.error('建议：1. 检查Supabase项目中的API密钥权限设置');
                console.error('建议：2. 登录Supabase控制台，确保为user表配置了适当的行级安全策略');
                console.error('建议：3. 确认匿名用户(anon key)有足够的权限进行操作');
                console.error('建议：4. 可以暂时禁用行级安全策略进行测试');
            } else if (error.code === '404' || error.message && error.message.includes('not found')) {
                console.error('资源不存在错误：可能是URL错误或表结构不匹配');
                console.error('建议：检查Supabase项目URL是否正确，并确保表结构正确');
            } else if (error.code === 'ECONNREFUSED' || error.message && error.message.includes('connection refused')) {
                console.error('连接被拒绝：无法连接到Supabase服务器');
                console.error('建议：检查网络连接和Supabase项目状态');
            } else if (error.code === '401' || error.message && error.message.includes('Unauthorized')) {
                console.error('未授权错误：API密钥无效或权限不足');
                console.error('错误详情：可能是API密钥格式错误、过期或没有足够的权限');
                console.error('建议：1. 检查Supabase控制台中的API密钥是否正确');
                console.error('建议：2. 确保使用的是anon/public密钥，而不是service_role密钥');
                console.error('建议：3. 确认API密钥包含在请求头中');
            } else if (error.message && error.message.includes('No API key found in request')) {
                console.error('API密钥未找到：请求中没有包含API密钥');
                console.error('建议：检查客户端初始化代码中的API密钥配置');
            }
            
            return false;
        }
        
        console.log('Supabase连接测试成功');
        console.log('查询结果数据:', data || '无数据返回但连接成功');
        
        // 额外验证：检查是否可以执行简单的插入和删除操作（可选）
        try {
            const testId = 'test_' + Date.now();
            console.log('测试简单的数据插入操作...');
            const { error: insertError } = await supabase.from('user').insert({
                user_id: testId,
                user_name: '测试用户',
                gender: 'male',
                region: '测试区域',
                age: 25
            });
            
            if (insertError) {
                console.error('插入测试失败:', insertError);
            } else {
                console.log('插入测试成功，正在清理测试数据...');
                await supabase.from('user').delete().eq('user_id', testId);
                console.log('测试数据清理完成');
            }
        } catch (testError) {
            console.error('执行额外测试时发生错误:', testError);
        }
        
        return true;
    } catch (error) {
        console.error('Supabase连接测试时发生异常:', error);
        console.error('异常类型:', error.name);
        console.error('异常信息:', error.message);
        console.error('完整异常对象:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        // 提供一般性的连接问题建议
        if (error.name === 'TypeError') {
            console.error('类型错误：可能是Supabase客户端库加载问题或函数调用错误');
            console.error('建议：检查Supabase客户端库的引入方式和版本');
        } else if (error.message && error.message.includes('Failed to fetch')) {
            console.error('网络错误：无法连接到Supabase服务器');
            console.error('建议：检查网络连接和Supabase服务状态');
        } else {
            console.error('建议：检查网络连接、Supabase项目状态和API密钥配置');
        }
        
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
    // 获取或生成用户ID
    state.userId = generateUserId();
    
    // 检查Supabase是否可用
    if (!isSupabaseAvailable()) {
        console.log('Supabase不可用，使用本地存储');
        return;
    }
    
    console.log('尝试从Supabase加载用户信息，用户ID:', state.userId);
    console.log('当前Supabase客户端:', typeof supabase === 'object' ? '可用' : '不可用');
    
    try {
        // 从Supabase加载用户信息
        // 注意：根据Supabase错误提示，表名应为'user'而非'users'
        console.log('正在执行查询：from(\'user\').select(\'*\').eq(\'user_id\', state.userId).single()');
        
        // 先执行查询不使用single()，避免结果为空时出错
        const { data: results, error } = await supabase
            .from('user')
            .select('*')
            .eq('user_id', state.userId);
        
        // 手动处理结果，只有在有结果时才获取第一个元素
        const data = results && results.length > 0 ? results[0] : null;
        
        if (error) {
            console.error('加载用户信息失败:', error);
            console.error('错误代码:', error.code);
            console.error('错误详情:', error.details);
            console.error('错误提示:', error.hint);
            console.error('完整错误对象:', JSON.stringify(error));
            
            // 针对不同类型的错误提供更具体的反馈和处理
            if (error.code === '401' || error.message && error.message.includes('Unauthorized')) {
                console.error('未授权错误：API密钥无效或权限不足');
                console.error('建议：检查Supabase项目中的API密钥配置');
                // 将supabase设置为null，切换到本地存储模式
                supabase = null;
            } else if (error.code === '406' || error.message && error.message.includes('Not Acceptable')) {
                console.error('406 (Not Acceptable)错误：服务器无法提供请求格式的数据');
                console.error('建议：检查请求头中的Content-Type和Accept配置');
                console.error('当前请求头配置:', supabase.config.global.headers);
            } else if (error.message && error.message.includes('not found')) {
                console.log('用户不存在于Supabase，将创建新用户');
            } else if (error.message && error.message.includes('No API key found in request')) {
                console.error('API密钥未找到：请求中没有包含API密钥');
                console.error('建议：检查客户端初始化代码中的API密钥配置');
                // 将supabase设置为null，切换到本地存储模式
                supabase = null;
            } else if (error.code === '42501' || error.message && error.message.includes('permission denied')) {
                console.error('权限错误：违反了行级安全策略');
                console.error('具体错误：', error.message);
                console.error('建议：1. 登录Supabase控制台，为user表配置适当的行级安全策略');
                console.error('建议：2. 确认匿名用户(anon key)有足够的权限进行操作');
            }
            
            // 生成随机头像
            generateRandomAvatar();
            return;
        }
        
        if (data) {
            console.log('从Supabase获取到的用户数据:', data);
            
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
            
            console.log('用户信息已从Supabase加载完成');
            
            // 检查是否已经设置了用户信息，如果已设置，则直接显示时钟界面
            if (state.currentUserName !== '' && state.currentUserName !== `用户${Math.floor(Math.random() * 10000)}`) {
                showClockScreen();
            }
        } else {
            console.log('用户不存在，将创建新用户');
            generateRandomAvatar();
        }
    } catch (error) {
        console.error('Supabase加载用户信息时发生错误:', error);
        console.error('错误类型:', error.name);
        console.error('错误信息:', error.message);
        console.error('完整异常对象:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
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
        
        // 如果有备注，显示备注
        let displayText = room.number;
        if (room.remark && room.remark.trim()) {
            const remarkEl = document.createElement('div');
            remarkEl.className = 'room-remark';
            remarkEl.textContent = room.remark;
            roomContent.appendChild(roomNumber);
            roomContent.appendChild(remarkEl);
            displayText = room.remark;
        } else {
            roomContent.appendChild(roomNumber);
        }
        
        const roomInfo = document.createElement('div');
        roomInfo.className = 'room-info';
        
        // 格式化最后访问时间
        const lastVisited = document.createElement('div');
        lastVisited.className = 'last-visited';
        const date = new Date(room.lastVisited);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        lastVisited.textContent = `上次访问: ${hours}:${minutes}`;
        
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
            if (state.currentUserName && state.currentUserName !== `用户${Math.floor(Math.random() * 10000)}`) {
                showChatScreen(room.number);
            } else {
                state.currentRoomNumber = room.number;
                showUserInfoScreen();
            }
        });
        
        // 长按事件相关变量
        let longPressTimer;
        const longPressDuration = 800; // 长按触发时间（毫秒）
        
        // 鼠标按下/触摸开始事件
        roomItem.addEventListener('mousedown', startLongPress);
        roomItem.addEventListener('touchstart', startLongPress);
        
        // 鼠标松开/离开/触摸结束事件
        roomItem.addEventListener('mouseup', cancelLongPress);
        roomItem.addEventListener('mouseleave', cancelLongPress);
        roomItem.addEventListener('touchend', cancelLongPress);
        
        function startLongPress() {
            longPressTimer = setTimeout(() => {
                // 防止点击事件触发
                cancelLongPress();
                
                // 创建自定义操作菜单
                createActionMenu(room);
            }, longPressDuration);
        }
        
        // 创建操作菜单
        function createActionMenu(room) {
            // 移除可能存在的旧菜单
            const oldMenu = document.querySelector('.room-action-menu');
            if (oldMenu) {
                oldMenu.remove();
            }
            
            // 创建菜单元素
            const menu = document.createElement('div');
            menu.className = 'room-action-menu';
            menu.innerHTML = `
                <div class="menu-item edit-remark">修改备注</div>
                <div class="menu-item delete-room">删除聊天室</div>
                <div class="menu-item cancel">取消</div>
            `;
            
            // 设置菜单位置（相对于被长按的元素）
            const rect = roomItem.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.left = `${rect.left + rect.width / 2}px`;
            menu.style.top = `${rect.top + rect.height / 2}px`;
            menu.style.transform = 'translate(-50%, -50%)';
            
            // 添加到文档中
            document.body.appendChild(menu);
            
            // 添加事件监听器
            menu.querySelector('.edit-remark').addEventListener('click', () => {
                const currentRemark = room.remark || '';
                const newRemark = prompt('请输入聊天室备注：', currentRemark);
                
                if (newRemark !== null) { // 用户点击了确定按钮
                    updateRoomRemark(room.number, newRemark.trim());
                }
                menu.remove();
            });
            
            menu.querySelector('.delete-room').addEventListener('click', () => {
                deleteRoom(room.number);
                menu.remove();
            });
            
            menu.querySelector('.cancel').addEventListener('click', () => {
                menu.remove();
            });
            
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
    
    // 加载并渲染聊天室列表
    loadVisitedRooms();
    renderRoomList();
};

showClockScreen = () => {
    DOM.clockContainer.classList.remove('hidden');
    DOM.inputContainer.classList.add('hidden');
    DOM.chatContainer.classList.add('hidden');
    DOM.userInfoContainer.classList.add('hidden');
    
    // 确保抽屉是关闭的
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
    
    // 确保抽屉是关闭的
    DOM.userInfoDrawer.classList.remove('active');
    DOM.drawerOverlay.classList.remove('active');
    
    // 加载本地消息
    loadChatMessages(roomNumber);
    
    // 取消之前的订阅
    if (state.currentChannel) {
        state.goEasy.pubsub.unsubscribe({
            channel: state.currentChannel,
            onSuccess: () => console.log('成功取消之前的订阅:', state.currentChannel),
            onFailed: (error) => console.log('取消之前的订阅失败:', error)
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
                if (!state.chatMessages[state.currentRoomNumber]) {
                    state.chatMessages[state.currentRoomNumber] = [];
                }
                state.chatMessages[state.currentRoomNumber].push(msgData);
                saveChatMessages(state.currentRoomNumber);
                displayMessages(state.currentRoomNumber);
            }
        },
        onSuccess: () => {
            console.log('成功订阅频道:', state.currentChannel);
            sendRoomNotification('加入了聊天室');
        },
        onFailed: (error) => console.log('订阅频道失败:', error)
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
    
    // 生成并显示头像
    if (!state.currentUserAvatar) {
        generateRandomAvatar();
    } else {
        DOM.userAvatar.src = state.currentUserAvatar;
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
    // 确保有用户ID
    if (!state.userId) {
        state.userId = generateUserId();
    }
    
    // 检查Supabase是否可用
    if (!isSupabaseAvailable()) {
        console.log('Supabase不可用，用户信息仅保存在本地');
        return;
    }
    
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
        
        console.log('准备保存到Supabase的用户数据:', userData);
        
        // 保存用户信息到Supabase
        // 注意：根据Supabase错误提示，表名应为'user'而非'users'
        console.log('正在执行upsert操作：from(\'user\').upsert(userData).select()');
        
        const { data, error } = await supabase
            .from('user')
            .upsert(userData)
            .select();
        
        if (error) {
            console.error('保存用户信息到Supabase失败:', error);
            console.error('错误代码:', error.code);
            console.error('错误详情:', error.details);
            console.error('错误提示:', error.hint);
            console.error('完整错误对象:', JSON.stringify(error));
            
            // 针对不同类型的错误提供更具体的反馈和处理
            if (error.code === '401' || error.message && error.message.includes('Unauthorized')) {
                console.error('未授权错误：API密钥无效或权限不足');
                console.error('建议：检查Supabase项目中的API密钥配置');
                // 将supabase设置为null，切换到本地存储模式
                supabase = null;
            } else if (error.code === '406' || error.message && error.message.includes('Not Acceptable')) {
                console.error('406 (Not Acceptable)错误：服务器无法提供请求格式的数据');
                console.error('建议：检查请求头中的Content-Type和Accept配置');
                console.error('当前请求头配置:', supabase.config.global.headers);
            } else if (error.code === '42501' || error.message && error.message.includes('permission denied')) {
                console.error('权限错误：违反了行级安全策略');
                console.error('具体错误：', error.message);
                console.error('建议：1. 登录Supabase控制台，为user表配置适当的行级安全策略');
                console.error('建议：2. 确认匿名用户(anon key)有足够的权限进行操作');
                // 将supabase设置为null，切换到本地存储模式
                supabase = null;
            } else if (error.message && error.message.includes('timestamp')) {
                console.error('时间戳字段错误：可能是字段名称或数据类型不匹配');
                // 尝试不包含updated_at字段
                try {
                    const simplifiedData = {...userData};
                    delete simplifiedData.updated_at;
                    console.log('尝试不包含updated_at字段重新保存:', simplifiedData);
                    
                    const { data: simplifiedDataResult, error: simplifiedError } = await supabase
                        .from('user')
                        .upsert(simplifiedData)
                        .select();
                    
                    if (simplifiedError) {
                        console.error('简化数据后保存仍然失败:', simplifiedError);
                        if (simplifiedError.code === '401') {
                            console.error('简化数据后仍发生未授权错误，切换到本地存储模式');
                            supabase = null;
                        }
                    } else {
                        console.log('简化数据后保存成功');
                    }
                } catch (innerError) {
                    console.error('简化数据后尝试保存时发生异常:', innerError);
                    supabase = null;
                }
            } else if (error.message && error.message.includes('No API key found in request')) {
                console.error('API密钥未找到：请求中没有包含API密钥');
                console.error('建议：检查客户端初始化代码中的API密钥配置');
                // 将supabase设置为null，切换到本地存储模式
                supabase = null;
            }
        } else {
            console.log('用户信息已保存到Supabase', data);
        }
    } catch (error) {
        console.error('Supabase保存用户信息时发生错误:', error);
        console.error('错误类型:', error.name);
        console.error('错误信息:', error.message);
        console.error('完整异常对象:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
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
        state.currentRoomNumber = state.currentRoomNumber.substring(state.currentRoomNumber.length - Math.min(state.currentRoomNumber.length, 5)) + digit;
        state.currentRoomNumber = state.currentRoomNumber.padStart(6, '0');
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
                // 添加到访问过的聊天室列表
                addVisitedRoom(state.currentRoomNumber);
                
                // 移除数字键盘（如果存在）
                const keypadContainer = document.getElementById('keypad-container');
                if (keypadContainer) {
                    keypadContainer.remove();
                    DOM.roomList.style.display = 'block';
                    DOM.addNewRoom.style.display = 'block';
                }
                
                // 如果已经有有效的用户信息，直接进入聊天室
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
        message: JSON.stringify(notification),
        onSuccess: () => console.log('通知发送成功'),
        onFailed: (error) => console.log('通知发送失败:', error)
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
            if (message.avatar) {
                avatarElement.src = message.avatar;
            } else if (isOwnMessage) {
                avatarElement.src = state.currentUserAvatar;
            } else {
                avatarElement.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.user}`;
            }
            
            avatarElement.alt = `${message.user}'s avatar`;
            
            // 创建消息内容容器
            const contentElement = document.createElement('div');
            contentElement.classList.add('message-content');
            
            // 添加消息文本
            const textElement = document.createElement('div');
            textElement.textContent = message.text;
            
            // 添加时间元素（自己消息的时间）
            if (isOwnMessage) {
                const timeElement = document.createElement('div');
                timeElement.classList.add('time');
                timeElement.textContent = message.time;
                contentElement.appendChild(textElement);
                contentElement.appendChild(timeElement);
            } else {
                contentElement.appendChild(textElement);
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
                if (!state.chatMessages[state.currentRoomNumber]) {
                    state.chatMessages[state.currentRoomNumber] = [];
                }
                state.chatMessages[state.currentRoomNumber].push(message);
                saveChatMessages(state.currentRoomNumber);
                displayMessages(state.currentRoomNumber);
                DOM.messageInput.value = '';
            },
            onFailed: (error) => {
                console.log('消息发送失败:', error);
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
    
    // 我的页面按钮点击事件
    if (DOM.myPageBtn) {
        DOM.myPageBtn.addEventListener('click', toggleUserInfoDrawer);
    }
    
    // 添加新聊天室按钮点击事件
    if (DOM.addNewRoom) {
        DOM.addNewRoom.addEventListener('click', showAddRoomScreen);
    }
    
    // 关闭抽屉按钮点击事件
    if (DOM.closeDrawer) {
        DOM.closeDrawer.addEventListener('click', toggleUserInfoDrawer);
    }
    
    // 抽屉遮罩层点击事件
    if (DOM.drawerOverlay) {
        DOM.drawerOverlay.addEventListener('click', toggleUserInfoDrawer);
    }
    
    // 页面导航按钮
    if (DOM.backToClock) {
        DOM.backToClock.addEventListener('click', showClockScreen);
    }
    
    if (DOM.leaveChat) {
        DOM.leaveChat.addEventListener('click', () => {
            if (state.currentChannel) {
                sendRoomNotification('离开了聊天室');
                
                state.goEasy.pubsub.unsubscribe({
                    channel: state.currentChannel,
                    onSuccess: () => {
                        state.currentChannel = null;
                        showClockScreen();
                    },
                    onFailed: (error) => {
                        state.currentChannel = null;
                        showClockScreen();
                    }
                });
            } else {
                showClockScreen();
            }
        });
    }
    
    // 数字键盘按键
    DOM.keys.forEach(key => {
        key.addEventListener('click', () => {
            handleKeyPress(key.dataset.value);
        });
    });
    
    // 发送消息相关
    if (DOM.sendMessage) {
        DOM.sendMessage.addEventListener('click', sendMessage);
    }
    
    if (DOM.messageInput) {
        DOM.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // 用户信息相关
    DOM.genderInputs.forEach(input => {
        input.addEventListener('change', function() {
            state.currentUserGender = this.value;
            generateRandomAvatar(this.value);
        });
    });
    
    if (DOM.changeAvatar) {
        DOM.changeAvatar.addEventListener('click', () => {
            const selectedGender = document.querySelector('input[name="gender"]:checked').value;
            generateRandomAvatar(selectedGender);
        });
    }
    
    if (DOM.saveUserInfo) {
        DOM.saveUserInfo.addEventListener('click', () => {
            saveUserInfo();
            showChatScreen(state.currentRoomNumber);
        });
    }
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
getCurrentRegion = async () => {
    try {
        // 这里可以使用地理定位API或第三方服务获取用户地域
        // 为简化示例，我们暂时保持默认值
        return state.currentUserRegion;
    } catch (error) {
        console.log('获取地域信息失败:', error);
        return state.currentUserRegion;
    }
};

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
        
        // 测试Supabase连接
        let supabaseConnected = false;
        if (isSupabaseAvailable()) {
            console.log('尝试测试Supabase连接...');
            supabaseConnected = await testSupabaseConnection();
            
            // 如果连接测试失败，将supabase设置为null
            if (!supabaseConnected) {
                console.log('Supabase连接不可用，切换到本地存储模式');
                supabase = null;
            }
        }
        
        // 从Supabase加载用户信息（仅当连接可用时）
        let userInfoLoadedFromSupabase = false;
        if (isSupabaseAvailable() && supabaseConnected) {
            try {
                console.log('尝试从Supabase加载用户信息...');
                await loadUserInfoFromSupabase();
                userInfoLoadedFromSupabase = true;
                console.log('从Supabase加载用户信息成功');
            } catch (supabaseError) {
                console.error('从Supabase加载用户信息失败:', supabaseError);
                // 即使加载失败，也继续执行，不中断应用启动
                supabase = null;
            }
        }
        
        // 如果Supabase不可用或没有成功加载用户信息，从localStorage加载
        if (!isSupabaseAvailable() || !userInfoLoadedFromSupabase || !state.currentUserName || state.currentUserName === `用户${Math.floor(Math.random() * 10000)}`) {
            console.log('从localStorage加载用户信息...');
            loadUserInfoFromLocalStorage();
            
            // 如果没有从任何地方加载到用户信息，生成随机头像
            if (!state.currentUserAvatar) {
                generateRandomAvatar();
            }
            
            // 只有当用户没有有效的用户名时才显示用户信息设置界面
            if (!state.currentUserName || state.currentUserName === `用户${Math.floor(Math.random() * 10000)}`) {
                showUserInfoScreen();
            } else {
                console.log('用户信息已存在，等待输入房间号...');
            }
        }
    } catch (error) {
        console.error('应用初始化失败:', error);
        // 确保在错误情况下，即使Supabase不可用，应用也能正常运行
        supabase = null;
        // 错误情况下，生成随机头像并显示用户信息界面
        generateRandomAvatar();
        showUserInfoScreen();
    }
}

// 启动应用
initApp();