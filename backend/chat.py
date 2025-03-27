from openai import OpenAI
import base64
from io import BytesIO
from PIL import Image
# 通过 pip install volcengine-python-sdk[ark] 安装方舟SDK
from volcenginesdkarkruntime import Ark

# 创建火山引擎客户端(用于视觉功能)
ark_client = Ark(
    api_key="99bab5bf-fdea-4d77-a6bc-b42ffbe2ddab"
)
# 火山引擎视觉模型ID
vision_model = "doubao-1-5-vision-pro-32k-250115"

# 创建OpenAI客户端
client = OpenAI(api_key="sk-f545d93f2766414fb33a02bd20eab32a", base_url="https://api.deepseek.com")

# 用于存储会话历史的字典，键为会话ID，值为消息列表
chat_history = {}

session_images = {}

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

# 分析图片内容 - 使用火山引擎视觉模型
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
    
    session_images[session_id] = image_data

    try:
        # 创建data URI
        image_uri = f"data:image/jpeg;base64,{image_data}"
        
        # 使用火山引擎的视觉模型
        response = ark_client.chat.completions.create(
            model=vision_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_uri}
                        }
                    ]
                }
            ]
        )
        
        # 获取AI的回复
        ai_content = response.choices[0].message.content
        
        # 添加用户消息到历史记录
        chat_history[session_id].append({
            "role": "user", 
            "content": f"{prompt} [图片]"  # 记录简化版本
        })
        
        # 添加AI回复到历史记录
        chat_history[session_id].append({
            "role": "assistant", 
            "content": ai_content
        })
        
        return ai_content
        
    except Exception as e:
        # 如果API调用失败，使用备用方案
        print(f"火山引擎视觉API调用失败: {str(e)}")
        return fallback_image_analysis(image_data, prompt, session_id)

# 处理图像对话的后续提问
def image_followup(prompt, session_id="default"):
    """
    处理图像对话的后续提问
    
    Args:
        prompt (str): 用户的后续提问
        session_id (str): 会话ID
    
    Returns:
        str: AI的回复
    """
    # 检查会话是否存在
    if session_id not in chat_history:
        return "无法找到相关的会话，请重新开始对话。"
    
    # 检查是否有保存的图片
    if session_id not in session_images:
        print(f"session_id {session_id} 没有关联图片")
        print(f"可用的session_ids: {list(session_images.keys())}")
        return "当前会话没有关联的图片，请先上传一张图片。"
    
    # 获取保存的图片
    image_data = session_images[session_id]
    
    try:
        # 创建data URI
        image_uri = f"data:image/jpeg;base64,{image_data}"
        
        # 改进错误捕获和上下文处理
        try:
            recent_messages = chat_history[session_id][-4:] if len(chat_history[session_id]) >= 4 else chat_history[session_id]
            context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in recent_messages])
        except Exception as ce:
            print(f"构建上下文失败: {str(ce)}")
            context = "无法加载上下文"
        
        # 使用火山引擎的视觉模型
        response = ark_client.chat.completions.create(
            model=vision_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"基于这张图片，请回答: {prompt}"},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_uri}
                        }
                    ]
                }
            ]
        )
        
        # 获取AI的回复
        ai_content = response.choices[0].message.content
        
        # 添加用户消息到历史记录
        chat_history[session_id].append({
            "role": "user", 
            "content": prompt
        })
        
        # 添加AI回复到历史记录
        chat_history[session_id].append({
            "role": "assistant", 
            "content": ai_content
        })
        
        return ai_content
        
    except Exception as e:
        print(f"图片追问处理失败: {str(e)}")
        import traceback
        traceback.print_exc()  # 打印详细错误堆栈
        # 如果失败了，回退到普通文字对话
        return generate_chat_response(f"关于之前的图片：{prompt}", session_id)

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
        
        # 修复：确保保存图片数据
        session_images[session_id] = image_data
        
        return analysis
        
    except Exception as e:
        return f"图像分析失败: {str(e)}"