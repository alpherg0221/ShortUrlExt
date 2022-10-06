package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"example.com/backend/helper"
	"example.com/backend/protobuf"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/proto"
)

var upgrader = websocket.Upgrader{} // use default options

func ws(c echo.Context) error {
	conn, err := upgrader.Upgrade(c.Response().Writer, c.Request(), nil)
	if err != nil {
		log.Print("upgrade:", err)
		return err
	}
	defer conn.Close()
	tm := helper.TaskManagerInstance()
	id := helper.SHA256(time.Now().GoString())
	tm.AddWorker(id)
	defer tm.RemoveWorker(id)
	for {
		worker(tm, conn)
	}
}

func worker(tm *helper.TaskManager, conn *websocket.Conn) {
	buf := make(chan []byte)
	go func() {
		_, d, _ := conn.ReadMessage()
		buf <- d
	}()
	var task helper.Task
	select {
	case <-buf:
		// 何も書く前に来たデータは破棄する
		return
	case task = <-tm.WaitQueue():
	}
	req, _ := proto.Marshal(task.Request)
	err := conn.WriteMessage(websocket.BinaryMessage, req)
	if err != nil {
		tm.Retry(task)
		return
	}
	defer close(task.Done)
	defer close(task.Err)
	// 1回目はGo routineの消費をする
	_result := <-buf
	for {
		result := protobuf.Result{}
		err = proto.Unmarshal(_result, &result)
		if err != nil {
			task.Err <- fmt.Errorf("parse error: %s %+v", err.Error(), &result)
			return
		}
		if len(_result) < 10000 {
			fmt.Fprintf(os.Stdout, "%+v\n", &result)
		}
		if result.Error != "" {
			task.Err <- fmt.Errorf(result.Error)
			return
		}
		switch result.Phase {
		case "wget":
			trace := result.GetTrace()
			if trace == nil {
				task.Err <- fmt.Errorf("invalid format[trace:text]")
				return
			}
			if trace.From != task.Url {
				continue
			}
			task.Done <- trace
		case "chrome":
			trace := result.GetTrace()
			if trace == nil {
				task.Err <- fmt.Errorf("invalid format[trace:rich]")
				return
			}
			tm.CacheStore(helper.SHA256(trace.From), trace)
		case "thumbnail":
			thumbnail := result.GetThumbnail()
			if thumbnail == nil || thumbnail.Filename == "" {
				task.Err <- fmt.Errorf("invalid format[thumbnail]")
				return
			}
			err := os.WriteFile(thumbnail.Filename, thumbnail.Data, os.ModePerm)
			if err != nil {
				println(err.Error())
				task.Err <- fmt.Errorf("failed to write: %s", err.Error())
			}
			return
		default:
			task.Err <- fmt.Errorf("unknown phase")
			return
		}
		_, _result, err = conn.ReadMessage()
		if err != nil {
			task.Err <- fmt.Errorf("read error: %s", err.Error())
			return
		}
	}
}
