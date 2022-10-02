from fastapi import FastAPI

from logic import thumb, trace, ws

app = FastAPI()

app.include_router(thumb.router)
app.include_router(trace.router)
app.include_router(ws.router)