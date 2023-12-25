from retinaface import RetinaFace
from PIL import Image, ImageDraw

path = "./test-images/clear.jpg"

faces = RetinaFace.detect_faces(path)

pimage = Image.open(path)
draw = ImageDraw.Draw(pimage)

for face in faces.values():
    left, top, right, bottom = face["facial_area"]
    draw.rectangle(((left, top), (right, bottom)), outline=(0, 0, 255), width = 4)

del draw

pimage.show()

# it works so well!!! 2023-12-18T00:47