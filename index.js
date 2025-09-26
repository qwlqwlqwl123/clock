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
const avatarPlaceholder = document.getElementById('avatar-placeholder');

// API 密钥 - 使用随机头像的API密钥
const API_KEY = '771jPhkLN8VhSUOwOs6Iex0vRe';

// 个人信息设置相关元素
const nicknameInput = document.getElementById('nickname-input');
const genderSelect = document.getElementById('gender-select');
const ageInput = document.getElementById('age-input');
const regionInput = document.getElementById('region-input');
const saveProfileBtn = document.getElementById('save-profile-btn');

// 表单验证状态
let formValid = false;

// 表单输入验证函数
function validateForm() {
    const nickname = nicknameInput.value.trim();
    const age = ageInput.value;

    // 昵称验证：可以为空或最多20个字符
    const nicknameValid = !nickname || nickname.length <= 20;

    // 年龄验证：可以为空或在1-149之间的数字
    const ageValid = !age || (/^\d+$/.test(age) && parseInt(age) >= 1 && parseInt(age) <= 149);

    // 更新输入框样式
    updateInputStyle(nicknameInput, nicknameValid);
    updateInputStyle(ageInput, ageValid);

    // 更新表单整体验证状态
    formValid = nicknameValid && ageValid;

    // 更新保存按钮状态
    updateSaveButtonState();

    return formValid;
}

// 更新输入框样式
function updateInputStyle(inputElement, isValid) {
    if (inputElement.value.trim() === '') {
        // 空输入框，移除所有验证样式
        inputElement.classList.remove('valid', 'invalid');
        return;
    }

    if (isValid) {
        inputElement.classList.remove('invalid');
        inputElement.classList.add('valid');
    } else {
        inputElement.classList.remove('valid');
        inputElement.classList.add('invalid');
    }
}

// 更新保存按钮状态
function updateSaveButtonState() {
    saveProfileBtn.disabled = !formValid;
}

// 添加表单输入动画效果
function addFormInputAnimation(element) {
    element.classList.add('input-focus');
    setTimeout(() => {
        element.classList.remove('input-focus');
    }, 300);
}

// 初始化表单事件监听器
function initFormEventListeners() {
    // 为表单输入添加验证事件
    nicknameInput.addEventListener('input', validateForm);
    ageInput.addEventListener('input', validateForm);

    // 添加输入框聚焦动画
    nicknameInput.addEventListener('focus', function () { addFormInputAnimation(this); });
    genderSelect.addEventListener('focus', function () { addFormInputAnimation(this); });
    ageInput.addEventListener('focus', function () { addFormInputAnimation(this); });

    // 保存按钮点击动画
    saveProfileBtn.addEventListener('click', function () {
        if (!this.disabled) {
            this.classList.add('saving');
            setTimeout(() => {
                this.classList.remove('saving');
            }, 500);
        }
    });

    // 初始验证表单
    validateForm();
}

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

            // 创建真实的Supabase客户端
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey, options);
            console.log('Supabase客户端已创建，尝试连接到数据库...');
            
            // 测试连接是否正常工作
            try {
                // 执行一个简单的查询来验证连接
                const { data, error } = await supabase
                    .from('chat_rooms')
                    .select('code')
                    .limit(1);
                
                if (error) {
                    console.warn('Supabase连接测试遇到问题:', error.message);
                } else {
                    console.log('✅ Supabase数据库连接成功，可以正常执行查询');
                }
            } catch (testError) {
                console.warn('Supabase连接测试失败:', testError.message, '将继续使用客户端但可能有连接问题');
            }
        } else {
            console.error('❌ Supabase客户端库未加载完成或不完整');
            throw new Error('Supabase客户端库未加载完成');
        }
    } catch (error) {
        console.error('❌ 创建Supabase客户端失败:', error);
    }
}

// 当前用户信息
let currentUser = null;
// 当前房间号
let currentRoomCode = null;
// 历史房间列表
let historyRooms = [];

// 设置房间标题并使其可编辑
function setupEditableRoomTitle(roomName, roomCode) {
    currentRoomTitle.textContent = roomName || `聊天室 ${roomCode}`;
    
    // 设置为可编辑
    currentRoomTitle.contentEditable = "true";
    currentRoomTitle.style.cursor = "text";
    currentRoomTitle.style.outline = "none";
    
    // 保存原始文本，用于取消编辑
    currentRoomTitle.setAttribute("data-original-text", currentRoomTitle.textContent);
    
    // 添加点击事件，当用户点击时进入编辑模式
    currentRoomTitle.addEventListener('click', function() {
        this.classList.add('editing');
    });
    
    // 添加失去焦点事件，当用户完成编辑后保存房间名
    currentRoomTitle.addEventListener('blur', async function() {
        this.classList.remove('editing');
        
        const newRoomName = this.textContent.trim();
        const originalText = this.getAttribute('data-original-text');
        
        // 如果文本没有变化，不需要保存
        if (newRoomName === originalText) {
            return;
        }
        
        // 如果新文本为空，恢复原始文本
        if (!newRoomName) {
            this.textContent = originalText;
            return;
        }
        
        // 保存房间名到Supabase
        if (supabase && currentRoomCode) {
            try {
                const { data, error } = await supabase
                    .from('chat_rooms')
                    .update({ room_name: newRoomName })
                    .eq('code', currentRoomCode)
                    .select();
                
                if (error) {
                    console.error('保存房间名失败:', error);
                    // 如果保存失败，恢复原始文本
                    this.textContent = originalText;
                } else {
                    console.log('房间名保存成功:', data);
                    // 更新原始文本属性
                    this.setAttribute('data-original-text', newRoomName);
                }
            } catch (err) {
                console.error('保存房间名过程中发生错误:', err);
                // 如果发生错误，恢复原始文本
                this.textContent = originalText;
            }
        }
    });
    
    // 添加键盘事件，支持Enter键保存，Esc键取消
    currentRoomTitle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            // 阻止默认行为，避免插入换行符
            e.preventDefault();
            // 失去焦点，触发保存
            this.blur();
        } else if (e.key === 'Escape') {
            // 阻止默认行为
            e.preventDefault();
            // 恢复原始文本
            this.textContent = this.getAttribute('data-original-text');
            // 失去焦点
            this.blur();
        }
    });
}

// 从图片中提取主色调
function extractDominantColor(img) {
    try {
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置canvas尺寸
        canvas.width = 100;
        canvas.height = 100;

        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 获取图片数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 简单的颜色统计 - 计算所有像素的平均值
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            // 跳过透明像素
            if (alpha > 10) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                pixelCount++;
            }
        }

        if (pixelCount > 0) {
            // 计算平均颜色
            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);

            // 将RGB转换为HEX
            const hexColor = rgbToHex(r, g, b);

            // 根据主色调调整网页风格
            updateWebsiteStyle(hexColor);
        }
    } catch (error) {
        console.error('提取主色调失败:', error);
    }
}

// RGB转HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// 根据主色调更新网页风格
function updateWebsiteStyle(dominantColor) {
    try {
        // 更新主要元素的颜色风格
        const primaryElements = document.querySelectorAll(
            '.chat-header, .save-profile-btn, .enter-button, .btn-secondary, .profile-edit-form input:focus, .profile-edit-form select:focus'
        );

        primaryElements.forEach(element => {
            // 对于渐变背景的元素，我们可以设置基础颜色
            if (element.classList.contains('chat-header') ||
                element.classList.contains('save-profile-btn') ||
                element.classList.contains('enter-button')) {
                // 保持原有渐变但调整基础色调
                const style = window.getComputedStyle(element);
                const backgroundImage = style.backgroundImage;
                if (backgroundImage.includes('linear-gradient')) {
                    // 这里可以更复杂地处理渐变，但为了简单起见，我们只更新按钮等纯色元素
                    if (element.classList.contains('btn-secondary')) {
                        element.style.backgroundColor = `${dominantColor}33`; // 添加透明度
                    }
                }
            } else {
                // 对于其他元素，直接设置边框或焦点颜色
                if (element === document) return;
                if (element.matches('input:focus, select:focus')) {
                    // 这里通过CSS变量处理会更好，但为了简单起见，我们直接在JS中处理
                }
            }
        });

        // 设置CSS变量，供CSS使用
        document.documentElement.style.setProperty('--primary-color', dominantColor);
        document.documentElement.style.setProperty('--primary-color-light', `${dominantColor}88`);
        document.documentElement.style.setProperty('--primary-color-transparent', `${dominantColor}33`);
    } catch (error) {
        console.error('更新网页风格失败:', error);
    }
}

// 初始化函数
async function init() {
    // 尝试从本地存储恢复历史房间
    loadHistoryRooms();

    // 初始化表单事件监听器
    initFormEventListeners();

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

            // 从API获取地区信息
            console.log('获取地区信息');
            await fetchUserRegion();

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

                // 从API获取地区信息
                console.log('获取地区信息');
                await fetchUserRegion();

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

// 加载用户个人信息后加载历史聊天室
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

            // 如果没有从数据库获取到地区信息，从API获取
            if (!data || !data.region) {
                console.log('未从数据库获取到地区信息，从API获取');
                await fetchUserRegion();
            }

            // 加载用户的历史聊天室
            await loadUserChatRooms();
        }
    } catch (error) {
        console.error('加载个人信息过程出错:', error);
    }
}

// 从API获取并设置用户头像
async function fetchAndSetAvatar(userId) {
    try {
        // 获取现有的头像图片元素
        const existingAvatarImg = document.getElementById('user-avatar');

        // 清除现有内容，但保留头像图片元素
        avatarPlaceholder.innerHTML = '';
        if (existingAvatarImg) {
            avatarPlaceholder.appendChild(existingAvatarImg);
        } else {
            // 如果不存在，创建新的头像图片元素
            const newAvatarImg = document.createElement('img');
            newAvatarImg.id = 'user-avatar';
            newAvatarImg.className = 'user-avatar';
            newAvatarImg.alt = '用户头像';
            newAvatarImg.style.width = '100%';
            newAvatarImg.style.height = '100%';
            newAvatarImg.style.borderRadius = '50%';
            avatarPlaceholder.appendChild(newAvatarImg);
        }

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

        // 获取头像图片元素
        const avatarImg = document.getElementById('user-avatar');

        // 设置加载成功和失败的处理
        avatarImg.onload = async function () {
            // 显示头像图片
            avatarImg.style.display = 'block';
            // 移除加载指示器
            const loadingEl = avatarPlaceholder.querySelector('.avatar-loading');
            if (loadingEl) {
                avatarPlaceholder.removeChild(loadingEl);
            }
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

        avatarImg.onerror = function () {
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
        // 保留现有的头像图片元素
        const existingAvatarImg = document.getElementById('user-avatar');
        avatarPlaceholder.innerHTML = '';
        if (existingAvatarImg) {
            avatarPlaceholder.appendChild(existingAvatarImg);
        } else {
            // 如果不存在，创建新的头像图片元素
            const newAvatarImg = document.createElement('img');
            newAvatarImg.id = 'user-avatar';
            newAvatarImg.className = 'user-avatar';
            newAvatarImg.alt = '用户头像';
            newAvatarImg.style.width = '100%';
            newAvatarImg.style.height = '100%';
            newAvatarImg.style.borderRadius = '50%';
            avatarPlaceholder.appendChild(newAvatarImg);
        }

        // 检查是否有保存的头像URL
        if (profileData && profileData.avatar_url) {
            console.log('使用数据库中的头像URL:', profileData.avatar_url);

            // 获取头像图片元素
            const avatarImg = document.getElementById('user-avatar');

            // 设置加载成功和失败的处理
            avatarImg.onload = function () {
                // 显示头像图片
                avatarImg.style.display = 'block';
                console.log('头像加载成功');
            };

            avatarImg.onerror = function () {
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

        // 保存上次登录时间到本地存储（但不显示）
        const lastLoginTime = localStorage.getItem('lastLoginTime') || '首次登录';

        // 如果有个人信息数据，使用它更新UI
        if (profileData) {
            // 设置表单中的值
            if (profileData.nickname) {
                nicknameInput.value = profileData.nickname;
            } else {
                nicknameInput.value = '';
            }

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
            nicknameInput.value = '';
            genderSelect.value = '';
            ageInput.value = '';
            regionInput.value = '';
        }

        // 设置输入框为禁用状态，只有点击修改信息按钮才启用
        nicknameInput.disabled = true;
        genderSelect.disabled = true;
        ageInput.disabled = true;
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
        const { data, error } = await supabase
            .from('anonymous_profiles')
            .upsert(profileData, { onConflict: 'user_id', returning: 'representation' });
        console.log('Supabase upsert结果 - 数据:', data, '错误:', error);

        if (error) {
            console.error('Supabase upsert错误详细信息:', error);
            throw new Error(`保存个人信息失败: ${error.message}`);
        } else {
            console.log('Supabase upsert成功，返回数据:', data);
        }

        // 保存成功后刷新个人信息显示
        await loadUserProfile();

        // 恢复按钮状态
        if (saveProfileBtn) {
            saveProfileBtn.textContent = '修改信息';
            // 移除保存事件监听器，重新添加修改事件监听器
            saveProfileBtn.removeEventListener('click', saveUserProfile);
            saveProfileBtn.addEventListener('click', function () {
                // 让昵称、性别、年龄变为可编辑状态
                nicknameInput.disabled = false;
                genderSelect.disabled = false;
                ageInput.disabled = false;

                // 聚焦到第一个输入框
                nicknameInput.focus();

                // 更改按钮文本为"保存"
                this.textContent = '保存';

                // 移除当前事件监听器，添加保存事件监听器
                this.removeEventListener('click', arguments.callee);
                this.addEventListener('click', saveUserProfile);
            });
        }

        // 显示成功提示
        alert('个人信息保存成功');
    } catch (error) {
        console.error('保存个人信息过程出错:', error);
        alert(`保存失败: ${error.message}`);

        // 出错时也恢复按钮状态
        if (saveProfileBtn) {
            saveProfileBtn.textContent = '修改信息';
            // 移除保存事件监听器，重新添加修改事件监听器
            saveProfileBtn.removeEventListener('click', saveUserProfile);
            saveProfileBtn.addEventListener('click', function () {
                // 让昵称、性别、年龄变为可编辑状态
                nicknameInput.disabled = false;
                genderSelect.disabled = false;
                ageInput.disabled = false;

                // 聚焦到第一个输入框
                nicknameInput.focus();

                // 更改按钮文本为"保存"
                this.textContent = '保存';

                // 移除当前事件监听器，添加保存事件监听器
                this.removeEventListener('click', arguments.callee);
                this.addEventListener('click', saveUserProfile);
            });
        }
    }
}

// 从API获取用户IP地址和地区信息
async function fetchUserRegion() {
    try {
        // 显示加载状态
        if (regionInput) {
            regionInput.value = '加载中...';
        }

        // 第一步：获取客户端IP地址
        let clientIp = '';
        try {
            // 使用免费的IP获取服务
            const ipResponse = await fetch('https://api.ipify.org?format=json', {
                method: 'GET',
                timeout: 5000
            });
            const ipData = await ipResponse.json();
            clientIp = ipData.ip;
            console.log('获取到的客户端IP:', clientIp);
        } catch (ipError) {
            console.warn('获取IP地址失败，使用默认IP:', ipError);
            // 如果获取IP失败，使用示例IP
            clientIp = '121.8.215.106';
        }

        // 第二步：使用获取到的IP调用指定的API获取位置信息
        const apiUrl = `https://api.vore.top/api/IPdata?ip=${clientIp}`;

        // 发送请求
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            // 设置超时
            timeout: 5000
        });

        const data = await response.json();

        console.log('地区API响应:', data);

        // 处理响应数据
        if (data.code === 200 && data.data) {
            // 提取地区信息
            const { country, province, city } = data.data;
            let regionText = '';

            // 构建地区文本
            if (country) regionText += country;
            if (province) {
                regionText += regionText ? ` ${province}` : province;
            }
            if (city) {
                regionText += regionText ? ` ${city}` : city;
            }

            // 如果没有获取到具体地区信息，使用默认值
            if (!regionText) {
                regionText = '未知地区';
            }

            // 更新UI
            if (regionInput) {
                regionInput.value = regionText;
            }

            return regionText;
        } else {
            console.error('获取地区信息失败:', data.msg || '未知错误');

            // 显示默认地区或错误信息
            if (regionInput) {
                regionInput.value = '获取失败';
            }

            return '未知地区';
        }
    } catch (error) {
        console.error('获取地区信息过程中发生异常:', error);

        // 显示错误信息
        if (regionInput) {
            regionInput.value = '获取失败';
        }

        return '未知地区';
    }
}

// 将用户添加到聊天室关联表
async function addUserToChatRoom(roomCode) {
    try {
        // 检查supabase对象是否已创建以及用户是否已登录
        if (!supabase || !currentUser) {
            console.warn('Supabase客户端未初始化或用户未登录，无法保存用户与聊天室关联');
            return;
        }

        const now = new Date();

        // 检查是否已存在关联记录
        const { data: existingRelation, error: fetchError } = await supabase
            .from('user_chat_rooms')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('room_code', roomCode)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // 如果不是'资源未找到'的错误，则记录错误但继续执行
            console.error('查询用户与聊天室关联失败:', fetchError);
        } else if (!existingRelation) {
            // 如果不存在关联记录，创建新关联
            const { error: insertError } = await supabase
                .from('user_chat_rooms')
                .insert({
                    user_id: currentUser.id,
                    room_code: roomCode,
                    joined_at: now.toISOString()
                });

            if (insertError) {
                console.error('保存用户与聊天室关联失败:', insertError);
            } else {
                console.log('用户与聊天室关联成功保存到user_chat_rooms表');
            }
        } else {
            // 如果已存在关联记录，更新最后访问时间
            const { error: updateError } = await supabase
                .from('user_chat_rooms')
                .update({
                    last_accessed_at: now.toISOString()
                })
                .eq('user_id', currentUser.id)
                .eq('room_code', roomCode);

            if (updateError) {
                console.error('更新用户与聊天室关联失败:', updateError);
            } else {
                console.log('用户与聊天室关联已更新');
            }
        }
    } catch (error) {
        console.error('处理用户与聊天室关联时出错:', error);
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
                // currentRoomTitle.textContent = existingRoom.room_name || `聊天室 ${roomCode}`;
                setupEditableRoomTitle(existingRoom.room_name, roomCode);
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
                // currentRoomTitle.textContent = newRoom.room_name;
                setupEditableRoomTitle(newRoom.room_name, roomCode);
                console.log('新房间创建成功:', newRoom.room_name);
            }

            // 用户与聊天室的关联操作现在在chat_room.html中执行
        } catch (error) {
            console.error('处理房间信息时出错:', error);
            showError(`处理房间信息时出错: ${error.message}`);
            return;
        }
    } else {
        // 如果没有Supabase客户端，使用默认行为
        currentRoomCode = roomCode;
        // currentRoomTitle.textContent = `聊天室 ${roomCode}`;
        setupEditableRoomTitle(null, roomCode);
    }

    // 隐藏登录界面，显示聊天室
    loginContainer.style.display = 'none';
    chatMain.style.display = 'flex';
    console.log('已进入聊天室');

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
    
    // 获取房间名称，如果有设置的话
    let roomName = `聊天室 ${roomCode}`;
    if (currentRoomCode === roomCode && currentRoomTitle && currentRoomTitle.textContent) {
        roomName = currentRoomTitle.textContent;
    }

    if (existingIndex !== -1) {
        // 更新现有记录的时间
        historyRooms[existingIndex].timestamp = timestamp;
        historyRooms[existingIndex].time = formattedTime;
        historyRooms[existingIndex].name = roomName;
    } else {
        // 添加新记录
        historyRooms.unshift({
            code: roomCode,
            timestamp: timestamp,
            time: formattedTime,
            name: roomName
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

    // 如果用户已登录且Supabase客户端已初始化，从数据库加载历史聊天室
    if (currentUser && supabase) {
        loadUserChatRooms();
    }
}

// 从Supabase数据库加载用户的历史聊天室
async function loadUserChatRooms() {
    try {
        if (!supabase || !currentUser) {
            console.warn('Supabase客户端未初始化或用户未登录，无法加载历史聊天室');
            return;
        }

        console.log('从数据库加载用户的历史聊天室');

        // 从user_chat_rooms表查询用户的历史聊天室，使用JOIN获取房间名称，按最后访问时间降序排序
        const { data, error } = await supabase
            .from('user_chat_rooms')
            .select('room_code, joined_at, chat_rooms(room_name)')
            .eq('user_id', currentUser.id)
            ;

        if (error) {
            console.error('查询用户历史聊天室失败:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('成功加载历史聊天室:', data);

            // 合并数据库中的记录与本地存储的记录
            data.forEach(dbRoom => {
                const existingIndex = historyRooms.findIndex(room => room.code === dbRoom.room_code);
                const timestamp = dbRoom.last_accessed_at || dbRoom.joined_at;
                const formattedTime = new Date(timestamp).toLocaleTimeString();
                // 获取房间名称
                const roomName = dbRoom.chat_rooms?.room_name || `聊天室 ${dbRoom.room_code}`;

                if (existingIndex !== -1) {
                    // 更新现有记录的时间和名称
                    historyRooms[existingIndex].timestamp = timestamp;
                    historyRooms[existingIndex].time = formattedTime;
                    historyRooms[existingIndex].name = roomName;
                } else {
                    // 添加新记录
                    historyRooms.unshift({
                        code: dbRoom.room_code,
                        timestamp: timestamp,
                        time: formattedTime,
                        name: roomName
                    });
                }
            });

            // 确保历史记录不超过10条
            if (historyRooms.length > 10) {
                historyRooms = historyRooms.slice(0, 10);
            }

            // 保存更新后的历史记录到本地存储
            saveHistoryRooms();

            // 更新历史记录显示
            updateHistoryList();
        }
    } catch (error) {
        console.error('加载用户历史聊天室过程出错:', error);
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
            // 显示格式：房间名 [房间号]
            const roomNameDisplay = room.name ? room.name : `聊天室`;
            roomInfo.textContent = `${roomNameDisplay} [${room.code}]`;

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

    // 如果历史抽屉打开且用户已登录，从数据库重新加载历史聊天室
    if (historyDrawer.classList.contains('open') && currentUser && supabase) {
        loadUserChatRooms();
    }
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

    // 修改信息按钮点击事件 - 让表单元素变为可编辑状态
    saveProfileBtn.addEventListener('click', function () {
        // 让昵称、性别、年龄变为可编辑状态
        nicknameInput.disabled = false;
        genderSelect.disabled = false;
        ageInput.disabled = false;

        // 聚焦到第一个输入框
        nicknameInput.focus();

        // 更改按钮文本为"保存"
        this.textContent = '保存';

        // 移除当前事件监听器，添加保存事件监听器
        this.removeEventListener('click', arguments.callee);
        this.addEventListener('click', saveUserProfile);
    });
}

// 页面加载完成后初始化
window.addEventListener('load', init);