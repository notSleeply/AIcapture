// 辅助函数
function $(id) { return document.getElementById(id); }

// 元素引用
const capturedImage = $('capturedImage');
const chatMessages = $('chatMessages');
const userInput = $('userInput');
const sendButton = $('sendButton');
const btnClose = $('btnClose');
const statusText = $('statusText');

// 状态变量
let imageData = null;
let imagePath = null;
let sessionId = null;
const API_URL = 'http://localhost:8080';
const Presets =
  "请对图片内容进行详尽分析。若图片是代码界面，详细解读代码逻辑，包括变量、函数、语句功能等，框选部分（若有）需逐行剖析；若是图表，阐述图表类型、数据趋势、关键数据点及代表意义；若是实物图片，说明物品名称、用途、特性等相关信息；若是场景图，描述场景构成元素、氛围、可能的地点或事件；若存在箭头指示，明确指出箭头指向的对象及关联信息；若有框选区域，精准说明框选部分的具体内容及在整体中的作用，其他部分用一句概括一下就行，主要介绍框选部分。";

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 从主进程获取图像数据
    window.myAPI.getImageData().then(data => {
        if (data && data.success) {
            if (data.imageDataUrl) {
                // 使用DataURL直接设置图片源用于预览
                capturedImage.src = data.imageDataUrl;
                
                // 保存图片路径
                imagePath = data.imagePath;
                
                // 自动发送第一个分析请求
                setTimeout(() => {
                    analyzeImage(Presets);
                }, 500);
            } else {
                console.error('未收到有效的图片数据URL');
            }
        } else {
            console.error('获取图片数据失败');
        }
    }).catch(err => {
        console.error('获取图片数据时出错:', err);
    });
    
    // 事件监听器
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
    
    sendButton.addEventListener('click', handleUserInput);
    
    btnClose.addEventListener('click', () => {
        window.myAPI.closeDialog();
    });
    
    // 在初始化完成后添加重新分析按钮
    setTimeout(addReanalyzeButton, 1000);
});

// 处理用户输入
function handleUserInput() {
    const text = userInput.value.trim();
    if (!text) return;
    
    // 添加用户消息到聊天区域
    addMessage(text, 'user');
    
    // 清空输入框
    userInput.value = '';
    
    // 如果已经有会话ID，发送后续问题，否则分析图像
    if (sessionId) {
        sendFollowupQuestion(text);
    } else {
        analyzeImage(text);
    }
}

// 添加消息到聊天区域
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加加载指示器
function addLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = 'loadingIndicator';
    
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    loadingDiv.appendChild(indicator);
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
}

// 分析图像 - 使用火山引擎视觉模型
async function analyzeImage(prompt) {
    try {
        // 添加初始状态消息
        addMessage("正在分析图像...", "ai");
        
        // 如果没有图片路径，则报错
        if (!imagePath) {
            throw new Error('没有有效的图片路径');
        }
        
        // 读取图片文件并转换为Base64
        const base64Image = await readFileAsBase64(imagePath);
        
        // 创建文件对象 - 从base64字符串创建Blob
        const binaryString = atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const imageBlob = new Blob([bytes], { type: 'image/jpeg' });
        
        // 准备表单数据
        const formData = new FormData();
        formData.append('prompt', prompt);
        
        // 使用名为file的参数，与后端API一致
        formData.append('file', imageBlob, 'screenshot.jpg');
        
        // 可选：如果后端需要session_id
        if (sessionId) {
            formData.append('session_id', sessionId);
        }
        
        // 发送到后端
        const apiResponse = await fetch(`${API_URL}/analyze-image`, {
            method: 'POST',
            body: formData
        });
        
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text().catch(() => '');
            throw new Error(`后端API错误: ${apiResponse.status} ${errorText || apiResponse.statusText}`);
        }
        
        const result = await apiResponse.json();
        
        // 移除临时消息
        if (chatMessages.lastChild && chatMessages.lastChild.textContent === "正在使用火山引擎视觉大模型分析图像...") {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // 保存会话ID
        sessionId = result.session_id;
        console.log(`已建立会话 ID: ${sessionId}`);
        
        // 显示AI回复
        addMessage(result.data, 'ai');
        

        
    } catch (error) {
        console.error('分析图像时出错:', error);
        
        // 移除临时状态消息
        if (chatMessages.lastChild && chatMessages.lastChild.textContent === "正在使用火山引擎视觉大模型分析图像...") {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        addMessage(`图像分析失败: ${error.message}。请重试或检查后端服务是否正常运行。`, 'ai');
    }
}

// 读取文件为Base64格式
async function readFileAsBase64(filePath) {
    try {
        // 由于浏览器环境无法直接读取文件系统，需要通过IPC请求主进程读取文件
        const result = await window.myAPI.readFileAsBase64(filePath);
        if (!result.success) {
            throw new Error(result.error || '读取文件失败');
        }
        return result.data;
    } catch (error) {
        console.error('读取文件为Base64失败:', error);
        throw error;
    }
}

// 发送后续问题 - 使用火山引擎视觉模型的上下文能力
async function sendFollowupQuestion(question) {
    try {
        
        // 添加临时状态消息
        addMessage("正在处理问题...", "ai");
        
        // 调用后端API
        const response = await fetch(`${API_URL}/image-followup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: question,
                session_id: sessionId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`后端API错误: ${response.status} ${errorData.detail || response.statusText}`);
        }
        
        const result = await response.json();
        
        // 移除加载指示器和临时消息
        if (document.getElementById('loadingIndicator')) {
            chatMessages.removeChild(document.getElementById('loadingIndicator'))
        }
        
        // 移除临时状态消息
        if (chatMessages.lastChild && chatMessages.lastChild.textContent === "正在处理问题...") {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // 显示AI回复
        addMessage(result.data, 'ai');
        
    } catch (error) {
        console.error('发送后续问题时出错:', error);
        
        if (document.getElementById('loadingIndicator')) {
            chatMessages.removeChild(document.getElementById('loadingIndicator'));
        }
        
        // 移除临时状态消息
        if (chatMessages.lastChild && chatMessages.lastChild.textContent === "正在处理问题...") {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        let errorMessage = '问题处理失败，请重试';
        
        // 如果是会话ID错误，提示用户重新分析图像
        if (error.message.includes("会话") || error.message.includes("session")) {
            errorMessage = "会话已过期，请点击重新分析按钮或尝试新的问题";
            // 重置会话ID
            sessionId = null;
        }
        
        addMessage(errorMessage, 'ai');
    }
}