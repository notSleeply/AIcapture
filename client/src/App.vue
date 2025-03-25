<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const chattingContent = ref([]);
const inputText = ref('');
const sessionId = ref('');
const imageFile = ref(null);
const imagePrompt = ref('描述这张图片');

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
}
// 处理图片文件选择
function handleFileChange(event) {
    imageFile.value = event.target.files[0];
}

// 上传并分析图片
async function analyzeImage() {
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

        // 清除已选择的文件
        imageFile.value = null;
        document.getElementById('image-upload').value = '';
    } catch (error) {
        const lastMsg = chattingContent.value[chattingContent.value.length - 1];
        lastMsg.text = `图片分析失败: ${error.message}`;
        lastMsg.dateTime = new Date();
    }
}

</script>

<template>
    <div>
        <div>
            <div v-for="item of chattingContent" :key="item.content">
                <p>{{ item.name }}: {{ item.dateTime }}</p>
                <p>{{ item.text }}</p>
                <hr />
            </div>
        </div>
        <div>
            <input type="text" v-model="inputText" placeholder="输入消息..." />
            <button @click="sendMessage">发送</button>
            <button @click="clearHistory">清除历史</button>
            <div class="image-analysis">
                <h3>图片分析</h3>
                <input type="file" id="image-upload" accept="image/*" @change="handleFileChange" />
                <input type="text" v-model="imagePrompt" placeholder="如何分析这张图片?" />
                <button @click="analyzeImage" :disabled="!imageFile">分析图片</button>
            </div>
        </div>
    </div>
</template>
