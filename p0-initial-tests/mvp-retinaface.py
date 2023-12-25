from retinaface import RetinaFace
from PIL import Image, ImageDraw, ImageFilter
import math

path = "test-images/clear.jpg"
padding = 0.1
blur = 0.1
threshold = 0.5

faces = RetinaFace.detect_faces(path, threshold = threshold)

pimage = Image.open(path)

for face in faces.values():
    # get area from recognizer
    area = face["facial_area"] # left, top, right, bottom
    left, top, right, bottom = area

    # calculate amount of blur, padding
    width = right - left
    height = top - bottom
    max_dimension = max(width, height)
    blur_abs = max_dimension * blur
    padding_abs = math.ceil(max_dimension * padding)
    area_expanded = [left - padding_abs, top - padding_abs, right + padding_abs, bottom + padding_abs]

    # apply blur on face
    section = pimage.crop(area_expanded)
    section = section.filter(ImageFilter.GaussianBlur(radius = blur_abs))
    pimage.paste(section, area_expanded)

pimage.show()

# it works so well!!! 2023-12-18T00:47