"""
AiO Studio — 3D Isometric USA Map & Client Interview Tracker
Backend Data Models (Pydantic)
Strictly NO emojis.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class InterviewBase(BaseModel):
    state_code: str = Field(..., description="2-letter US State Code, e.g. CA, TX, NY")
    client_name: str = Field(..., description="Name of the client interviewed")
    role: str = Field(default="", description="Role or title, e.g. VP of Production")
    company: str = Field(default="", description="Company or studio name")
    city: str = Field(default="", description="City where shoot took place")
    date: str = Field(default="", description="Shoot date in YYYY-MM-DD format")
    status: str = Field(default="completed", description="'completed' (Filmed) or 'planned'")
    video_link: str = Field(default="", description="Premiere sequence ID, e.g. PR-SEQ-LA01")
    notes: str = Field(default="", description="Production notes or topics discussed")


class InterviewCreate(InterviewBase):
    pass


class InterviewUpdate(BaseModel):
    state_code: Optional[str] = None
    client_name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    city: Optional[str] = None
    date: Optional[str] = None
    status: Optional[str] = None
    video_link: Optional[str] = None
    notes: Optional[str] = None


class Interview(InterviewBase):
    id: str = Field(..., description="Unique ID of the interview shoot")
    created_at: Optional[str] = None


class StateStats(BaseModel):
    code: str
    name: str
    capital: str
    region: str
    filmed_count: int
    planned_count: int
    total_shoots: int
    is_filmed: bool
    latest_client: Optional[str] = None


class OverviewStats(BaseModel):
    total_shoots: int
    filmed_shoots: int
    planned_shoots: int
    covered_states: int
    total_states: int = 51
    coverage_percentage: float
