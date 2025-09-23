// 页面元素
const loginContainer = document.getElementById('login-container');
const chatMain = document.getElementById('chat-main');
const roomCodeInput = document.getElementById('room-code');
const enterButton = document.getElementById('enter-button');
const errorMessage = document.getElementById('error-message');
const currentRoomTitle = document.getElementById('current-room-title');
const chatIframe = document.getElementById('chat-iframe');
const toggleHistoryBtn = document.getElementById('toggle-history');
const toggleProfileBtn = document.getElementById('toggle-profile');
const historyDrawer = document.getElementById('history-drawer');
const profileDrawer = document.getElementById('profile-drawer');
const closeHistoryBtn = document.getElementById('close-history');
const closeProfileBtn = document.getElementById('close-profile');
const overlay = document.getElementById('overlay');
const historyList = document.getElementById('history-list');
const logoutButton = document.getElementById('logout-button');
const profileUsername = document.getElementById('profile-username');
const profileUserid = document.getElementById('profile-userid');
const profileLastlogin = document.getElementById('profile-lastlogin');
const avatarPlaceholder = document.getElementById('avatar-placeholder');

// 个人信息设置相关元素
const nicknameInput = document.getElementById('nickname-input');
const genderSelect = document.getElementById('gender-select');
const ageInput = document.getElementById('age-input');
const regionInput = document.getElementById('region-input');
const saveProfileBtn = document.getElementById('save-profile-btn');

// Supabase 配置 - 请替换为您实际的Supabase项目信息
// 您可以在Supabase控制台的"设置" > "API"中找到这些信息
const supabaseUrl = 'https://ylzhswdqigqnrqfvtayi.supabase.co'; // 示例URL，请替换为您的Supabase项目URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsemhzd2RxaWdxbnJxZnZ0YXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNTY2ODcsImV4cCI6MjA3MzczMjY4N30.GOESBmkHwI_nZNVtjJ5lC9P9EnGwbnpYy7l-HZX2HVE'; // 示例密钥，请替换为您的anon key

// 等待Supabase客户端库加载完成后再创建客户端
let supabase = null;

// 在初始化函数中创建Supabase客户端
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

// 当前用户信息
let currentUser = null;
// 当前房间号
let currentRoomCode = null;
// 历史房间列表
let historyRooms = [];

// 初始化函数
async function init() {
    // 尝试从本地存储恢复历史房间
    loadHistoryRooms();
    
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
    
    // 设置事件监听器
    setupEventListeners();
}

// 匿名登录
async function anonymousLogin() {
    try {
        console.log('开始匿名登录过程');
        // 检查supabase对象是否已创建
        if (!supabase) {
            console.error('Supabase客户端未初始化，无法进行登录');
            return;
        }
        
        console.log('执行匿名登录');
        // 使用Supabase的匿名登录功能
        const { data, error } = await supabase.auth.signInAnonymously();
        
        if (error) {
            console.error('匿名登录失败，详细错误:', error);
            return;
        }
        
        if (data.user) {
            console.log('匿名登录成功，用户ID:', data.user.id);
            currentUser = data.user;
            updateProfileInfo();
            
            // 加载用户个人信息
            console.log('调用loadUserProfile');
            await loadUserProfile();
            
            // 保存用户登录时间
            console.log('调用saveUserLoginTime');
            await saveUserLoginTime();
        }
    } catch (error) {
        console.error('登录过程出错:', error);
    }
}

// 从本地session恢复用户
async function restoreUserFromSession() {
    try {
        if (!supabase) {
            console.warn('Supabase客户端未初始化，无法恢复会话');
            return;
        }
        
        console.log('尝试从本地会话恢复用户');
        
        // 检查是否有已保存的会话
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.warn('获取会话失败:', error);
            return;
        }
        
        if (data.session) {
            console.log('会话恢复成功');
            // 获取当前用户信息
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.warn('获取用户信息失败:', userError);
                return;
            }
            
            if (userData.user) {
                currentUser = userData.user;
                updateProfileInfo();
                
                // 加载用户个人信息
                await loadUserProfile();
                
                // 保存用户登录时间
                await saveUserLoginTime();
            }
        }
    } catch (error) {
        console.error('恢复用户会话过程出错:', error);
    }
}

// 从API获取并设置用户头像
async function fetchAndSetAvatar(userId) {
    try {
        // 清除现有内容
        avatarPlaceholder.innerHTML = '';
        
        // 显示加载状态
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'avatar-loading';
        loadingIndicator.textContent = '加载中...';
        avatarPlaceholder.appendChild(loadingIndicator);
        
        const avatarApiUrl = 'https://api.t1qq.com/api/tool/sjtx';
        const apiKey = '771jPhkLN8VhSUOwOs6Iex0vRe';
        
        // 生成唯一的ID（基于用户ID和时间戳，确保头像唯一性）
        const timestamp = Date.now();
        const uniqueId = `${userId}_${timestamp}`;
        
        // 构建请求URL，使用用户ID作为seed参数
        const requestUrl = `${avatarApiUrl}?seed=${uniqueId}&key=${apiKey}&t=${timestamp}`;
        
        // 创建图片元素
        const avatarImg = document.createElement('img');
        avatarImg.className = 'user-avatar';
        avatarImg.alt = '用户头像';
        avatarImg.style.width = '100%';
        avatarImg.style.height = '100%';
        avatarImg.style.borderRadius = '50%';
        
        // 设置加载成功和失败的处理
        avatarImg.onload = async function() {
            // 清除占位符文本
            avatarPlaceholder.textContent = '';
            // 添加图片到占位符
            while (avatarPlaceholder.firstChild) {
                avatarPlaceholder.removeChild(avatarPlaceholder.firstChild);
            }
            avatarPlaceholder.appendChild(avatarImg);
            console.log('头像加载成功');
            
            // 保存头像URL到数据库
            if (supabase && currentUser) {
                try {
                    const { error } = await supabase
                        .from('anonymous_profiles')
                        .upsert({
                            user_id: currentUser.id,
                            avatar_url: requestUrl
                        }, { onConflict: 'user_id' });
                    
                    if (error) {
                        console.error('保存头像URL到数据库失败:', error);
                    } else {
                        console.log('头像URL成功保存到数据库');
                    }
                } catch (dbError) {
                    console.error('保存头像URL过程中发生异常:', dbError);
                }
            }
        };
        
        avatarImg.onerror = function() {
            console.warn('头像加载失败，使用默认文本头像');
            // 从用户ID生成头像文字
            const avatarText = userId.substring(0, 2).toUpperCase();
            avatarPlaceholder.textContent = avatarText;
        };
        
        // 设置图片源
        avatarImg.src = requestUrl;
    } catch (error) {
        console.error('获取头像过程出错:', error);
        // 出错时使用默认文本头像
        const avatarText = userId.substring(0, 2).toUpperCase();
        avatarPlaceholder.textContent = avatarText;
    }
}

// 更新个人信息显示
function updateProfileInfo(profileData = null) {
    if (currentUser) {
        // 清除现有内容
        avatarPlaceholder.innerHTML = '';
        
        // 检查是否有保存的头像URL
        if (profileData && profileData.avatar_url) {
            console.log('使用数据库中的头像URL:', profileData.avatar_url);
            
            // 创建图片元素
            const avatarImg = document.createElement('img');
            avatarImg.className = 'user-avatar';
            avatarImg.alt = '用户头像';
            avatarImg.style.width = '100%';
            avatarImg.style.height = '100%';
            avatarImg.style.borderRadius = '50%';
            
            // 设置加载成功和失败的处理
            avatarImg.onload = function() {
                // 清除占位符文本
                avatarPlaceholder.textContent = '';
                // 添加图片到占位符
                while (avatarPlaceholder.firstChild) {
                    avatarPlaceholder.removeChild(avatarPlaceholder.firstChild);
                }
                avatarPlaceholder.appendChild(avatarImg);
                console.log('头像加载成功');
            };
            
            avatarImg.onerror = function() {
                console.warn('使用数据库中的头像URL加载失败，从API重新获取');
                // 从API重新获取头像
                fetchAndSetAvatar(currentUser.id);
            };
            
            // 设置图片源
            avatarImg.src = profileData.avatar_url;
        } else {
            // 没有保存的头像URL，从API获取
            fetchAndSetAvatar(currentUser.id);
        }
        
        // 获取上次登录时间
        const lastLoginTime = localStorage.getItem('lastLoginTime') || '首次登录';
        profileLastlogin.textContent = lastLoginTime;
        
        // 如果有个人信息数据，使用它更新UI
        if (profileData) {
            // 更新显示的用户名
            if (profileData.nickname) {
                profileUsername.textContent = profileData.nickname;
                nicknameInput.value = profileData.nickname;
            } else {
                profileUsername.textContent = `用户${currentUser.id.substring(0, 8)}`;
                nicknameInput.value = '';
            }
            
            // 设置表单中的值
            if (profileData.gender) {
                genderSelect.value = profileData.gender;
            } else {
                genderSelect.value = '';
            }
            if (profileData.age) {
                ageInput.value = profileData.age;
            } else {
                ageInput.value = '';
            }
            if (profileData.region) {
                regionInput.value = profileData.region;
            } else {
                regionInput.value = '';
            }
        } else {
            // 如果没有个人信息数据，使用默认值
            profileUsername.textContent = `用户${currentUser.id.substring(0, 8)}`;
            nicknameInput.value = '';
            genderSelect.value = '';
            ageInput.value = '';
            regionInput.value = '';
        }
        
        // 更新用户ID显示
        profileUserid.textContent = currentUser.id.substring(0, 10) + '...';
    }
}

// 保存用户登录时间和个人信息
async function saveUserLoginTime() {
    const now = new Date();
    const formattedTime = now.toLocaleString('zh-CN');
    
    // 保存到本地存储
    localStorage.setItem('lastLoginTime', formattedTime);
    
    // 尝试保存到Supabase数据库（如果数据库已设置）
    try {
        // 检查supabase对象是否已创建
        if (!supabase) {
            console.warn('Supabase客户端未初始化，仅保存到本地存储');
            return;
        }
        
        if (currentUser) {
            // 注意：请确保您的Supabase数据库中已创建名为'anonymous_profiles'的表
            // 表结构建议包含：user_id (主键), last_login (时间戳类型), nickname (文本类型), gender (文本类型), age (整数类型), region (文本类型)
            const { error } = await supabase
                .from('anonymous_profiles')
                .upsert({
                    user_id: currentUser.id,
                    last_login: now.toISOString()
                });
            
            if (error) {
                console.error('保存登录时间到数据库失败:', error.message, '详细错误:', error);
            } else {
                console.log('登录时间成功保存到数据库');
            }
        }
    } catch (error) {
        console.error('保存登录时间过程中发生异常:', error);
        // 忽略错误，因为本地存储已经保存了
    }
}

// 加载用户个人信息
async function loadUserProfile() {
    try {
        // 检查supabase对象是否已创建
        if (!supabase) {
            console.warn('Supabase客户端未初始化，无法加载个人信息');
            return;
        }
        
        if (currentUser) {
            console.log('尝试从数据库加载个人信息，用户ID:', currentUser.id);
            // 从数据库加载个人信息，包括avatar_url
            const { data, error } = await supabase
                .from('anonymous_profiles')
                .select('nickname, gender, age, region, avatar_url')
                .eq('user_id', currentUser.id)
                .single();
            
            if (error) {
                console.error('加载个人信息失败，详细错误:', error);
                return;
            }
            
            console.log('成功加载个人信息:', data);
            // 更新个人信息显示
            if (data) {
                updateProfileInfo(data);
            }
        }
    } catch (error) {
        console.error('加载个人信息过程出错:', error);
    }
}

// 保存用户个人信息
async function saveUserProfile() {
    try {
        // 检查supabase对象是否已创建
        if (!supabase) {
            console.error('Supabase客户端未初始化，无法保存个人信息');
            return;
        }
        
        if (!currentUser) {
            console.error('用户未登录，无法保存个人信息');
            return;
        }
        
        // 获取表单数据
        const nickname = nicknameInput.value.trim();
        const gender = genderSelect.value;
        const age = ageInput.value ? parseInt(ageInput.value) : null;
        const region = regionInput.value.trim();
        
        // 简单的表单验证
        if (nickname && nickname.length > 20) {
            alert('昵称不能超过20个字符');
            return;
        }
        
        if (age && (age < 1 || age > 149)) {
            alert('请输入有效的年龄（1-149岁）');
            return;
        }
        
        // 构建要保存的数据对象
        const profileData = {
            user_id: currentUser.id,
            updated_at: new Date().toISOString()
        };
        
        // 只包含有值的字段
        if (nickname) profileData.nickname = nickname;
        if (gender) profileData.gender = gender;
        if (age) profileData.age = age;
        if (region) profileData.region = region;
        
        // 保存到Supabase数据库
        const { error } = await supabase
            .from('anonymous_profiles')
            .upsert(profileData, { onConflict: 'user_id' });
        
        if (error) {
            console.error('Supabase upsert错误详细信息:', error);
            throw new Error(`保存个人信息失败: ${error.message}`);
        }
        
        // 保存成功后刷新个人信息显示
        await loadUserProfile();
        
        // 显示成功提示
        alert('个人信息保存成功');
    } catch (error) {
        console.error('保存个人信息过程出错:', error);
        alert(`保存失败: ${error.message}`);
    }
}
    
// 验证并进入聊天室
async function enterChatRoom() {
    const roomCode = roomCodeInput.value.trim();
    
    // 验证是否为4位数字
    if (!/^\d{4}$/.test(roomCode)) {
        showError('请输入4位数字的房间号');
        return;
    }
    
    // 检查Supabase客户端是否已创建
    if (supabase && currentUser) {
        try {
            // 检查房间是否已存在
            const { data: existingRoom, error: fetchError } = await supabase
                .from('chat_rooms')
                .select('room_name, created_at')
                .eq('code', roomCode)
                .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') {
                // 如果不是'资源未找到'的错误，则显示错误
                console.error('获取房间信息失败:', fetchError);
                showError(`获取房间信息失败: ${fetchError.message}`);
                return;
            }
            
            if (existingRoom) {
                // 房间已存在，使用房间名称
                currentRoomCode = roomCode;
                currentRoomTitle.textContent = existingRoom.room_name || `聊天室 ${roomCode}`;
                console.log('房间已存在，房间名称:', existingRoom.room_name);
            } else {
                // 房间不存在，创建新房间
                const now = new Date();
                const { data: newRoom, error: createError } = await supabase
                    .from('chat_rooms')
                    .insert({
                        code: roomCode,
                        room_name: `聊天室 ${roomCode}`,
                        created_at: now.toISOString()
                    })
                    .select()
                    .single();
                
                if (createError) {
                    console.error('创建房间失败:', createError);
                    showError(`创建房间失败: ${createError.message}`);
                    return;
                }
                
                currentRoomCode = roomCode;
                currentRoomTitle.textContent = newRoom.room_name;
                console.log('新房间创建成功:', newRoom.room_name);
            }
        } catch (error) {
            console.error('处理房间信息时出错:', error);
            showError(`处理房间信息时出错: ${error.message}`);
            return;
        }
    } else {
        // 如果没有Supabase客户端，使用默认行为
        currentRoomCode = roomCode;
        currentRoomTitle.textContent = `聊天室 ${roomCode}`;
    }
    
    // 隐藏登录界面，显示聊天室
    loginContainer.style.display = 'none';
    chatMain.style.display = 'flex';
    
    // 设置iframe的src，传递房间号参数
    chatIframe.src = `./chat_room.html?room=${roomCode}`;
    
    // 添加到历史记录
    addToHistory(roomCode);
}

// 添加房间到历史记录
function addToHistory(roomCode) {
    const now = new Date();
    const timestamp = now.toISOString();
    const formattedTime = now.toLocaleTimeString();
    
    // 检查是否已存在该房间
    const existingIndex = historyRooms.findIndex(room => room.code === roomCode);
    
    if (existingIndex !== -1) {
        // 更新现有记录的时间
        historyRooms[existingIndex].timestamp = timestamp;
        historyRooms[existingIndex].time = formattedTime;
    } else {
        // 添加新记录
        historyRooms.unshift({
            code: roomCode,
            timestamp: timestamp,
            time: formattedTime
        });
        
        // 最多保存10条历史记录
        if (historyRooms.length > 10) {
            historyRooms.pop();
        }
    }
    
    // 保存到本地存储
    saveHistoryRooms();
    
    // 更新历史记录显示
    updateHistoryList();
}

// 从本地存储加载历史记录
function loadHistoryRooms() {
    const saved = localStorage.getItem('historyRooms');
    if (saved) {
        try {
            historyRooms = JSON.parse(saved);
            updateHistoryList();
        } catch (e) {
            console.error('加载历史记录失败:', e);
            historyRooms = [];
        }
    }
}

// 保存历史记录到本地存储
function saveHistoryRooms() {
    localStorage.setItem('historyRooms', JSON.stringify(historyRooms));
}

// 更新历史记录列表显示
function updateHistoryList() {
    historyList.innerHTML = '';
    
    if (historyRooms.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'history-list-item';
        emptyItem.textContent = '暂无历史记录';
        emptyItem.style.cursor = 'default';
        emptyItem.style.opacity = '0.6';
        historyList.appendChild(emptyItem);
    } else {
        historyRooms.forEach(room => {
            const listItem = document.createElement('li');
            listItem.className = 'history-list-item';
            
            const roomInfo = document.createElement('div');
            roomInfo.textContent = `聊天室 ${room.code}`;
            
            const timeInfo = document.createElement('div');
            timeInfo.textContent = room.time;
            timeInfo.style.fontSize = '12px';
            timeInfo.style.color = '#999';
            
            listItem.appendChild(roomInfo);
            listItem.appendChild(timeInfo);
            
            // 添加点击事件
            listItem.addEventListener('click', () => {
                // 关闭抽屉
                toggleHistoryDrawer();
                
                // 进入选中的房间
                roomCodeInput.value = room.code;
                enterChatRoom();
            });
            
            historyList.appendChild(listItem);
        });
    }
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // 3秒后自动隐藏错误消息
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// 显示详细的Supabase错误信息
function showSupabaseError(operation, error) {
    let errorDetails = `Supabase ${operation}失败: ${error.message}`;
    
    // 尝试提取更详细的错误信息
    if (error.code) {
        errorDetails += `\n错误代码: ${error.code}`;
    }
    if (error.details) {
        errorDetails += `\n详细信息: ${error.details}`;
    }
    if (error.hint) {
        errorDetails += `\n提示: ${error.hint}`;
    }
    
    console.error(errorDetails);
    showError(errorDetails);
}

// 切换历史抽屉
function toggleHistoryDrawer() {
    historyDrawer.classList.toggle('open');
    overlay.style.display = historyDrawer.classList.contains('open') ? 'block' : 'none';
}

// 切换个人信息抽屉
function toggleProfileDrawer() {
    profileDrawer.classList.toggle('open');
    overlay.style.display = profileDrawer.classList.contains('open') ? 'block' : 'none';
}

// 关闭所有抽屉
function closeAllDrawers() {
    historyDrawer.classList.remove('open');
    profileDrawer.classList.remove('open');
    overlay.style.display = 'none';
}

// 退出登录
function logout() {
    try {
        if (supabase) {
            // 清除Supabase会话
            supabase.auth.signOut();
        }
        
        // 清除本地用户信息
        localStorage.removeItem('lastLoginTime');
        
        // 重定向到登录页面
        window.location.reload();
    } catch (error) {
        console.error('退出登录失败:', error);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 进入按钮点击事件
    enterButton.addEventListener('click', enterChatRoom);
    
    // 输入框回车事件
    roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enterChatRoom();
        }
    });
    
    // 输入框输入事件，只允许输入数字
    roomCodeInput.addEventListener('input', () => {
        // 移除非数字字符
        roomCodeInput.value = roomCodeInput.value.replace(/[^0-9]/g, '');
    });
    
    // 切换历史抽屉
    toggleHistoryBtn.addEventListener('click', toggleHistoryDrawer);
    closeHistoryBtn.addEventListener('click', toggleHistoryDrawer);
    
    // 切换个人信息抽屉
    toggleProfileBtn.addEventListener('click', toggleProfileDrawer);
    closeProfileBtn.addEventListener('click', toggleProfileDrawer);
    
    // 点击遮罩层关闭所有抽屉
    overlay.addEventListener('click', closeAllDrawers);
    
    // 退出登录
    logoutButton.addEventListener('click', logout);
    
    // 保存个人信息
    saveProfileBtn.addEventListener('click', saveUserProfile);
}

// 页面加载完成后初始化
window.addEventListener('load', init);