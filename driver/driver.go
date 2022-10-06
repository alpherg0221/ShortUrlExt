package main

import (
	"fmt"
	"net/url"
	"os"
	"strconv"

	"example.com/driver/browser"
)

func driver(selector string, urlStr string, thumbnail string) browser.Result {
	_url, err := url.Parse(urlStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "url is required")
		os.Exit(1)
	}
	var ret browser.Result
	switch selector {
	case "wget":
		wget := browser.Wget{}
		ret, err = wget.Navigate(_url, browser.Options{})
		if err != nil {
			ret = browser.Result{
				Error: err.Error(),
			}
		}
	case "chrome":
		chrome := browser.Chrome{}
		opt := browser.NewOption(
			map[string]string{
				"thumbnail": thumbnail,
				"width":     strconv.FormatInt(*width, 10),
				"height":    strconv.FormatInt(*height, 10),
				"headless":  strconv.FormatBool(*headless),
			},
		)
		ret, err = chrome.Navigate(_url, opt)
		if err != nil {
			ret = browser.Result{
				Error: err.Error(),
			}
		}
	}
	return ret

}
