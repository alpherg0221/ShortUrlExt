import jester
import handlers/[trace, websocket]
import utils/[response]


router myrouter:
  get "/trace":
    json_response(Http200, trace.get_health())
  get "/ws":
    discard websocket.handle_ws(request)
    resp Http200, "", ""

proc main() =
  let settings = newSettings(port = Port(5000))
  var jester = initJester(myrouter, settings = settings)
  jester.serve()

when isMainModule:
  main()
