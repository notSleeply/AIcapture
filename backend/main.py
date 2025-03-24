from fastapi import FastAPI, HTTPException, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chat import generate_chat_response, clear_history
import uuid
from typing import Optional

app = FastAPI()

# 添加CORS中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求和响应模型
class ChatRequest(BaseModel):
    text: str
    session_id: Optional[str] = None  # 可选的会话ID

class ChatResponse(BaseModel):
    data: str
    session_id: str  # 返回会话ID给客户端

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """处理聊天请求，返回AI回复"""
    try:
        # 使用提供的会话ID或生成新的
        session_id = request.session_id or str(uuid.uuid4())
        
        response = generate_chat_response(request.text, session_id)
        return ChatResponse(data=response, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clear-history")
async def clear_chat_history(session_id: str = None):
    """清除特定会话的历史记录"""
    clear_history(session_id)
    return {"status": "success", "message": f"已清除会话 {session_id} 的历史记录"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
