from openai import OpenAI
client = OpenAI(api_key="sk-f545d93f2766414fb33a02bd20eab32a", base_url="https://api.deepseek.com")

# 用于存储会话历史的字典，键为会话ID，值为消息列表
chat_history = {}

def generate_chat_response(user_message, session_id="default"):
    """
    生成聊天回复，保持对话上下文
    
    Args:
        user_message (str): 用户消息
        session_id (str): 会话ID，用于区分不同会话
        
    Returns:
        str: AI的回复
    """
    # 如果是新会话，初始化历史记录
    if session_id not in chat_history:
        chat_history[session_id] = []
    
    # 添加用户消息到历史记录
    chat_history[session_id].append({"role": "user", "content": user_message})
    
    # 使用完整的对话历史调用API
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=chat_history[session_id]
    )
    
    # 获取AI的回复
    ai_response = response.choices[0].message
    
    # 将AI回复添加到历史记录
    chat_history[session_id].append({"role": ai_response.role, "content": ai_response.content})
    
    return ai_response.content

# 清除特定会话的历史记录
def clear_history(session_id="default"):
    if session_id in chat_history:
        chat_history[session_id] = []

# 以下代码仅作为示例测试
if __name__ == "__main__":
    print(generate_chat_response("你好啊!"))
    print(generate_chat_response("我叫张三，你叫什么名字？"))  # 将记住上下文