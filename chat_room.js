// Supabase 配置 - 与主应用相同的配置
const supabaseUrl = 'https://ylzhswdqigqnrqfvtayi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemhzd2RxaWdxbnJxZnZ0YXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTY2ODcsImV4cCI6MjA3MzczMjY4N30.GOESBmkHwI_nZNVtjJ5lC9P9EnGwbnpYy7l-HZX2HVE';

// 全局Supabase客户端实例
let supabase = null;
// 当前用户信息
let currentUser = null;
// 初始化GoEasy对象
let goEasy = null;
// 全局用户信息缓存，避免重复查询
const userInfoCache = new Map();

// 页面元素
const statusElement = document.getElementById('status');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messageStatus = document.getElementById('messageStatus');

// 从URL获取房间号
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room') || 'default';

// 获取房间名称元素
const roomNameHeader = document.getElementById('roomNameHeader');

// 从Supabase获取房间信息并设置聊天名称
async function fetchRoomInfo() {
    if (!supabase || !roomCode) {
        console.error('Supabase客户端或房间号不可用');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('chat_rooms')
            .select('room_name')
            .eq('room_code', roomCode)
            .single();
        
        if (error) {
            console.error('查询房间信息失败:', error);
            // 如果房间不存在，尝试创建房间记录
            if (error.code === 'PGRST116') { // 未找到记录的错误码
                await createRoomIfNotExists();
                return;
            }
        } else if (data && data.room_name) {
            // 设置页面标题和聊天头部
            document.title = data.room_name;
            roomNameHeader.textContent = data.room_name;
        } else {
            // 默认房间名称
            const defaultRoomName = `聊天室 ${roomCode}`;
            document.title = defaultRoomName;
            roomNameHeader.textContent = defaultRoomName;
        }
    } catch (err) {
        console.error('获取房间信息过程中发生错误:', err);
        // 设置默认房间名称
        const defaultRoomName = `聊天室 ${roomCode}`;
        document.title = defaultRoomName;
        roomNameHeader.textContent = defaultRoomName;
    }
}

// 如果房间不存在，创建房间记录
async function createRoomIfNotExists() {
    try {
        const defaultRoomName = `聊天室 ${roomCode}`;
        const { error } = await supabase
            .from('chat_rooms')
            .insert([{
                room_code: roomCode,
                room_name: defaultRoomName,
                created_at: new Date().toISOString()
            }]);
        
        if (error) {
            console.error('创建房间记录失败:', error);
        } else {
            console.log('房间记录已创建');
            document.title = defaultRoomName;
            roomNameHeader.textContent = defaultRoomName;
        }
    } catch (err) {
        console.error('创建房间记录过程中发生错误:', err);
    }
}

// 保存房间名称到Supabase
async function saveRoomName(newRoomName) {
    if (!supabase || !roomCode || !newRoomName.trim()) {
        console.error('Supabase客户端、房间号或房间名称不可用');
        return false;
    }
    
    try {
        const { error } = await supabase
            .from('chat_rooms')
            .update({ room_name: newRoomName.trim() })
            .eq('code', roomCode);
        
        if (error) {
            console.error('保存房间名称失败:', error);
            // 如果更新失败，尝试插入（房间可能刚刚被创建）
            if (error.code === 'PGRST116') {
                await createRoomIfNotExists();
                // 再次尝试更新
                const { error: updateError } = await supabase
                    .from('chat_rooms')
                    .update({ room_name: newRoomName.trim() })
                    .eq('room_code', roomCode);
                
                if (updateError) {
                    console.error('再次保存房间名称失败:', updateError);
                    return false;
                }
            } else {
                return false;
            }
        }
        
        // 更新页面标题和聊天头部
        document.title = newRoomName.trim();
        roomNameHeader.textContent = newRoomName.trim();
        console.log('房间名称已成功保存');
        return true;
    } catch (err) {
        console.error('保存房间名称过程中发生错误:', err);
        return false;
    }
}

// 用户名（随机生成一个昵称）
let username = '用户' + Math.floor(Math.random() * 10000);

// 创建Supabase客户端
async function createSupabaseClient() {
    try {
        if (window.supabase && window.supabase.createClient) {
            console.log('创建Supabase客户端，URL:', supabaseUrl);
            
            // 创建Supabase客户端配置，启用自动刷新令牌
            const options = {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                }
            };
            
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey, options);
            console.log('Supabase客户端已创建');
        } else {
            throw new Error('Supabase客户端库未加载完成');
        }
    } catch (error) {
        console.error('创建Supabase客户端失败:', error);
    }
}

// 匿名登录
async function anonymousLogin() {
    if (!supabase) {
        console.error('Supabase客户端未初始化');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.error('匿名登录失败:', error);
            // 使用模拟ID作为备份
            const mockUserId = localStorage.getItem('mock_user_id') || 'anonymous_' + Date.now();
            localStorage.setItem('mock_user_id', mockUserId);
            currentUser = { id: mockUserId, username: '匿名用户_' + Math.floor(Math.random() * 1000) };
        } else {
            console.log('匿名登录成功:', data.user);
            currentUser = data.user;
            username = '匿名用户_' + Math.floor(Math.random() * 1000);
            
            // 创建用户记录
            await createUserIfNotExists(currentUser.id);
        }
    } catch (err) {
        console.error('登录过程中发生错误:', err);
        // 使用模拟ID作为最后的备份
        const mockUserId = localStorage.getItem('mock_user_id') || 'anonymous_' + Date.now();
        localStorage.setItem('mock_user_id', mockUserId);
        currentUser = { id: mockUserId, username: '匿名用户_' + Math.floor(Math.random() * 1000) };
    }
}

// 从session恢复用户
async function restoreUserFromSession() {
    if (!supabase) {
        console.error('Supabase客户端未初始化');
        return;
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('获取用户信息失败:', error);
        } else if (user) {
            console.log('从session恢复用户成功:', user);
            currentUser = user;
            username = '匿名用户_' + Math.floor(Math.random() * 1000);
        }
    } catch (err) {
        console.error('恢复用户信息时发生错误:', err);
    }
}

// 添加用户到聊天室关联表
async function addUserToChatRoom() {
    try {
        if (!supabase || !currentUser || !roomCode) {
            console.error('Supabase客户端、用户信息或房间号不可用');
            return;
        }
        
        // 由于表结构可能只有user_id和room_code两个字段，尝试执行upsert操作
        const { error: upsertError } = await supabase
            .from('user_chat_rooms')
            .upsert(
                { user_id: currentUser.id, room_code: roomCode },
                { onConflict: ['user_id', 'room_code'] }
            );
        
        if (upsertError) {
            console.log('保存用户与聊天室关联失败（这不会影响聊天功能）:', upsertError.message);
            // 不抛出错误，允许聊天功能继续使用
        } else {
            console.log('用户与聊天室关联成功保存到user_chat_rooms表');
        }
    } catch (err) {
        console.log('添加用户到聊天室关联表过程中发生错误（这不会影响聊天功能）:', err.message);
        // 不抛出错误，允许聊天功能继续使用
    }
}

// 查询聊天记录
async function fetchChatMessages() {
    try {
        if (!supabase || !roomCode) {
            console.error('Supabase客户端或房间号不可用');
            return;
        }
        
        // 查询chat_messages表中对应房间的聊天记录
        // 按发送时间排序，只获取最近的50条消息
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_code', roomCode)
            .order('sent_at', { ascending: true })
            .limit(50);
        
        if (error) {
            console.error('查询聊天记录失败:', error);
            return;
        }
        
        console.log('成功获取聊天记录:', messages.length, '条消息');
        
        // 如果有历史消息，清空当前消息容器并显示历史消息
        if (messages && messages.length > 0) {
            // 清空消息容器
            messageContainer.innerHTML = '';
            appendSystemMessage('加载历史聊天记录...');
            
            // 收集所有需要查询的用户ID（去重）
            const uniqueUserIds = new Set();
            for (const message of messages) {
                if (currentUser && message.sender_id !== currentUser.id) {
                    uniqueUserIds.add(message.sender_id);
                }
            }
            // 批量预加载用户信息到缓存
            await preloadUserInfo(Array.from(uniqueUserIds));

            // 遍历历史消息并显示
                for (const message of messages) {
                    // 对于当前用户消息，直接显示为"我"
                    if (currentUser && message.sender_id === currentUser.id) {
                        appendSelfMessage(message.content, false, message.sent_at);
                    } else {
                        // 从缓存获取用户名，如果没有则使用默认值
                        const userInfo = userInfoCache.get(message.sender_id);
                        let messageUsername = '匿名用户';
                        
                        if (userInfo) {
                            if (typeof userInfo === 'object') {
                                messageUsername = userInfo.nickname || '匿名用户';
                            } else {
                                messageUsername = userInfo;
                            }
                        }
                        
                        appendOtherMessage(messageUsername, message.content, message.sent_at, message.sender_id);
                    }
                }
        } else {
            appendSystemMessage('暂无历史聊天记录');
        } 
    } catch (err) {
        console.error('获取聊天记录过程中发生错误:', err);
    }
}

// 预加载用户信息到缓存
async function preloadUserInfo(userIds) {
    if (!userIds || userIds.length === 0) return;
    
    try {
        // 批量查询用户信息，使用Promise.all并发查询
        await Promise.all(userIds.map(async (userId) => {
            // 如果已经在缓存中，跳过查询
            if (userInfoCache.has(userId)) return;
            
            try {
                // 尝试从anonymous_profiles表获取用户名和头像URL
                const { data: profileData } = await supabase
                    .from('anonymous_profiles')
                    .select('nickname, avatar_url')
                    .eq('user_id', userId)
                    .single();

                if (profileData && profileData.nickname) {
                    // 存储用户名和头像URL的对象
                    userInfoCache.set(userId, {
                        nickname: profileData.nickname,
                        avatar_url: profileData.avatar_url || null
                    });
                    console.log('缓存用户信息:', userId, profileData.nickname, profileData.avatar_url);
                } else {
                    // 如果没有找到，设置一个默认值
                    userInfoCache.set(userId, {
                        nickname: '匿名用户_' + userId.slice(-6),
                        avatar_url: null
                    });
                }
            console.log('成功获取其他用户信息:', userId, profileData);
            } catch (err) {
                // 出错时使用默认用户名并缓存，避免重复查询
                console.log('获取用户信息失败，使用默认用户名:', err.message);
                userInfoCache.set(userId, {
                    nickname: '匿名用户_' + userId.slice(-6),
                    avatar_url: null
                });
            }
        }));
    } catch (err) {
        console.log('批量预加载用户信息失败:', err.message);
    }
}

// 根据用户ID生成头像颜色
function getAvatarColor(userId) {
    // 使用简单的哈希算法生成颜色
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // 转换为32位整数
    }
    
    // 确保hash是正数
    hash = Math.abs(hash);
    
    // 生成较深的颜色，确保文本可见
    const hue = hash % 360;
    const saturation = 70 + (hash % 20); // 70-90%
    const lightness = 40 + (hash % 15); // 40-55%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// 根据用户ID和用户名生成头像HTML
function generateAvatarHTML(userId, username, avatarUrl = null) {
    // 确保userId不为空
    const safeUserId = userId || 'default_user';
    const color = getAvatarColor(safeUserId);
    
    // 使用用户名的第一个字符作为头像内容，如果用户名为空或无效，则使用默认字符
    let initial = '?'; // 默认字符
    if (username && username.length > 0) {
        initial = username.charAt(0).toUpperCase();
    }
    
    const avatarElement = document.createElement('div');
    avatarElement.className = 'message-avatar';
    avatarElement.style.minWidth = '36px';
    avatarElement.style.minHeight = '36px';
    
    // 优先使用用户提供的头像URL
    if (avatarUrl) {
        avatarElement.style.backgroundImage = `url(${avatarUrl})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
        // 移除文本内容和背景色
        avatarElement.textContent = '';
        avatarElement.style.backgroundColor = 'transparent';
    } else {
        // 回退到首字母头像
        avatarElement.style.backgroundColor = color;
        avatarElement.textContent = initial;
        avatarElement.style.display = 'flex';
        avatarElement.style.alignItems = 'center';
        avatarElement.style.justifyContent = 'center';
        avatarElement.style.fontSize = '14px';
        avatarElement.style.fontWeight = 'bold';
        avatarElement.style.color = 'white';
        avatarElement.style.fontFamily = 'Arial, sans-serif';
    }
    
    // 添加一些额外的样式确保头像显示正常
    avatarElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    avatarElement.style.transition = 'transform 0.2s ease';
    avatarElement.style.borderRadius = '50%';
    
    return avatarElement;
}

// 初始化函数
async function init() {
    // 等待Supabase客户端加载完成
    try {
        if (window.loadSupabaseClient) {
            console.log('调用loadSupabaseClient函数');
            await window.loadSupabaseClient();
            console.log('Supabase客户端库已加载');
            
            // 创建Supabase客户端
            await createSupabaseClient();
        } else {
            console.error('loadSupabaseClient函数不可用');
        }
    } catch (error) {
        console.error('加载Supabase客户端时出错:', error);
    }
    
    // 首先尝试从session恢复用户
    await restoreUserFromSession();
    
    // 如果没有恢复到用户，则执行匿名登录
    if (!currentUser && supabase) {
        await anonymousLogin();
    }
    
    // 添加用户到聊天室关联表
    if (supabase && currentUser) {
        await addUserToChatRoom();
        
        // 获取当前用户的头像URL
        try {
            const { data: profileData } = await supabase
                .from('anonymous_profiles')
                .select('avatar_url')
                .eq('user_id', currentUser.id)
                .single();
            
            if (profileData && profileData.avatar_url) {
                currentUser.avatar_url = profileData.avatar_url;
                console.log('已获取当前用户头像URL:', profileData.avatar_url);
            }
        } catch (err) {
            console.error('获取当前用户头像URL时出错:', err);
        }
    }
    
    // 获取房间信息并设置聊天名称
    if (supabase) {
        await fetchRoomInfo();
    }
    
    
    // 初始化GoEasy连接
    initGoEasy();
    
    // 查询并显示聊天记录
    if (supabase) {
        await fetchChatMessages();
    }
}

// 初始化GoEasy连接
function initGoEasy() {
    // 如果已有连接实例，先销毁
    if (goEasy && goEasy.isConnected()) {
        goEasy.disconnect();
    }
    
    // 创建新的GoEasy实例
    goEasy = GoEasy.getInstance({
        host: 'hangzhou.goeasy.io',
        appkey: 'BC-489877826f5649e6929d33cfb9e89b60',
        modules: ['pubsub']
    });
    
    // 建立Websocket连接
    goEasy.connect({
        onSuccess: function () {
            console.log("连接成功！");
            updateStatus("已连接到服务器");
            appendSystemMessage("连接成功，欢迎来到聊天室！");
            
            // 启用输入框和发送按钮
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
            
            // 订阅频道
            subscribeToChannel();
            
            // 发送用户加入通知
            notifyUserJoined();
        },
        onFailed: function (error) {
            console.log("连接失败：" + error.content);
            updateStatus("连接失败：" + error.content);
            appendSystemMessage("连接失败，请刷新页面重试。");
        },
        onDisconnected: function () {
            console.log("连接断开");
            updateStatus("连接已断开");
            appendSystemMessage("连接已断开，请检查网络连接。");
            
            // 禁用输入框和发送按钮
            messageInput.disabled = true;
            sendButton.disabled = true;
        },
        onProgress: function (attemptNumber, url, delay) {
            console.log("正在重连... 第" + attemptNumber + "次尝试，等待" + delay + "ms");
            updateStatus("正在重连... 第" + attemptNumber + "次尝试");
        }
    });
}

// 订阅频道
function subscribeToChannel() {
    const channelName = `chat_room_${roomCode}`;
    
    goEasy.pubsub.subscribe({
        channel: channelName,
        onMessage: function (message) {
            // 解析消息数据
            let msgData;
            try {
                msgData = JSON.parse(message.content);
            } catch (e) {
                // 如果不是JSON格式，创建一个简单的消息对象
                msgData = {
                    username: '未知用户',
                    content: message.content,
                    time: new Date().toLocaleTimeString(),
                    type: 'normal'
                };
            }
            
            // 根据消息类型处理
            switch (msgData.type) {
                case 'userJoined':
                    if (msgData.username !== username) {
                        appendSystemMessage(msgData.username + " 加入了聊天室");
                    }
                    break;
                case 'userLeft':
                    if (msgData.username !== username) {
                        appendSystemMessage(msgData.username + " 离开了聊天室");
                    }
                    break;
                default:
                    // 显示普通消息
                    // 不显示自己发送的消息，因为我们已经在sendMessage函数中显示了
                    if (msgData.username !== username) {
                        // 尝试获取发送者的实际用户名
                        if (userInfoCache.has(msgData.sender_id)) {
                            // 如果缓存中有，直接使用
                            const userInfo = userInfoCache.get(msgData.sender_id);
                            const nickname = typeof userInfo === 'object' ? userInfo.nickname : userInfo;
                            appendOtherMessage(nickname || msgData.username, msgData.content, msgData.timestamp ? new Date(msgData.timestamp) : null, msgData.sender_id);
                        } else {
                            // 如果缓存中没有，先显示原始用户名，然后尝试从数据库获取真实用户名
                            appendOtherMessage(msgData.username, msgData.content, msgData.timestamp ? new Date(msgData.timestamp) : null, msgData.sender_id);
                            
                            // 如果消息中包含sender_id，则尝试获取真实用户名和头像URL
                            if (msgData.sender_id && !userInfoCache.has(msgData.sender_id)) {
                                // 使用立即执行函数表达式处理异步操作，避免阻塞
                                (async () => {
                                    try {
                                        const { data: profileData } = await supabase
                                            .from('anonymous_profiles')
                                            .select('nickname, avatar_url')
                                            .eq('id', msgData.sender_id)
                                            .single();
                                        
                                        if (profileData) {
                                            userInfoCache.set(msgData.sender_id, {
                                                nickname: profileData.nickname || msgData.username,
                                                avatar_url: profileData.avatar_url || null
                                            });
                                        } else {
                                            userInfoCache.set(msgData.sender_id, {
                                                nickname: msgData.username,
                                                avatar_url: null
                                            });
                                        }
                                    } catch (err) {
                                        console.error('获取用户信息失败:', err);
                                        // 出错时使用默认用户名和头像URL
                                        userInfoCache.set(msgData.sender_id, {
                                            nickname: msgData.username,
                                            avatar_url: null
                                        });
                                    }
                                })();
                            }
                        }
                    }
            }
        },
        onSuccess: function () {
            console.log(`成功订阅'${channelName}'频道`);
        },
        onFailed: function (error) {
            console.log("订阅失败：" + error.content);
            appendSystemMessage("无法加入聊天室：" + error.content);
        },
        onExpired: function () {
            console.log("订阅已过期");
            appendSystemMessage("订阅已过期，正在重新订阅...");
            subscribeToChannel();
        }
    });
}

// 发送消息
function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) {
        alert("请输入消息内容！");
        return;
    }
    
    // 构造消息对象
    const messageData = {
        username: username,
        content: content,
        time: new Date().toLocaleTimeString(),
        type: 'normal',
        timestamp: new Date().toISOString() // 使用ISO格式的时间戳，与数据库保持一致
    };
    
    // 先在本地显示消息
    appendSelfMessage(content, true);
    
    // 向频道发送消息
    const channelName = `chat_room_${roomCode}`;
    goEasy.pubsub.publish({
        channel: channelName,
        message: JSON.stringify(messageData),
        onSuccess: function () {
            console.log("消息发送成功");
            
            // 保存消息到Supabase数据库
            saveMessageToDatabase(roomCode, content).then(() => {
                // 由于我们已经在本地显示了"发送中"状态的消息，
                // 但数据库中已经正确保存了消息的发送时间，
                // 我们不需要在这里再次更新时间，因为下次刷新页面时会从数据库加载正确的时间
            });
            
            showMessageStatus("消息已发送", "#4caf50");
            
            // 清空输入框
            messageInput.value = '';
            messageInput.focus();
        },
        onFailed: function (error) {
            console.log("发送失败：" + error.content);
            showMessageStatus("发送失败：" + error.content, "#f44336");
        }
    });
}

// 保存消息到Supabase数据库
async function saveMessageToDatabase(roomCode, content) {
    try {
        // 检查是否已初始化Supabase客户端
        if (!supabase) {
            console.error('Supabase客户端未初始化');
            return;
        }
        
        // 获取用户信息（auth.users.id）
        // 由于我们在init()中已经处理了用户登录，这里可以直接使用currentUser
        
        let senderId;
        if (currentUser) {
            senderId = currentUser.id;
        } else {
            console.error('用户信息不可用，使用模拟ID');
            senderId = localStorage.getItem('mock_user_id') || 'anonymous_' + Date.now();
        }
        
        // 准备要插入的数据（包含必要的四个参数）
        const newMessage = {
            room_code: roomCode,
            sender_id: senderId,
            content: content,
            sent_at: new Date().toISOString()
        };
        
        // 插入数据到public.chat_messages表
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([newMessage])
            .select();
        
        if (error) {
            console.error('保存消息到数据库失败:', error);
            // 如果是外键约束错误，尝试创建用户记录
            if (error.code === '23503') {
                console.log('检测到外键约束错误，尝试创建用户记录...');
                await createUserIfNotExists(senderId);
                // 再次尝试插入消息
                await supabase
                    .from('chat_messages')
                    .insert([newMessage])
                    .select();
            }
        } else {
            console.log('消息成功保存到数据库:', data);
        }
    } catch (err) {
        console.error('保存消息过程中发生错误:', err);
    }
}

// 如果用户不存在，创建用户记录到anonymous_profiles表
async function createUserIfNotExists(userId) {
    try {
        // 检查并创建用户到anonymous_profiles表
        const { data: profileData, error: profileError } = await supabase
            .from('anonymous_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
        
        if (profileError || !profileData) {
            await supabase
                .from('anonymous_profiles')
                .insert([{
                    id: userId,
                    nickname: '匿名用户_' + Math.floor(Math.random() * 1000),
                    created_at: new Date().toISOString()
                }]);
            console.log('匿名用户已创建到anonymous_profiles表');
        }
    } catch (err) {
        console.error('创建用户记录时出错:', err);
    }
}

// 通知用户加入
function notifyUserJoined() {
    const joinData = {
        type: 'userJoined',
        username: username,
        time: new Date().toLocaleTimeString()
    };
    
    const channelName = `chat_room_${roomCode}`;
    goEasy.pubsub.publish({
        channel: channelName,
        message: JSON.stringify(joinData),
        onSuccess: function() {
            console.log("用户加入通知发送成功");
        }
    });
}

// 通知用户离开
function notifyUserLeft() {
    const leaveData = {
        type: 'userLeft',
        username: username,
        time: new Date().toLocaleTimeString()
    };
    
    const channelName = `chat_room_${roomCode}`;
    goEasy.pubsub.publish({
        channel: channelName,
        message: JSON.stringify(leaveData),
        onSuccess: function() {
            console.log("用户离开通知发送成功");
        }
    });
}

// 辅助函数：更新状态信息
function updateStatus(message) {
    statusElement.textContent = message;
}

// 辅助函数：显示消息状态
function showMessageStatus(message, color) {
    messageStatus.textContent = message;
    messageStatus.style.color = color;
    messageStatus.style.display = "block";
    
    // 3秒后隐藏
    setTimeout(function() {
        messageStatus.style.display = "none";
    }, 3000);
}

// 辅助函数：添加系统消息
function appendSystemMessage(content) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message system';
    messageElement.textContent = content;
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// 辅助函数：添加自己发送的消息
function appendSelfMessage(content, isSending = false, timestamp = null) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message self';
    
    // 创建消息内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content-container';
    
    const contentElement = document.createElement('div');
    contentElement.textContent = content;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    
    // 如果提供了时间戳，使用该时间戳；否则使用当前时间
    if (timestamp) {
        timeElement.textContent = new Date(timestamp).toLocaleTimeString();
    } else {
        timeElement.textContent = new Date().toLocaleTimeString();
    }
    
    // 生成并添加头像，获取用户头像URL（如果有）
    const avatarUrl = currentUser && currentUser.avatar_url ? currentUser.avatar_url : null;
    const avatarElement = generateAvatarHTML(currentUser ? currentUser.id : 'self', username, avatarUrl);
    
    // 创建头像和用户名容器
    const avatarWithNameContainer = document.createElement('div');
    avatarWithNameContainer.className = 'avatar-with-name';
    avatarWithNameContainer.appendChild(avatarElement);
    
    // 添加头像和用户名容器到消息元素
    messageElement.appendChild(avatarWithNameContainer);
    
    contentContainer.appendChild(contentElement);
    contentContainer.appendChild(timeElement);
    messageElement.appendChild(contentContainer);
    
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// 辅助函数：添加他人发送的消息
function appendOtherMessage(username, content, timestamp = null, senderId = null) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message other';
    
    // 创建消息内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content-container';
    
    const contentElement = document.createElement('div');
    contentElement.textContent = content;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    
    // 如果提供了时间戳，使用该时间戳；否则使用当前时间
    if (timestamp) {
        timeElement.textContent = new Date(timestamp).toLocaleTimeString();
    } else {
        timeElement.textContent = new Date().toLocaleTimeString();
    }
    
    // 生成并添加头像，从缓存中获取头像URL（如果有）
    const avatarUserId = senderId || ('other_' + username);
    let avatarUrl = null;
    
    // 检查缓存中是否有用户信息
    if (senderId && userInfoCache.has(senderId)) {
        const userInfo = userInfoCache.get(senderId);
        if (userInfo && userInfo.avatar_url) {
            avatarUrl = userInfo.avatar_url;
        }
    }
    
    const avatarElement = generateAvatarHTML(avatarUserId, username, avatarUrl);
    
    // 创建头像和用户名容器
    const avatarWithNameContainer = document.createElement('div');
    avatarWithNameContainer.className = 'avatar-with-name';
    avatarWithNameContainer.appendChild(avatarElement);
    
    // 添加用户名元素在头像下方
    const usernameElement = document.createElement('div');
    usernameElement.className = 'message-username';
    usernameElement.textContent = username;
    avatarWithNameContainer.appendChild(usernameElement);
    
    // 添加头像和用户名容器到消息元素
    messageElement.appendChild(avatarWithNameContainer);
    
    contentContainer.appendChild(contentElement);
    contentContainer.appendChild(timeElement);
    messageElement.appendChild(contentContainer);
    
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// 辅助函数：滚动到底部
function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// 事件监听器
sendButton.addEventListener('click', sendMessage);

// 监听回车键发送消息
messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 监听页面关闭事件，发送用户离开通知
window.addEventListener('beforeunload', function() {
    notifyUserLeft();
});

// 页面加载时初始化连接
window.addEventListener('load', init);