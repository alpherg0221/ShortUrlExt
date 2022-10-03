from fastapi import FastAPI

from logic import thumb, trace, ws, detail

app = FastAPI()


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

app.include_router(thumb.router)
app.include_router(trace.router)
app.include_router(ws.router)
app.include_router(detail.router)
