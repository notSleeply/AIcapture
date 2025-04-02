// 辅助函数
function $(id) { return document.getElementById(id); }

// 元素引用
const capturedImage = $('capturedImage');
const chatMessages = $('chatMessages');
const userInput = $('userInput');
const sendButton = $('sendButton');
const btnSave = $('btnSave');
const btnCopy = $('btnCopy');
const btnClose = $('btnClose');
const statusText = $('statusText');

// 状态变量
let imageData = null;
let imagePath = null;
let sessionId = null;
const API_URL = 'http://localhost:8080';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 从主进程获取图像数据
    window.myAPI.getImageData().then(data => {
        if (data && data.success) {
            if (data.imageDataUrl) {
                // 使用DataURL直接设置图片源用于预览
                capturedImage.src = data.imageDataUrl;
                console.log('图片已加载到预览区域');
                
                // 保存图片路径
                imagePath = data.imagePath;
                console.log('图片路径:', imagePath);
                
                // 显示连接状态
                showStatus("正在连接到火山引擎视觉模型...");
                
                // 自动发送第一个分析请求
                setTimeout(() => {
                    analyzeImage("请分析这张图片内容，描述你看到了什么");
                }, 500);
            } else {
                console.error('未收到有效的图片数据URL');
                showStatus("图片加载失败");
            }
        } else {
            console.error('获取图片数据失败');
            showStatus("图片加载失败");
        }
    }).catch(err => {
        console.error('获取图片数据时出错:', err);
        showStatus("图片加载出错");
    });
    
    // 事件监听器
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
    
    sendButton.addEventListener('click', handleUserInput);
    
    btnSave.addEventListener('click', saveImage);
    
    btnCopy.addEventListener('click', () => {
        // 图片已经在剪贴板中，只需提示用户
        showStatus("图片已复制到剪贴板");
    });
    
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
        
        // 提示用户可以继续提问
        showStatus("可以继续询问关于图片的问题");
        
    } catch (error) {
        console.error('分析图像时出错:', error);
        
        // 移除临时状态消息
        if (chatMessages.lastChild && chatMessages.lastChild.textContent === "正在使用火山引擎视觉大模型分析图像...") {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        addMessage(`图像分析失败: ${error.message}。请重试或检查后端服务是否正常运行。`, 'ai');
        showStatus("分析失败，请重试");
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
        showStatus("请求失败");
    }
}

// 保存图像
function saveImage() {
    window.myAPI.saveImage()
        .then(result => {
            if (result.success) {
                showStatus(`图片已保存至: ${result.filePath}`);
            } else {
                showStatus('保存图片失败');
            }
        })
        .catch(err => {
            console.error('保存图片时出错:', err);
            showStatus('保存图片失败');
        });
}

// 显示状态消息
function showStatus(message) {
    statusText.textContent = message;
    setTimeout(() => {
        statusText.textContent = '';
    }, 3000);
}

// 添加重新分析按钮
function addReanalyzeButton() {
    if (!document.getElementById('btnReanalyze')) {
        const btnReanalyze = document.createElement('button');
        btnReanalyze.id = 'btnReanalyze';
        btnReanalyze.className = 'btn btn-primary';
        btnReanalyze.textContent = '重新分析图像';
        btnReanalyze.style.marginRight = '10px';
        
        btnReanalyze.addEventListener('click', () => {
            sessionId = null; // 重置会话
            analyzeImage("请重新分析这张图片，详细描述你看到了什么");
        });
        
        // 添加到对话框底部
        const dialogFooter = document.querySelector('.dialog-footer');
        dialogFooter.insertBefore(btnReanalyze, btnSave);
    }
}
