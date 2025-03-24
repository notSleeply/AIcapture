package controller

import (
	"AIcapture/model"
	"AIcapture/util"
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tmc/langchaingo/llms"
)

type Chat struct{}

var modelName = "qwen2.5"

func (ch *Chat) DoChat(c *gin.Context) {

	var body model.Chat

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"msg": err.Error(),
		})
		return
	}

	prompt := util.CreatePrompt()

	data := map[string]any{
		"text": body.Text,
	}

	msg, _ := prompt.FormatMessages(data)

	content := []llms.MessageContent{
		llms.TextParts(msg[0].GetType(), msg[0].GetContent()),
		llms.TextParts(msg[1].GetType(), msg[1].GetContent()),
	}

	llm := util.CreateOllama(c, modelName)

	resp, err := llm.GenerateContent(context.Background(), content)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"msg": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "ok",
		"data": resp.Choices[0].Content,
	})
}
