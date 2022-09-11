from fastapi import FastAPI

from logic import thumb, trace

app = FastAPI()

app.include_router(thumb.router)
app.include_router(trace.router)