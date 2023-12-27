![Blurryface logo](./docs/blurryface-logo.png)

# Blurryface: Windows/Mac face blurring tool

Download it from [Releases](https://github.com/wwsalmon/blurryface/releases).

![Screenshot of application](./docs/screenshot.jpg)

It:
- works completely on-device, so no information is ever uploaded to any server, and it works completely offline
- uses a state-of-the-art face detection model called [RetinaFace](https://paperswithcode.com/paper/190500641), so it works pretty well. picks up on faces even when turned, masked, etc.
- runs on ONNX Runtime with WebAssembly backend, with an HTML/vanilla JS frontend via Tauri, so it's also really fast + lightweight
- born out of the need to blur faces when publishing photos of protests, especially Palestine solidarity protests after Oct. 7, 2023.

## Dev notes

There are several prototype versions currently in the repository
- P0: initial tests with Python scripts. MVP using RetinaFace
- P1: functional but suboptimal (330 mb bundle, a bit slow) Python Eel desktop app, using RetinaFace
- P2: onnxruntime-web prototype with straightforward HTML/CSS/JS, using UltraFace (modified RetinaFace)
- P3: onnxruntime-web and Tauri.

### P3

Desktop app made using Tauri + Tailwind + HTML/vanilla JS. Tried Neutralino but had some bundling issues, and Tauri APIs were really useful anyways.

To run, make sure Rust is installed, also `npm i`, then cd to `p3-onnx-full` and run `npm run tauri dev` for dev, `npm run tauri build` for build. I need to figure out the build commands and publishing pipeline a good bit better...once upon a time I did for [Interview Manager](https://github.com/wwsalmon/interview-manager) and I guess I'll set up a similar CI/CD pipeline if I continue development. In the meantime I'm just building on Windows and Mac OS machines separately and publishing the .exe/app bundle together.

For Tailwind, cd to `p3-onnx-full` then run `npm run tw` to make sure new utility classes and changes to `src/style.css` make it to `public/style.css`.

2023-12-26: used [https://github.com/microsoft/onnxruntime/blob/main/tools/python/remove_initializer_from_input.py](https://github.com/microsoft/onnxruntime/blob/main/tools/python/remove_initializer_from_input.py) on UltraFace .onnx file per [https://github.com/microsoft/onnxruntime/issues/4033](https://github.com/microsoft/onnxruntime/issues/4033) to get rid of a bunch of error messages. There were 244 before. 35 remain.

### P2

Use npm `light-server` instead of `http-server`. cd to `p2-onnx` and run `light-server -s .`, then visit the address in browser. Open console for debug info.

### P1

Make venv then install packages with `pip install -r requirements.txt`. Update with `pip freeze > requirements.txt`

Build commands, per [Eel instructions](https://github.com/python-eel/Eel#building-distributable-binary-with-pyinstaller) -- cd to `eel` folder and then build with the following:
- Windows: `python -m eel main.py web --noconsole --onefile --icon icons/icon.ico -n Blurryface`.
- Mac: tbd, it needs a different icon format

12/20/2023: bottle v0.12.25 seems to cause problems with the Pyinstaller Windows build. Per this [StackOverflow thread](https://stackoverflow.com/questions/75192206/why-my-packaged-eel-app-failed-to-execute-attributeerror-nonetype-object-ha) I manually replaced bottle.py in my AppData Scripts and site-packages folders with the [v0.13-dev version of the file in the bottle.py repository](https://github.com/bottlepy/bottle/blob/master/bottle.py).

### P0

objectives/constraints
- must work offline and on-device, be reasonably fast on a reasonable laptop
- must recognize faces that are masked, hooded, glasses on, otherwise partially obscured
- eventually: create GUI that's easy for anyone on Mac OS and Windows to use (mobile eventually?)

dev notes
- opencv default face detection filter tested -- not great
- [face-recognition](https://pypi.org/project/face-recognition/) tested. it was okay but this package doesn't expose a lot of parameters
- [RetinaFace worked really well](https://sefiks.com/2021/04/27/deep-face-detection-with-retinaface-in-python/). Found via [DeepFace](https://github.com/serengil/deepface). Part of [InsightFace](https://insightface.ai/)
- sensitive-test-images folder has real-world sensitive images that this tool would be used on. hidden in .gitignore