"""
AiO Studio — 3D Isometric USA Map & Client Interview Tracker
FastAPI REST Application
Strictly NO emojis.
"""

import csv
import io
import json
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import (
    Interview,
    InterviewCreate,
    InterviewUpdate,
    StateStats,
    OverviewStats
)
from .storage import storage

app = FastAPI(
    title="AiO Studio - US Client Interview Map API",
    description="REST backend for tracking video production client shoots across 51 US states.",
    version="2.0.0"
)

# Enable CORS for React Vite frontend (port 5173, 3000, 8089, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AiO Map API", "version": "2.0.0"}


@app.get("/api/stats", response_model=OverviewStats)
def get_overview():
    return storage.get_overview_stats()


@app.get("/api/states/data")
def get_states_raw_data():
    """Returns TopoJSON 51 states coordinates for 3D extrusion."""
    return storage.load_states_data()


@app.get("/api/states", response_model=List[StateStats])
def list_states():
    """Returns all 51 states with aggregate filmed & planned interview counts."""
    return storage.get_state_stats()


@app.get("/api/states/{code}")
def get_state_detail(code: str):
    code_upper = code.upper()
    states_data = storage.load_states_data()
    state_meta = next((s for s in states_data.get("states", []) if s.get("code") == code_upper), None)
    if not state_meta:
        raise HTTPException(status_code=404, detail=f"State '{code}' not found")

    shoots = storage.get_all(state_code=code_upper)
    filmed = [s for s in shoots if s.get("status") == "completed"]
    planned = [s for s in shoots if s.get("status") == "planned"]

    return {
        "code": code_upper,
        "name": state_meta.get("name"),
        "capital": state_meta.get("capital", ""),
        "region": state_meta.get("region", ""),
        "centroid": state_meta.get("centroid", [0, 0]),
        "filmed_count": len(filmed),
        "planned_count": len(planned),
        "total_shoots": len(shoots),
        "shoots": shoots
    }


@app.get("/api/interviews", response_model=List[Interview])
def list_interviews(
    status: Optional[str] = Query(None, description="Filter by 'completed' or 'planned'"),
    state: Optional[str] = Query(None, description="Filter by 2-letter state code"),
    search: Optional[str] = Query(None, description="Search keyword")
):
    return storage.get_all(status=status, state_code=state, search=search)


@app.post("/api/interviews", response_model=Interview, status_code=201)
def create_interview(payload: InterviewCreate):
    created = storage.create(payload.model_dump())
    return created


@app.get("/api/interviews/{interview_id}", response_model=Interview)
def get_interview(interview_id: str):
    item = storage.get_by_id(interview_id)
    if not item:
        raise HTTPException(status_code=404, detail="Interview shoot not found")
    return item


@app.put("/api/interviews/{interview_id}", response_model=Interview)
def update_interview(interview_id: str, payload: InterviewUpdate):
    updated = storage.update(interview_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Interview shoot not found")
    return updated


@app.delete("/api/interviews/{interview_id}")
def delete_interview(interview_id: str):
    success = storage.delete(interview_id)
    if not success:
        raise HTTPException(status_code=404, detail="Interview shoot not found")
    return {"status": "deleted", "id": interview_id}


@app.get("/api/export/{fmt}")
def export_data(fmt: str):
    interviews = storage.load_interviews()
    if fmt.lower() == "json":
        return Response(
            content=json.dumps(interviews, indent=2, ensure_ascii=False),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=aio-interviews-export.json"}
        )
    elif fmt.lower() == "csv":
        output = io.StringIO()
        fieldnames = ["id", "state_code", "client_name", "role", "company", "city", "date", "status", "video_link", "notes"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        for item in interviews:
            row = {k: item.get(k, "") for k in fieldnames}
            writer.writerow(row)

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=aio-interviews-export.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Supported export formats: 'json', 'csv'")


# Mount static build if present in client/dist
DIST_DIR = Path(__file__).resolve().parent.parent / "client" / "dist"
if DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")
