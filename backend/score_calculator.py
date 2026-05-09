def calculate_final_score(yolo_result, clip_result, image_result):

    # 위험도 (0~100)
    score = int(
        image_result["brightness"] * 0.3 +
        len(yolo_result["detected"]) * 20 +
        clip_result["labels"].get("scary corridor", 0) * 100
    )

    score = max(0, min(100, score))

    # 공포도 grade 계산
    clip_labels = clip_result["labels"]

    fear_score = 0

    for label, weight in clip_labels.items():
        if weight > 0.6:
            fear_score += 50
        elif weight > 0.4:
            fear_score += 40
        elif weight > 0.25:
            fear_score += 30
        elif weight > 0.1:
            fear_score += 20
        else:
            fear_score += 10

    avg = fear_score / max(1, len(clip_labels))

    if avg >= 45:
        grade = "S"
    elif avg >= 35:
        grade = "A"
    elif avg >= 25:
        grade = "B"
    elif avg >= 15:
        grade = "C"
    else:
        grade = "D"

    return {
        "grade": grade,
        "score": score
    }