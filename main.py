from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import chat, location, user
from user_operations import initialize_all_tables


app = FastAPI()


from fastapi import APIRouter
import time

@app.get("/timeout-test")
def simulate_timeout():
    time.sleep(15)  # 15 saniyelik gecikme
    return {"message": "This response is intentionally delayed"}



# Initialize database tables on startup
@app.on_event("startup")
async def startup_db_client():
    print("Initializing database tables...")
    initialize_all_tables()
    print("Database initialization complete!")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add routes
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(location.router, prefix="/location", tags=["Location"])
app.include_router(user.router)
# app.include_router(spellcheck.router, prefix="/spell", tags=["Spell Check"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
