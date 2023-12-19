import eel
from tkinter import Tk, filedialog
from PIL import Image, ImageFilter
from io import BytesIO
import base64
from retinaface import RetinaFace
import math
import numpy

# only used for with-tk.html
@eel.expose
def button_get_photo():
    root = Tk()
    root.withdraw()
    root.wm_attributes("-topmost", 1)
    photo = filedialog.askopenfile(filetypes = [("Image files", ".jpg, .jpeg, .png")])
    print(photo.name)
    return photo.name

@eel.expose
def process_image(imageBase64):
    imageFile = BytesIO(base64.b64decode(imageBase64))
    pimage = Image.open(imageFile)
    pimage.show()

@eel.expose
def detect_faces(imageBase64):
    imageFile = BytesIO(base64.b64decode(imageBase64))
    pimage = Image.open(imageFile)

    padding = 0.1
    blur = 0.1
    threshold = 0.5

    faces = RetinaFace.detect_faces(numpy.array(pimage), threshold = threshold)

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

eel.init("web")
eel.start("index.html")