package browser

import (
	"context"
	"encoding/base64"
	"net/url"
	"time"

	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
)

type Chrome struct{}

func (chrome Chrome) Navigate(_url *url.URL, opt Options) (Result, error) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", opt.Bool("headless", false)), // headless=false に変更
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

	urls := []string{_url.String()}
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
	var title string
	var imageBuf []byte
	err := chromedp.Run(ctx,
		chromedp.EmulateViewport(opt.Int("width", 1920), opt.Int("width", 1080)), // 画質は一旦PC版フルスクリーンに固定
		chromedp.Navigate(_url.String()),
		chromedp.WaitVisible(`html`, chromedp.ByQuery),
		chromedp.FullScreenshot(&imageBuf, 300), // 品質はあまり影響がなさそう
		chromedp.Title(&title),
	)

	if err != nil {
		return Result{}, err
	}
	thumbnail := opt.String("thumbnail", "")
	if thumbnail != "" {
		return Result{
			FromURL:   _url.String(),
			TermURL:   urls[len(urls)-1],
			Chains:    urls,
			Thumbnail: thumbnail,
			Info: SiteInfo{
				Title:       title,
				Description: "",
			},
			ThumbnailData: base64.StdEncoding.EncodeToString(imageBuf),
		}, nil
	}
	return Result{
		FromURL: _url.String(),
		TermURL: urls[len(urls)-1],
		Chains:  urls,
		Info: SiteInfo{
			Title:       title,
			Description: "",
		},
	}, nil
}
