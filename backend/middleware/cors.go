package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

var origins = []string{
	"http://localhost:5173",
	"http://localhost:3000",
}

func Cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")

		for _, o := range origins {
			if o == origin {
				c.Header("Access-Control-Allow-Origin", origin)
				c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,HEAD")
				c.Header("Access-Control-Allow-Headers", "Content-Type")

				if c.Request.Method == "OPTIONS" {
					c.JSON(http.StatusOK, "")
					c.Abort()
					return
				}

				c.Next()
			}
		}
	}
}
