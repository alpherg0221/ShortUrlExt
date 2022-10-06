package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"sync"
	"time"

	"example.com/driver/protobuf"
	"example.com/driver/ws"
	"google.golang.org/protobuf/proto"
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
		time.Sleep(10 * time.Second)
	}
}

func _main(websocketURL *url.URL) {
	conn := ws.NewWebSocket(websocketURL)
	err := conn.Connect()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to connect: %s\n", err.Error())
		return
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

		req := protobuf.Request{}
		err = proto.Unmarshal(buf[:n], &req)
		if err != nil {
			fmt.Fprintf(os.Stderr, "invalid request: %s %s\n", string(buf), err.Error())
			result := &protobuf.Result{
				Error: "invalid request",
			}
			data, _ := proto.Marshal(result)
			_, err = conn.Write(data)
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}
			continue
		}

		fmt.Fprintf(os.Stdout, "%s %+v\n", time.Now().Local().GoString(), &req)

		mutex := sync.Mutex{}
		wg := sync.WaitGroup{}

		wg.Add(1)
		go func() {
			defer wg.Done()
			ret := driver("wget", req.Url, req.Thumbnail)
			result := &protobuf.Result{
				Phase: "wget",
				Error: ret.Error,
				Trace: &protobuf.Trace{
					From:      ret.FromURL,
					Term:      ret.TermURL,
					Chains:    ret.Chains,
					Thumnbail: false,
					Info: &protobuf.Info{
						Title:       ret.Info.Title,
						Description: ret.Info.Description,
					},
				},
			}
			fmt.Fprintf(os.Stdout, "\t%+v\n", result)
			mutex.Lock()
			data, _ := proto.Marshal(result)
			_, err = conn.Write(data)
			mutex.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}

		}()

		wg.Add(1)
		go func() {
			defer wg.Done()
			ret := driver("chrome", req.Url, req.Thumbnail)
			result := &protobuf.Result{
				Phase: "chrome",
				Error: ret.Error,
				Trace: &protobuf.Trace{
					From:      ret.FromURL,
					Term:      ret.TermURL,
					Chains:    ret.Chains,
					Thumnbail: ret.Thumbnail != "",
					Info: &protobuf.Info{
						Title:       ret.Info.Title,
						Description: ret.Info.Description,
					},
				},
			}
			fmt.Fprintf(os.Stdout, "\t%+v\n", result)
			mutex.Lock()
			data, _ := proto.Marshal(result)
			_, err = conn.Write(data)
			mutex.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}

			result = &protobuf.Result{
				Phase: "thumbnail",
				Thumbnail: &protobuf.Thumbnail{
					Filename: ret.Thumbnail,
					Data:     ret.ThumbnailData,
				},
			}
			fmt.Fprintf(os.Stdout, "\tthumbnail: %d\n", len(result.Thumbnail.Data))
			mutex.Lock()
			data, _ = proto.Marshal(result)
			_, err = conn.Write(data)
			mutex.Unlock()
			if err != nil {
				fmt.Fprintf(os.Stderr, "failed to write: %s\n", err.Error())
			}
		}()
		wg.Wait()
	}
}
