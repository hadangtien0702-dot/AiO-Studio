"""
AiO Studio — 3D Isometric USA Map & Client Interview Tracker
Storage Engine (JSON persistence)
Strictly NO emojis.
"""

import json
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

INTERVIEWS_FILE = DATA_DIR / "interviews.json"
STATES_FILE = DATA_DIR / "us-states.json"

DEFAULT_SAMPLE_INTERVIEWS = [
    {
        "id": "int-001",
        "state_code": "CA",
        "client_name": "David Miller",
        "role": "VP of Production",
        "company": "Silicon Media Labs",
        "city": "Los Angeles",
        "date": "2026-08-14",
        "status": "completed",
        "video_link": "PR-SEQ-LA01",
        "notes": "Interview about AI post-production workflows, Premiere timeline automation, and color finishing."
    },
    {
        "id": "int-002",
        "state_code": "CA",
        "client_name": "Elena Rostova",
        "role": "Head of Post-Production",
        "company": "Pacific Coast Films",
        "city": "San Francisco",
        "date": "2026-08-18",
        "status": "completed",
        "video_link": "PR-SEQ-SF02",
        "notes": "In-depth case study on multi-cam editing and auto-captioning integrations."
    },
    {
        "id": "int-003",
        "state_code": "TX",
        "client_name": "Marcus Sterling",
        "role": "Creative Director",
        "company": "Austin Hub Studios",
        "city": "Austin",
        "date": "2026-08-26",
        "status": "completed",
        "video_link": "PR-SEQ-ATX01",
        "notes": "Discussed short-form video explosion and high-velocity daily reels editing."
    },
    {
        "id": "int-004",
        "state_code": "TX",
        "client_name": "Samantha Hayes",
        "role": "Lead Podcast Producer",
        "company": "Lone Star Media",
        "city": "Dallas",
        "date": "2026-09-02",
        "status": "completed",
        "video_link": "PR-SEQ-DFW02",
        "notes": "Multi-camera podcast workflow with auto-cut switching and transcript sync."
    },
    {
        "id": "int-005",
        "state_code": "NY",
        "client_name": "Jonathan Chen",
        "role": "Executive Producer",
        "company": "Manhattan Broadcast Group",
        "city": "New York City",
        "date": "2026-09-08",
        "status": "completed",
        "video_link": "PR-SEQ-NYC01",
        "notes": "Broadcast delivery standards, HDR mastering, and multi-user asset bin management."
    },
    {
        "id": "int-006",
        "state_code": "NY",
        "client_name": "Chloe Dupont",
        "role": "Documentary Filmmaker",
        "company": "Brooklyn Independent Docs",
        "city": "Brooklyn",
        "date": "2026-09-28",
        "status": "planned",
        "video_link": "PR-PLAN-BK01",
        "notes": "Upcoming shoot: Archival footage restoration and documentary pacing."
    },
    {
        "id": "int-007",
        "state_code": "FL",
        "client_name": "Carlos Rodriguez",
        "role": "Content Director",
        "company": "Miami Sun Media",
        "city": "Miami",
        "date": "2026-09-12",
        "status": "completed",
        "video_link": "PR-SEQ-MIA01",
        "notes": "Commercial ad editing, fast turnarounds for social campaigns."
    },
    {
        "id": "int-008",
        "state_code": "WA",
        "client_name": "Rachel Adams",
        "role": "Lead Video Editor",
        "company": "Puget Sound Digital",
        "city": "Seattle",
        "date": "2026-09-17",
        "status": "completed",
        "video_link": "PR-SEQ-SEA01",
        "notes": "Color grading and LUT management in Premiere Pro for commercial travel docs."
    }
]


class StorageManager:
    def __init__(self):
        self._ensure_files()

    def _ensure_files(self):
        if not INTERVIEWS_FILE.exists():
            with open(INTERVIEWS_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_SAMPLE_INTERVIEWS, f, indent=2, ensure_ascii=False)

        # Copy us-states.json from parent data/ if not exists
        if not STATES_FILE.exists():
            parent_states = BASE_DIR.parent / "data" / "us-states.json"
            if parent_states.exists():
                with open(parent_states, "r", encoding="utf-8") as src:
                    content = src.read()
                with open(STATES_FILE, "w", encoding="utf-8") as dst:
                    dst.write(content)

    def load_interviews(self) -> List[Dict[str, Any]]:
        try:
            with open(INTERVIEWS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save_interviews(self, interviews: List[Dict[str, Any]]) -> bool:
        try:
            with open(INTERVIEWS_FILE, "w", encoding="utf-8") as f:
                json.dump(interviews, f, indent=2, ensure_ascii=False)
            return True
        except Exception:
            return False

    def load_states_data(self) -> Dict[str, Any]:
        try:
            with open(STATES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            # Fallback to parent
            parent_states = BASE_DIR.parent / "data" / "us-states.json"
            if parent_states.exists():
                with open(parent_states, "r", encoding="utf-8") as f:
                    return json.load(f)
            return {"type": "FeatureCollection", "states": []}

    def get_all(self, status: Optional[str] = None, state_code: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        items = self.load_interviews()
        if status and status != "all":
            items = [i for i in items if i.get("status") == status]
        if state_code:
            items = [i for i in items if i.get("state_code", "").upper() == state_code.upper()]
        if search:
            q = search.lower().strip()
            items = [
                i for i in items
                if q in i.get("client_name", "").lower()
                or q in i.get("company", "").lower()
                or q in i.get("city", "").lower()
                or q in i.get("state_code", "").lower()
                or q in i.get("notes", "").lower()
                or q in i.get("video_link", "").lower()
            ]
        return items

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        items = self.load_interviews()
        for i in items:
            if i.get("id") == item_id:
                return i
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        items = self.load_interviews()
        new_item = dict(data)
        new_item["id"] = f"int-{uuid.uuid4().hex[:8]}"
        new_item["created_at"] = datetime.now().isoformat()
        items.insert(0, new_item)
        self.save_interviews(items)
        return new_item

    def update(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        items = self.load_interviews()
        for idx, item in enumerate(items):
            if item.get("id") == item_id:
                for k, v in updates.items():
                    if v is not None:
                        item[k] = v
                items[idx] = item
                self.save_interviews(items)
                return item
        return None

    def delete(self, item_id: str) -> bool:
        items = self.load_interviews()
        orig_len = len(items)
        items = [i for i in items if i.get("id") != item_id]
        if len(items) < orig_len:
            self.save_interviews(items)
            return True
        return False

    def get_state_stats(self) -> List[Dict[str, Any]]:
        states_data = self.load_states_data()
        interviews = self.load_interviews()

        # Map state code to interview list
        state_map: Dict[str, List[Dict[str, Any]]] = {}
        for i in interviews:
            code = i.get("state_code", "").upper()
            if code not in state_map:
                state_map[code] = []
            state_map[code].append(i)

        stats = []
        for s in states_data.get("states", []):
            code = s.get("code")
            state_shoots = state_map.get(code, [])
            filmed = [x for x in state_shoots if x.get("status") == "completed"]
            planned = [x for x in state_shoots if x.get("status") == "planned"]

            latest = None
            if filmed:
                latest = filmed[0].get("client_name")

            stats.append({
                "code": code,
                "name": s.get("name"),
                "capital": s.get("capital", ""),
                "region": s.get("region", ""),
                "filmed_count": len(filmed),
                "planned_count": len(planned),
                "total_shoots": len(state_shoots),
                "is_filmed": len(filmed) > 0,
                "latest_client": latest
            })
        return stats

    def get_overview_stats(self) -> Dict[str, Any]:
        interviews = self.load_interviews()
        filmed = [i for i in interviews if i.get("status") == "completed"]
        planned = [i for i in interviews if i.get("status") == "planned"]
        filmed_states = set(i.get("state_code", "").upper() for i in filmed)

        total_states = 51
        covered = len(filmed_states)
        percentage = round((covered / total_states) * 100, 1)

        return {
            "total_shoots": len(interviews),
            "filmed_shoots": len(filmed),
            "planned_shoots": len(planned),
            "covered_states": covered,
            "total_states": total_states,
            "coverage_percentage": percentage
        }


storage = StorageManager()
