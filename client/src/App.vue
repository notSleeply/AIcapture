<script setup>
import { ref } from 'vue';
import axios from 'axios';

const chattingContent = ref([]);
const inputText = ref('');

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

    const { data } = await axios.post('http://localhost:8080/chat', {
        text
    });

    const lastMsg = chattingContent.value[chattingContent.value.length - 1];

    lastMsg.text = data.data;
    lastMsg.dateTime = new Date();

}

/**
 * [
 *   {
 *     name: "ME | AI",
 *     text: ...
 *     dateTime: new Date()
 *   }
 *   {
 *     name: "ME | AI",
 *     text: ...
 *     dateTime: new Date()
 *   }
 * ]
 */
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
    </div>
</div>
</template>
