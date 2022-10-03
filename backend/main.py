from fastapi import FastAPI

from logic import thumb, trace, ws, detail

app = FastAPI()

app.include_router(thumb.router)
app.include_router(trace.router)
app.include_router(ws.router)
app.include_router(detail.router)