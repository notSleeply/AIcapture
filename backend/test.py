import os
# 通过 pip install volcengine-python-sdk[ark] 安装方舟SDK
from volcenginesdkarkruntime import Ark

# Model ID
model="doubao-1-5-vision-pro-32k-250115"


# 初始化Ark客户端，
client = Ark(
    api_key="99bab5bf-fdea-4d77-a6bc-b42ffbe2ddab",
    )

# 创建一个对话请求
response = client.chat.completions.create(
    # 指定您部署了视觉理解大模型的推理接入点ID
    model = model,
    messages = [
        {
            # 指定消息的角色为用户
            "role": "user",  
            "content": [  
                # 文本消息，希望模型根据图片信息回答的问题
                {"type": "text", "text": "支持输入是图片的模型系列是哪个？"},  
                # 图片信息，希望模型理解的图片
                {"type": "image_url", "image_url": {"url":  "https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_1.png"}
                },
            ],
        }
    ],
)

print(response.choices[0].message.content)