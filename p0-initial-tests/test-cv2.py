import cv2
from PIL import Image

image = cv2.imread("./test-images/clear.jpg")
gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

classifier = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

faces = classifier.detectMultiScale(gray_image, minSize = (100,100), minNeighbors = 2)

for (x, y, w, h) in faces:
    cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 4)
    
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

pimage = Image.fromarray(image_rgb)
pimage.show()