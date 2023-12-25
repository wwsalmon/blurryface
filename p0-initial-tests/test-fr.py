import face_recognition
from PIL import Image, ImageDraw

image = face_recognition.load_image_file("./test-images/clear.jpg")
face_locations = face_recognition.face_locations(image)

pimage = Image.fromarray(image)
draw = ImageDraw.Draw(pimage)

for face_location in face_locations:
    top, right, bottom, left = face_location
    draw.rectangle(((left, top), (right, bottom)), outline=(0, 0, 255))

del draw

pimage.show()