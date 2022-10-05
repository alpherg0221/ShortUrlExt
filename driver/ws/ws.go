package ws

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/gorilla/websocket"
)

type WebSocket struct {
	Endpoint *url.URL
	conn     *websocket.Conn
	Done     chan struct{}
	read     chan []byte
	readErr  chan error
}

func NewWebSocket(endpoint *url.URL) *WebSocket {
	return &WebSocket{
		Endpoint: endpoint,
		Done:     make(chan struct{}),
		read:     make(chan []byte, 100),
		readErr:  make(chan error),
	}
}

func (ws *WebSocket) Connect() (err error) {
	var resp *http.Response
	websocket.DefaultDialer.
	ws.conn, resp, err = websocket.DefaultDialer.Dial(ws.Endpoint.String(), nil)
	if err != nil {
		if err == websocket.ErrBadHandshake {
			return fmt.Errorf("handshake failed with status %d", resp.StatusCode)
		}
		return err
	}
	go func() {
		defer close(ws.Done)
		for {
			if ws.conn == nil {
				break
			}
			_, message, err := ws.conn.ReadMessage()
			if err != nil {
				ws.readErr <- err
				return
			}
			ws.read <- message
		}
	}()
	return nil
}

func (ws *WebSocket) Close() error {
	if ws.conn != nil {
		defer func() {
			ws.conn = nil
		}()
		return ws.conn.Close()
	}
	return nil
}

func (ws *WebSocket) Read(p []byte) (n int, err error) {
	if ws.conn == nil {
		return 0, fmt.Errorf("not connected")
	}
	select {
	case data := <-ws.read:
		n = len(data)
		if len(p) < n {
			n = len(p)
		}
		for i := 0; i < n; i++ {
			p[i] = data[i]
		}
		return n, nil
	case err := <-ws.readErr:
		return 0, err
	case <-ws.Done:
		return 0, fmt.Errorf("disconnected")
	}
}

func (ws *WebSocket) Write(p []byte) (n int, err error) {
	if ws.conn == nil {
		return 0, fmt.Errorf("not connected")
	}
	err = ws.conn.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}
