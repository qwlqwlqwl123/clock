// 初始化GoEasy对象
let goEasy = null;

// 页面元素
const statusElement = document.getElementById('status');
const messageContainer = document.getElementById('messageContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messageStatus = document.getElementById('messageStatus');

// 从URL获取房间号
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room') || 'default';

// 设置页面标题和聊天头部
document.title = `聊天室 ${roomCode}`;
document.querySelector('.chat-header').textContent = `聊天室 ${roomCode}`;

// 用户名（随机生成一个昵称）
const username = '用户' + Math.floor(Math.random() * 10000);

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
                    if (msgData.username === username) {
                        appendSelfMessage(msgData.content);
                    } else {
                        appendOtherMessage(msgData.username, msgData.content);
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
        timestamp: Date.now()
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
            saveMessageToDatabase(roomCode, content);
            
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
        // 尝试获取Supabase客户端实例
        // 1. 先尝试从父窗口获取（因为chat_room.js在iframe中运行）
        let supabaseClient = null;
        
        // 检查父窗口是否有supabase实例
        if (window.parent && window.parent.supabase) {
            console.log('从父窗口获取Supabase客户端');
            supabaseClient = window.parent.supabase;
        } 
        // 2. 如果父窗口没有，检查当前窗口是否有
        else if (window.supabase && window.supabase.createClient) {
            console.log('从当前窗口获取Supabase客户端');
            // 使用与主应用相同的Supabase配置信息
            const supabaseUrl = 'https://ylzhswdqigqnrqfvtayi.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemhzd2RxaWdxbnJxZnZ0YXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTY2ODcsImV4cCI6MjA3MzczMjY4N30.GOESBmkHwI_nZNVtjJ5lC9P9EnGwbnpYy7l-HZX2HVE';
            
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        } 
        // 3. 如果都没有，尝试动态加载Supabase库
        else {
            console.log('尝试动态加载Supabase库');
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
            
            if (window.supabase && window.supabase.createClient) {
                const supabaseUrl = 'https://ylzhswdqigqnrqfvtayi.supabase.co';
                const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemhzd2RxaWdxbnJxZnZ0YXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTY2ODcsImV4cCI6MjA3MzczMjY4N30.GOESBmkHwI_nZNVtjJ5lC9P9EnGwbnpYy7l-HZX2HVE';
                
                supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            } else {
                console.error('无法加载Supabase客户端');
                return;
            }
        }
        
        // 如果还是没有Supabase客户端，返回
        if (!supabaseClient) {
            console.error('Supabase客户端未加载');
            return;
        }
        
        // 获取用户信息（auth.users.id）
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        
        let senderId;
        if (userError || !userData.user) {
            // 如果获取用户信息失败，尝试匿名登录
            const { data: signInData, error: signInError } = await supabaseClient.auth.signInAnonymously();
            
            if (signInError || !signInData.user) {
                console.error('无法获取用户信息，使用模拟ID:', signInError);
                // 如果匿名登录也失败，使用模拟ID
                senderId = localStorage.getItem('mock_user_id') || 'anonymous_' + Date.now();
            } else {
                senderId = signInData.user.id;
            }
        } else {
            senderId = userData.user.id;
        }
        
        // 准备要插入的数据（只包含必要的三个参数）
        const newMessage = {
            room_code: roomCode,
            sender_id: senderId,
            content: content
        };
        
        // 插入数据到public.chat_messages表
        const { data, error } = await supabaseClient
            .from('chat_messages')
            .insert([newMessage])
            .select();
        
        if (error) {
            console.error('保存消息到数据库失败:', error);
            // 如果是外键约束错误，尝试创建用户记录
            if (error.code === '23503') {
                console.log('检测到外键约束错误，尝试创建用户记录...');
                await createUserIfNotExists(supabaseClient, senderId);
                // 再次尝试插入消息
                await supabaseClient
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

// 如果用户不存在，创建用户记录
async function createUserIfNotExists(supabase, userId) {
    try {
        // 检查并创建用户到anonymous_profiles表
        const { data: profileData, error: profileError } = await supabase
            .from('anonymous_profiles')
            .select('id')
            .eq('id', userId)
            .single();
        
        if (profileError || !profileData) {
            await supabase
                .from('anonymous_profiles')
                .insert([{
                    id: userId,
                    username: '匿名用户_' + Math.floor(Math.random() * 1000),
                    created_at: new Date().toISOString()
                }]);
            console.log('匿名用户已创建到anonymous_profiles表');
        }
        
        // 检查并创建用户到users表（以满足外键约束）
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
        
        if (!userData) {
            await supabase
                .from('users')
                .insert([{
                    id: userId,
                    username: '匿名用户_' + Math.floor(Math.random() * 1000),
                    created_at: new Date().toISOString()
                }]);
            console.log('用户已创建到users表');
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
function appendSelfMessage(content, isSending = false) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message self';
    
    const contentElement = document.createElement('div');
    contentElement.textContent = content;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);
    messageContainer.appendChild(messageElement);
    scrollToBottom();
}

// 辅助函数：添加他人发送的消息
function appendOtherMessage(username, content) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message other';
    
    const usernameElement = document.createElement('div');
    usernameElement.style.fontWeight = 'bold';
    usernameElement.style.marginBottom = '4px';
    usernameElement.textContent = username;
    
    const contentElement = document.createElement('div');
    contentElement.textContent = content;
    
    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = new Date().toLocaleTimeString();
    
    messageElement.appendChild(usernameElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timeElement);
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
window.addEventListener('load', initGoEasy);