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
	task := tm.WaitQueue()
	defer close(task.Done)
	defer close(task.Err)
	req, _ := proto.Marshal(task.Request)
	err := conn.WriteMessage(websocket.BinaryMessage, req)
	if err != nil {
		tm.Retry(task)
		return
	}
	for {
		_, _result, err := conn.ReadMessage()
		if err != nil {
			task.Err <- fmt.Errorf("read error: %s", err.Error())
			return
		}
		result := protobuf.Result{}
		err = proto.Unmarshal(_result, &result)
		if err != nil {
			task.Err <- fmt.Errorf("parse error: %s %+v", err.Error(), &result)
			return
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
			task.Done <- trace
		case "chrome":
			trace := result.GetTrace()
			if trace == nil {
				task.Err <- fmt.Errorf("invalid format[trace:rich]")
				return
			}
			tm.CacheStore(task.Thumbnail, trace)
			if !trace.Thumnbail {
				// thumbnailを取得しなかった場合は待たない
				return
			}
		case "thumbnail":
			thumbnail := result.GetThumbnail()
			if thumbnail == nil {
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
	}
}
