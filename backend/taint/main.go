package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"regexp"
	"time"

	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
)

// https://github.com/chromedp/chromedp/issues/1053

var (
	headless  = flag.Bool("headless", true, "chrome visibility")
	url       = flag.String("url", "", "url to visit")
	thumbnail = flag.String("thumbnail", "", "set output filename if you want thumbnail. ignore except .png path")
	width     = flag.Int64("width", 1920, "width of thumbnail")
	height    = flag.Int64("height", 1080, "height of thumbnail")
)

func main() {
	flag.Parse()
	if len(*url) == 0 {
		fmt.Fprintf(os.Stderr, "url is required")
		os.Exit(1)
	}
	ChromeNav(*url, *headless)
}

type Output struct {
	Chains    []string `json:"chain"`
	Src       string   `json:"src"`
	Dst       string   `json:"dst"`
	Thumbnail string   `json:"thumbnail"`
}

func ChromeNav(url string, headless bool) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", headless), // headless=false に変更
		chromedp.Flag("disable-gpu", false),
		chromedp.Flag("enable-automation", false),
		chromedp.Flag("disable-extensions", false),
		chromedp.Flag("hide-scrollbars", false),
		chromedp.Flag("start-fullscreen", true),
		chromedp.Flag("mute-audio", false))

	ctx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel = chromedp.NewContext(ctx)
	defer cancel()

	// Note: it's generally a bad idea to use a context timeout on the first Run call, as it will stop the entire browser
	// see https://github.com/chromedp/chromedp/blob/b88710e33da89f65c9ed750381125aea3922254c/chromedp.go#L258-L264
	ctx, cancel = context.WithTimeout(ctx, 50*time.Second)
	defer cancel()

	// for stopping the listener from receiving any more events
	// see https://github.com/chromedp/chromedp/blob/b88710e33da89f65c9ed750381125aea3922254c/chromedp.go#L693-L701
	eventCtx, cancelEvent := context.WithCancel(ctx)
	defer cancelEvent()

	urls := []string{}
	var requestID network.RequestID
	chromedp.ListenTarget(eventCtx, func(ev interface{}) {
		if ev, ok := ev.(*network.EventRequestWillBeSent); ok {
			if requestID == "" {
				// is it a reliable way to determine the initial request?
				if ev.Type == "Document" {
					requestID = ev.RequestID
				} else {
					return
				}
			}

			if ev.RequestID == requestID {
				urls = append(urls, ev.Request.URL)
			}
		}
	})

	var imageBuf []byte
	err := chromedp.Run(ctx,
		chromedp.EmulateViewport(*width, *height), // 画質は一旦PC版フルスクリーンに固定
		chromedp.Navigate(url),
		chromedp.WaitVisible(`html`, chromedp.ByQuery),
		chromedp.FullScreenshot(&imageBuf, 300), // 品質はあまり影響がなさそう
	)

	if err != nil {
		panic(err)
	}
	cancelEvent()

	if regexp.MustCompile(`.*\.png`).Match([]byte(*thumbnail)) {
		if err := ioutil.WriteFile(*thumbnail, imageBuf, 0644); err != nil {
			log.Fatal(err)
		}
		o, _ := json.Marshal(Output{
			Chains:    urls,
			Src:       url,
			Dst:       urls[len(urls)-1],
			Thumbnail: *thumbnail,
		})
		println(string(o))
		return
	}
	o, _ := json.Marshal(Output{
		Chains: urls,
		Src:    url,
		Dst:    urls[len(urls)-1],
	})
	println(string(o))
}
