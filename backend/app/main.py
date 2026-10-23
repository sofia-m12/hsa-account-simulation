from fastapi import FastAPI

app = FastAPI(title="HSA Account Simulation")

@app.get("/health")
def health_check():
    return {"status": "all good!"}