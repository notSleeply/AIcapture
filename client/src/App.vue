<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const chattingContent = ref([]);
const inputText = ref('');
const sessionId = ref('');

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

async function createMessage (text) {
    inputText.value = '';

    const msgME = {
        name:"ME",
        text,
        dateTime: new Date()
    }

    const msgAI = {
        name: "AI",
        text: "...",
        dateTime: "..."
    }

    chattingContent.value = [ ...chattingContent.value, msgME, msgAI ];

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
        <input type="text" v-model="inputText" />
        <button @click="sendMessage">发送</button>
        <button @click="clearHistory">清除历史</button>
    </div>
</div>
</template>
