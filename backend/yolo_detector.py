from ultralytics import YOLO

model = YOLO("yolov8n.pt")

YOLO_SCORES = {
    "person": {
        "fear": 0,
        "danger": -5
    },

    "bottle": {
        "fear": 5,
        "danger": 10
    },

    "chair": {
        "fear": 3,
        "danger": 0
    },

    "car": {
        "fear": 0,
        "danger": -3
    },

    "truck": {
        "fear": 5,
        "danger": 5
    }
}

def analyze_objects(image_path):

    results = model(image_path)

    fear_score = 0
    danger_score = 0

    detected = []

    for r in results:

        for box in r.boxes:

            cls_id = int(box.cls[0])

            cls_name = model.names[cls_id]

            confidence = float(box.conf[0])

            if confidence < 0.4:
                continue

            detected.append(cls_name)

            if cls_name in YOLO_SCORES:

                fear_score += YOLO_SCORES[cls_name]["fear"]

                danger_score += YOLO_SCORES[cls_name]["danger"]
                
    if "person" not in detected: 
        danger_score += 15 
        fear_score += 10
        
    if len(detected) == 0:
        fear_score += 10

    return {
        "fear": fear_score,
        "danger": danger_score,
        "detected": detected
    }