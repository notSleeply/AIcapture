package middleware

import (
	"AIcapture/controller"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	chat := controller.Chat{}
	mainGroup := r.Group("/")
	mainGroup.POST("/chat", chat.DoChat)
}
