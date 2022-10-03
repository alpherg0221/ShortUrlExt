import marshal
import ws, ws/jester_extra
import asyncnet, asyncdispatch
import jester
import os

type
  Task = object
    health: string

var queue: Channel[Task]

queue.open()

proc handle_ws*(req: Request) {.async.} =
  try:
    var ws = await newWebSocket(req)

    await ws.send("Welcome to simple echo server")

    while ws.readyState == Open:

      let task = queue.recv()

      await ws.send($$task)
      let packet = await ws.receiveStrPacket()
      task.

  except WebSocketClosedError:
    echo "Socket closed. "
  except WebSocketProtocolMismatchError:
    echo "Socket tried to use an unknown protocol: ",
            getCurrentExceptionMsg()
  except WebSocketError:
    echo "Unexpected socket error: ", getCurrentExceptionMsg()
