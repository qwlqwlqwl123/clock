// 动态加载Supabase客户端库
function loadSupabaseClient() {
    return new Promise((resolve, reject) => {
        console.log('开始加载Supabase客户端库');
        
        // 首先检查是否已经在HTML中直接引入了Supabase库
        if (window.supabase && window.supabase.createClient) {
            console.log('Supabase客户端已存在，直接使用');
            resolve(window.supabase);
            return;
        }
        
        // 尝试直接使用内联方式创建Supabase客户端
        try {
            // 从index.html中可能存在的配置获取URL和key
            const supabaseUrl = document.getElementById('supabase-url')?.getAttribute('data-url') || '';
            const supabaseKey = document.getElementById('supabase-key')?.getAttribute('data-key') || '';
            
            // 尝试加载真实的Supabase客户端库
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.type = 'text/javascript';
            script.async = false; // 同步加载，确保在继续前完成
            
            // 设置较长的超时时间，确保CDN有足够时间加载
            script.timeout = 10000; // 10秒超时
            
            script.onload = () => {
                // 尝试不同的方式获取createClient函数
                if (window.supabase && window.supabase.createClient) {
                    console.log('✅ Supabase客户端库加载成功，使用真实客户端');
                    resolve(window.supabase);
                } else if (window.createClient) {
                    console.log('✅ Supabase客户端库加载成功（通过window.createClient），使用真实客户端');
                    // 如果createClient函数在window对象上，将其包装成标准格式
                    window.supabase = { createClient: window.createClient };
                    resolve(window.supabase);
                } else {
                    console.error('❌ Supabase库加载但未找到createClient函数');
                    reject(new Error('Supabase库加载异常'));
                }
            };
            
            script.onerror = () => {
                console.error('❌ Supabase客户端库加载失败');
                reject(new Error('Supabase CDN加载失败'));
            };
            
            // 添加超时处理
            const timeoutId = setTimeout(() => {
                if (!window.supabase?.createClient && !window.createClient) {
                    console.error('❌ Supabase客户端库加载超时');
                    // 如果脚本还在加载中，移除它以避免内存泄漏
                    if (script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                    reject(new Error('Supabase库加载超时'));
                }
            }, script.timeout);
            
            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ 加载Supabase客户端时发生错误:', error);
            reject(error);
        }
    });
}

// 暴露给window，以便在其他脚本中调用
window.loadSupabaseClient = loadSupabaseClient;

// 立即加载Supabase客户端库
loadSupabaseClient().then(() => {
    console.log('Supabase客户端库初始化成功');
}).catch(error => {
    console.error('Supabase客户端库初始化失败:', error);
});