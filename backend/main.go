package main

import (
	"AIcapture/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.Use(middleware.Cors())
	middleware.SetupRouter(r)

	r.Run()
}
