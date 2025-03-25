from openai import OpenAI
import base64
from io import BytesIO
from PIL import Image

# 创建OpenAI客户端
client = OpenAI(api_key="sk-f545d93f2766414fb33a02bd20eab32a", base_url="https://api.deepseek.com")

# 用于存储会话历史的字典，键为会话ID，值为消息列表
chat_history = {}

# 生成聊天回复，保持对话上下文
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

# 分析图片内容
def analyze_image(image_data, prompt="描述这张图片", session_id="default"):
    """
    分析图片内容
    
    Args:
        image_data (str): Base64编码的图片数据
        prompt (str): 提示词，告诉AI如何分析图片
        session_id (str): 会话ID
        
    Returns:
        str: 分析结果
    """
    # 如果是新会话，初始化历史记录
    if session_id not in chat_history:
        chat_history[session_id] = []
    
    try:
        # 准备包含图片的消息
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        }
                    }
                ]
            }
        ]
        
        # 使用支持视觉的模型
        response = client.chat.completions.create(
            model="DeepSeek-VL",  # 假设使用支持视觉的模型，请确认API支持
            messages=messages
        )
        
        # 获取AI的回复
        ai_response = response.choices[0].message
        
        # 添加用户消息到历史记录
        chat_history[session_id].append({
            "role": "user", 
            "content": f"{prompt} [图片]"  # 记录简化版本
        })
        
        # 添加AI回复到历史记录
        chat_history[session_id].append({
            "role": ai_response.role, 
            "content": ai_response.content
        })
        
        return ai_response.content
        
    except Exception as e:
        # 如果API不支持图像处理，可以实现备用方案
        return fallback_image_analysis(image_data, prompt, session_id)

# 备选方案：图像分析
def fallback_image_analysis(image_data, prompt, session_id):
    """备用的图像分析方法"""
    try:
        # 解码base64图片
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
        # 获取基本图像信息
        width, height = image.size
        format_type = image.format
        mode = image.mode
        
        # 构造分析结果
        analysis = f"图片分析结果:\n尺寸: {width}x{height}像素\n格式: {format_type}\n模式: {mode}"
        
        # 添加到聊天历史
        chat_history[session_id].append({"role": "user", "content": f"{prompt} [图片]"})
        chat_history[session_id].append({"role": "assistant", "content": analysis})
        
        return analysis
        
    except Exception as e:
        return f"图像分析失败: {str(e)}"