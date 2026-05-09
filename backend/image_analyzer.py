import cv2
import numpy as np

def analyze_image(image_path):

    image = cv2.imread(image_path)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    brightness = np.mean(gray)

    fear_score = 0
    danger_score = 0

    if brightness < 40:
        fear_score += 30
        danger_score += 20

    elif brightness < 70:
        fear_score += 15
        danger_score += 10

    return {
        "fear": fear_score,
        "danger": danger_score,
        "brightness": brightness
    }