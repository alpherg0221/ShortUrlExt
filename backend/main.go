package main

import (
	"net/http"
	"net/url"
	"strconv"
	"time"

	_ "example.com/backend/docs"
	"example.com/backend/handlers"
	"golang.org/x/crypto/acme/autocert"

	"flag"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

var (
	tls = flag.String("tls_domain", "", "domain to register let's encrypto")
)

// @title         backend
// @version       1.0
// @license.name  undamoniZ
// @BasePath      /
func main() {
	flag.Parse()

	e := echo.New()
	if len(*tls) != 0 {
		e.AutoTLSManager.HostPolicy = autocert.HostWhitelist(*tls)
		e.AutoTLSManager.Cache = autocert.DirCache(".cache")
		// e.Pre(middleware.HTTPSWWWRedirect())
	}

	e.GET("/docs/*", echoSwagger.WrapHandler)
	e.GET("/trace", trace)
	e.GET("/detail", detail)
	e.GET("/thumbnail", thumbnail)
	e.GET("/ws", ws)

	e.Use(middleware.CORS())
	e.Use(middleware.CORSWithConfig(
		middleware.CORSConfig{
			// Method
			AllowMethods: []string{
				http.MethodGet,
			},
			// Header
			AllowHeaders: []string{
				echo.HeaderOrigin,
			},
			// Origin

			AllowOrigins: []string{
				"http://localhost:8000",
				"https://github.com",
			},
		}))

	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: `${time_rfc3339_nano} ${host} ${method} ${uri} ${status} ${header:my-header}` + "\n",
	}))

	if len(*tls) != 0 {
		e.Logger.Fatal(e.StartAutoTLS(":443"))
	} else {
		e.Logger.Fatal(e.Start(":80"))
	}

}

// @Summary Trace URL from safe machines
// @Accept  json
// @Produce  json
// @Param  url query string true "URL to trace"
// @Success 200 {object} handlers.Result
// @Success 400 {object} ResponseErr
// @Success 500 {object} ResponseErr
// @Router   /trace [get]
func trace(c echo.Context) error {
	params := c.QueryParams()
	_url, err := url.Parse(params.Get("url"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, ResponseErr{Error: "invalid url"})
	}
	ret, err := handlers.Trace(_url)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ResponseErr{Error: err.Error()})
	}
	return c.JSON(http.StatusOK, ret)
}

// @Summary Get detail of previously traced URL
// @Accept  json
// @Produce  json
// @Param  token query string true "sha256(URL)"
// @Success 200 {object} handlers.Result
// @Success 400 {object} ResponseErr
// @Success 500 {object} ResponseErr
// @Router   /detail [get]
func detail(c echo.Context) error {
	params := c.QueryParams()

	ret, err := handlers.Detail(params.Get("token"), 30*time.Second)
	if err != nil {
		return c.JSON(http.StatusNotFound, ResponseErr{Error: err.Error()})
	}
	return c.JSON(http.StatusOK, ret)
}

// @Summary Get thumbnail of previously traced URL
// @Accept  json
// @Produce  json
// @Param  token query string true "sha256(URL)"
// @Param  size query int false "size of thumbnail(square, 100 < size < 800)"
// @Success 200 {object} handlers.Result
// @Success 400 {object} ResponseErr
// @Success 500 {object} ResponseErr
// @Router   /thumbnail [get]
func thumbnail(c echo.Context) error {
	params := c.QueryParams()
	size, err := strconv.ParseInt(params.Get("size"), 10, 64)
	if err != nil {
		size = 400
	}
	ret, err := handlers.Thumbnail(params.Get("token"), size, 30*time.Second)
	if err != nil {
		if err.Error() == "not found" {
			return c.JSON(http.StatusNotFound, ResponseErr{Error: err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, ResponseErr{Error: err.Error()})
	}
	return c.File(ret)
}
