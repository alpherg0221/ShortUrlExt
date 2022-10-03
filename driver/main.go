package main

import (
	"bufio"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"

	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
)

// https://github.com/chromedp/chromedp/issues/1053

var (
	fast      = flag.Bool("fast", false, "follow only http redirect")
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
	if *fast {
		WgetNav(*url)
	} else {
		ChromeNav(*url, *headless)
	}
}

type Info struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
}
type Output struct {
	Chains    []string `json:"chain"`
	Src       string   `json:"src"`
	Dst       string   `json:"dst"`
	Thumbnail *string  `json:"thumbnail"`
	Info      *Info    `json:"info"`
}

func WgetNav(url string) {

	cmd := exec.Command("bash", "-c", fmt.Sprintf("wget -O - '%s' --server-response 2>&1", url))

	stdout, _ := cmd.StdoutPipe()
	r := bufio.NewReader(stdout)
	cmd.Start()

	// 出力結果を取得（C言語系だとdo~whileみたいなことをしている)
	line, err := r.ReadString('\n')

	// EOFの場合は err == io.EOF となる
	urls := []string{url}
	var title string
	var description string
	for err == nil || err != io.EOF {
		// データがGET出来た場合、文字列に変換して表示
		if len(line) > 0 {
			line = line[:len(line)-1]
			if strings.HasPrefix(line, "--") {
				arr := strings.Split(line, " ")
				if len(arr) == 4 {
					urls = append(urls, arr[3])
				}
			}
			if strings.Contains(line, "Saving to") {
				break
			}
			if strings.Contains(line, "title") {
				re := regexp.MustCompile(`<title>([^<]+?)</title>`)
				matches := re.FindAllSubmatch([]byte(line), -1)
				if len(matches) > 0 {
					title = string(matches[0][1])
				}
			}
			if strings.Contains(line, "meta") {
				re := regexp.MustCompile(`<meta name="[Dd]escription" content="([^"]+?)"/?>`)
				matches := re.FindAllSubmatch([]byte(line), -1)
				if len(matches) > 0 {
					description = string(matches[0][1])
				}
			}
		}

		// 再び読み込む
		line, err = r.ReadString('\n')
	}

	o, _ := json.Marshal(Output{
		Chains: urls,
		Src:    url,
		Dst:    urls[len(urls)-1],
		Info: &Info{
			Title:       &title,
			Description: &description,
		},
	})
	print(string(o))
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

	urls := []string{url}
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
		chromedp.EmulateViewport(*width, *height), // 画質は一旦PC版フルスクリーンに固定
		chromedp.Navigate(url),
		chromedp.WaitVisible(`html`, chromedp.ByQuery),
		chromedp.FullScreenshot(&imageBuf, 300), // 品質はあまり影響がなさそう
		chromedp.Title(&title),
		// chromedp.ActionFunc(func(ctx context.Context) error {
		// 	node, err := dom.GetDocument().Do(ctx)
		// 	if err != nil {
		// 		return err
		// 	}
		// 	res, er := dom.GetOuterHTML().WithNodeID(node.NodeID).Do(ctx)
		// 	fmt.Print(res) // print HTML source code
		// 	return er
		// }),
	)

	if err != nil {
		panic(err)
	}

	if regexp.MustCompile(`.*\.png`).Match([]byte(*thumbnail)) {
		if err := ioutil.WriteFile(*thumbnail, imageBuf, 0644); err != nil {
			log.Fatal(err)
		}
		o, _ := json.Marshal(Output{
			Chains:    urls,
			Src:       url,
			Dst:       urls[len(urls)-1],
			Thumbnail: thumbnail,
			Info: &Info{
				Title: &title,
			},
		})
		println(string(o))
		return
	}
	o, _ := json.Marshal(Output{
		Chains: urls,
		Src:    url,
		Dst:    urls[len(urls)-1],
		Info: &Info{
			Title: &title,
		},
	})
	println(string(o))
}
