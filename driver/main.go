package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"net/url"
	"os"
	"sync"

	"example.com/driver/browser"
	"example.com/driver/ws"
)

var (
	headless  = flag.Bool("headless", true, "chrome visibility")
	width     = flag.Int64("width", 1920, "width of thumbnail")
	height    = flag.Int64("height", 1080, "height of thumbnail")
	websocket = flag.String("ws", "", "Websocket endpoint URL")
)

func main() {
	flag.Parse()
	websocketURL, err := url.Parse(*websocket)
	if err != nil {
		fmt.Fprintf(os.Stderr, "invalid websocket url: %s\n", err.Error())
		os.Exit(1)
	}
	for {
		_main(websocketURL)
	}
}

func _main(websocketURL *url.URL) {
	conn := ws.NewWebSocket(websocketURL)
	err := conn.Connect()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to connect: %s\n", err.Error())
		os.Exit(1)
	}
	defer conn.Close()
	println("connected")
	for {
		buf := make([]byte, 1024)
		n, err := conn.Read(buf)
		if err != nil {
			fmt.Fprintf(os.Stderr, "disconnect:%v\n", err.Error())
			break
		}

		req := Request{}
		err = json.Unmarshal(buf[:n], &req)
		if err != nil {
			fmt.Fprintf(os.Stderr, "invalid request: %s %s\n", string(buf), err.Error())
			result := Result{
				Result: browser.Result{
					Error: "invalid request",
				},
			}
			data, _ := json.Marshal(result)
			_, err = conn.Write(data)
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}
			continue
		}
		fmt.Fprintf(os.Stdout, "%+v\n", req)

		mutex := sync.Mutex{}
		wg := sync.WaitGroup{}

		wg.Add(1)
		go func() {
			defer wg.Done()
			ret := driver("wget", req.URL, req.Thumbnail)
			result := Result{
				ret, "fast", "",
			}
			fmt.Fprintf(os.Stdout, "%+v\n", result)
			data, _ := json.Marshal(result)
			mutex.Lock()
			_, err = conn.Write(data)
			mutex.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}

		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			ret := driver("chrome", req.URL, req.Thumbnail)
			result := Result{
				Phase: "detail",
				Result: browser.Result{
					FromURL:   ret.FromURL,
					TermURL:   ret.TermURL,
					Chains:    ret.Chains,
					Info:      ret.Info,
					Thumbnail: ret.Thumbnail,
				},
			}
			fmt.Fprintf(os.Stdout, "%+v\n", result)
			data, _ := json.Marshal(result)
			mutex.Lock()
			_, err = conn.Write(data)
			mutex.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}

			result = Result{
				Phase: "thumbnail",
				Result: browser.Result{
					Thumbnail: ret.Thumbnail,
				},
				Data: ret.ThumbnailData,
			}
			data, _ = json.Marshal(result)
			mutex.Lock()
			_, err = conn.Write(data)
			mutex.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}
		}()
		wg.Wait()
	}
}

type Request struct {
	URL       string `json:"url"`
	Thumbnail string `json:"thumbnail"`
}

type Result struct {
	browser.Result
	Phase string `json:"phase"`
	Data  string `json:"data"`
}
