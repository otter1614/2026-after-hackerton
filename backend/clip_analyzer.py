import torch
import open_clip
from PIL import Image

model, _, preprocess = open_clip.create_model_and_transforms(
    'ViT-B-32',
    pretrained='laion2b_s34b_b79k'
)

tokenizer = open_clip.get_tokenizer('ViT-B-32')

labels = [
    "haunted abandoned building",
    "dark dangerous alley",
    "abandoned hospital",
    "scary corridor",
    "safe modern street",
    "bright cafe street"
]

def analyze_clip(image_path):

    image = preprocess(Image.open(image_path)).unsqueeze(0)

    text = tokenizer(labels)

    with torch.no_grad():

        image_features = model.encode_image(image)

        text_features = model.encode_text(text)

        image_features /= image_features.norm(dim=-1, keepdim=True)

        text_features /= text_features.norm(dim=-1, keepdim=True)

        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)

    probs = similarity[0].tolist()

    result = dict(zip(labels, probs))

    fear_score = 0
    danger_score = 0

    if result["haunted abandoned building"] > 0.25:
        fear_score += 30

    if result["dark dangerous alley"] > 0.10:
        fear_score += 20
        danger_score += 20

    if result["abandoned hospital"] > 0.20:
        fear_score += 25
        danger_score += 15

    if result["scary corridor"] > 0.20:
        fear_score += 15

    if result["safe modern street"] > 0.30:
        fear_score -= 20
        danger_score -= 20

    
    return {
        "fear": fear_score,
        "danger": danger_score,
        "labels": result
    }