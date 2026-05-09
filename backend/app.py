from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

from yolo_detector import analyze_objects
from clip_analyzer import analyze_clip
from image_analyzer import analyze_image
from score_calculator import calculate_final_score

app = FastAPI()

# CORS 설정 (프론트 연결용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    yolo_result = analyze_objects(file_path)
    clip_result = analyze_clip(file_path)
    image_result = analyze_image(file_path)

    final_score = calculate_final_score(
        yolo_result,
        clip_result,
        image_result
    )


    return {
        "grade": final_score["grade"],
        "score": final_score["score"],
        "yolo": yolo_result["detected"],
        "clip": clip_result["labels"],
        "brightness": image_result["brightness"]
    }