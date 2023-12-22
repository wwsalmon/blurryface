# Blurryface: offline face blurring tool

Blurryface is a prototype (made in a few days, potentially buggy, but functional in most cases) Windows/Mac OS app for automatically blurring faces in photos.

The app is built using Python, [Eel](https://github.com/python-eel/Eel), and HTML/CSS/JS, and built using [Pyinstaller](https://pyinstaller.org/en/stable/). It works completely offline -- no photos or information are ever uploaded anywhere when using the app, and all face detection and image processing happens on-device.

The app uses RetinaFace for face detection and Pillow for blurring/image processing.

It was born out of the need to blur faces when publishing photos of protests, especially Palestine liberation protests after Oct. 7, 2023.

## Dev notes

Make venv then install packages with `pip install -r requirements.txt`. Update with `pip freeze > requirements.txt`

Build commands, per [Eel instructions](https://github.com/python-eel/Eel#building-distributable-binary-with-pyinstaller) -- cd to `eel` folder and then build with the following:
- Windows: `python -m eel main.py web --noconsole --onefile --icon icons/icon.ico -n Blurryface`.
- Mac: tbd, it needs a different icon format

12/20/2023: bottle v0.12.25 seems to cause problems with the Pyinstaller Windows build. Per this [StackOverflow thread](https://stackoverflow.com/questions/75192206/why-my-packaged-eel-app-failed-to-execute-attributeerror-nonetype-object-ha) I manually replaced bottle.py in my AppData Scripts and site-packages folders with the [v0.13-dev version of the file in the bottle.py repository](https://github.com/bottlepy/bottle/blob/master/bottle.py).

## Old notes

objectives/constraints
- must work offline and on-device, be reasonably fast on a reasonable laptop
- must recognize faces that are masked, hooded, glasses on, otherwise partially obscured
- eventually: create GUI that's easy for anyone on Mac OS and Windows to use (mobile eventually?)

dev notes
- opencv default face detection filter tested -- not great
- [face-recognition](https://pypi.org/project/face-recognition/) tested. it was okay but this package doesn't expose a lot of parameters
- [RetinaFace worked really well](https://sefiks.com/2021/04/27/deep-face-detection-with-retinaface-in-python/). Found via [DeepFace](https://github.com/serengil/deepface). Part of [InsightFace](https://insightface.ai/)
- sensitive-test-images folder has real-world sensitive images that this tool would be used on. hidden in .gitignore