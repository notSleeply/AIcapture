<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const chattingContent = ref([]);
const inputText = ref('');
const sessionId = ref('');
const imageFile = ref(null);
const imagePrompt = ref('描述这张图片');
const activeImageSession = ref(false);
const lastImageData = ref(null);

// 检查本地存储中是否有会话ID
onMounted(() => {
    const savedSessionId = localStorage.getItem('chat_session_id');
    if (savedSessionId) {
        sessionId.value = savedSessionId;
    }
});

const sendMessage = () => {
    if (!inputText.value.length) return
    createMessage(inputText.value);
}

async function createMessage(text) {
    inputText.value = '';

    const msgME = {
        name: "ME",
        text,
        dateTime: new Date()
    }

    const msgAI = {
        name: "AI",
        text: "...",
        dateTime: "..."
    }

    chattingContent.value = [...chattingContent.value, msgME, msgAI];

    // 发送请求时包含会话ID
    const { data } = await axios.post('http://localhost:8080/chat', {
        text,
        session_id: sessionId.value
    });

    // 保存服务器返回的会话ID
    if (data.session_id) {
        sessionId.value = data.session_id;
        localStorage.setItem('chat_session_id', data.session_id);
    }

    const lastMsg = chattingContent.value[chattingContent.value.length - 1];

    lastMsg.text = data.data;
    lastMsg.dateTime = new Date();
}

// 清除聊天历史
function clearHistory() {
    if (sessionId.value) {
        axios.post('http://localhost:8080/clear-history', {
            session_id: sessionId.value
        });
    }
    chattingContent.value = [];
    activeImageSession.value = false;
    lastImageData.value = null;
    imageFile.value = null;
    if (document.getElementById('image-upload')) {
        document.getElementById('image-upload').value = '';
    }
    imagePrompt.value = '描述这张图片';
}
// 处理图片文件选择
function handleFileChange(event) {
    if (event.target && event.target.files && event.target.files.length > 0) {
        imageFile.value = event.target.files[0];
        activeImageSession.value = false;
        imagePrompt.value = '描述这张图片';
    }
}

// 上传并分析图片
async function analyzeImage() {
    if (activeImageSession.value && !imageFile.value && imagePrompt.value) {
        const followUpPrompt = imagePrompt.value;

        // 创建用户消息
        const msgME = {
            name: "ME",
            text: `[图片追问] ${followUpPrompt}`,
            dateTime: new Date()
        };

        const msgAI = {
            name: "AI",
            text: "思考中...",
            dateTime: "..."
        };

        chattingContent.value = [...chattingContent.value, msgME, msgAI];

        try {
            // 发送对已分析图片的追问
            const { data } = await axios.post('http://localhost:8080/image-followup', {
                prompt: followUpPrompt,
                session_id: sessionId.value
            });

            // 更新AI回复
            const lastMsg = chattingContent.value[chattingContent.value.length - 1];
            lastMsg.text = data.data;
            lastMsg.dateTime = new Date();

            // 清空提示，准备下一个问题
            imagePrompt.value = '';
        } catch (error) {
            const lastMsg = chattingContent.value[chattingContent.value.length - 1];
            lastMsg.text = `分析失败: ${error.message}`;
            lastMsg.dateTime = new Date();
        }

        return;
    }

    if (!imageFile.value) return;

    const formData = new FormData();
    formData.append('file', imageFile.value);
    formData.append('prompt', imagePrompt.value || '描述这张图片');

    if (sessionId.value) {
        formData.append('session_id', sessionId.value);
    }

    // 创建用户消息
    const msgME = {
        name: "ME",
        text: `[图片上传] ${imagePrompt.value || '描述这张图片'}`,
        dateTime: new Date()
    };

    const msgAI = {
        name: "AI",
        text: "正在分析图片...",
        dateTime: "..."
    };

    chattingContent.value = [...chattingContent.value, msgME, msgAI];

    try {
        // 读取图片为base64以保存
        const reader = new FileReader();
        reader.readAsDataURL(imageFile.value);

        reader.onload = async (e) => {
            // 存储图片数据，以便后续使用
            lastImageData.value = e.target.result.split(',')[1]; // 移除data:image/jpeg;base64,前缀
        };

        const { data } = await axios.post('http://localhost:8080/analyze-image',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        // 保存服务器返回的会话ID
        if (data.session_id) {
            sessionId.value = data.session_id;
            localStorage.setItem('chat_session_id', data.session_id);
        }

        const lastMsg = chattingContent.value[chattingContent.value.length - 1];
        lastMsg.text = data.data;
        lastMsg.dateTime = new Date();

        // 激活图像会话模式
        activeImageSession.value = true;

        // 清除图片文件（但保持会话活跃）
        imageFile.value = null;
        document.getElementById('image-upload').value = '';

        // 更新提示占位符，鼓励用户提出更多问题
        imagePrompt.value = '';
    } catch (error) {
        const lastMsg = chattingContent.value[chattingContent.value.length - 1];
        lastMsg.text = `图片分析失败: ${error.message}`;
        lastMsg.dateTime = new Date();

        // 重置图像会话状态
        activeImageSession.value = false;
    }
}

</script>

<template>
    <div>
        <div class="chat-container">
            <div v-for="item of chattingContent" :key="item.content">
                <p>{{ item.name }}: {{ item.dateTime }}</p>
                <p>{{ item.text }}</p>
                <hr />
            </div>
        </div>
        <div class="input-container">
            <input type="text" v-model="inputText" placeholder="输入消息..." />
            <button @click="sendMessage">发送</button>
            <button @click="clearHistory">清除历史</button>
            <div class="image-analysis">
                <h3>图片分析</h3>
                <input type="file" id="image-upload" accept="image/*" @change="handleFileChange" />
                <input type="text" v-model="imagePrompt"
                    :placeholder="activeImageSession ? '继续提问关于图片...' : '分析一下这张图片'" />
                <button @click="analyzeImage" :disabled="!imageFile && !activeImageSession">
                    {{ activeImageSession && !imageFile ? '继续提问' : '分析图片' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-container {
    max-height: 500px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #ccc;
    margin-bottom: 20px;
}

.input-container {
    padding: 10px;
}

.image-analysis {
    margin-top: 15px;
    padding: 10px;
    border-top: 1px solid #eee;
}
</style>