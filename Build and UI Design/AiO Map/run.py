"""
AiO Studio — 3D Isometric USA Map
One-Click Launcher (Python FastAPI + React Vite)
Strictly NO emojis.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CLIENT_DIR = BASE_DIR / "client"


def check_dependencies():
    print("[AiO Studio] Checking environment...")
    # Check node_modules in client
    if not (CLIENT_DIR / "node_modules").exists():
        print("[AiO Studio] Installing React dependencies (npm install)...")
        subprocess.run(["npm", "install"], cwd=str(CLIENT_DIR), shell=True, check=True)
    print("[AiO Studio] Environment verified.")


def main():
    check_dependencies()

    print("[AiO Studio] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(BASE_DIR))

    print("[AiO Studio] Starting React Vite Frontend on http://localhost:5173 ...")
    frontend_cmd = ["npm", "run", "dev"]
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(CLIENT_DIR), shell=True)

    time.sleep(2)
    print("[AiO Studio] Opening map in browser: http://localhost:5173")
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    print("[AiO Studio] System running smoothly. Press Ctrl+C to terminate.")
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\n[AiO Studio] Shutting down services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("[AiO Studio] Services terminated cleanly.")


if __name__ == "__main__":
    main()
