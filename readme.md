![Blurryface logo](./docs/blurryface-logo.png)

# Blurryface: Windows/Mac face blurring tool

Download it from [Releases](https://github.com/wwsalmon/blurryface/releases).

![Screenshot of application](./docs/screenshot.jpg)

It:
- works completely on-device, so no information is ever uploaded to any server, and it works completely offline
- uses a state-of-the-art face detection model called [RetinaFace](https://paperswithcode.com/paper/190500641), so it works pretty well. picks up on faces even when turned, masked, etc.
- runs on ONNX Runtime with WebAssembly backend, with an HTML/vanilla JS frontend via Tauri, so it's also really fast + lightweight
- born out of the need to blur faces when publishing photos of protests, especially Palestine solidarity protests after Oct. 7, 2023.

## Development instructions

All source code for the released version of this app is in `p3-onnx-full`. It's a desktop app made using Tauri + Tailwind + HTML/vanilla JS.

To setup:
- install Rust
- install Node/NPM
- cd to `p3-onnx-full`. run `npm i` to install packages
- run `npm run tw` to get Tailwind to update `/public/style.css` based on utility classes
- run `npm run tauri dev` for dev

To make changes:
- edit `index.html` and `controller.js` in `/public` for app changes, `facedetect.js` for inference / pre/post-processing changes. If running Tauri in dev mode, it should hot refresh. If edit JS files, may need to refresh WebView manually to see changes

To build:
- run `npm run tauri build`
- to code sign on Mac OS (make bundle runable on other computers), follow [Tauri docs](https://tauri.app/v1/guides/distribution/sign-macos) to create and install a certificate, then define the following environment variables (`export VARIABLE=VALUE` in terminal):
    - `APPLE_CERTIFICATE_PASSWORD`
    - `APPLE_SIGNING_IDENTITY`
    - `APPLE_ID`
    - `APPLE_PASSWORD`
    - `APPLE_TEAM_ID`
    - For CI (ex. GitHub actions) you also need `APPLE_CERTIFICATE`, a base64 string of the certificate (see docs linked above). If you install the certificate on your computer, you don't need this variable, the builder will find the certificate using the signing identity.

## Other dev notes

(misc. notes, docs for previous prototypes)

There are several other prototype versions currently in the repository
- P0: initial tests with Python scripts. MVP using RetinaFace
- P1: functional but suboptimal (330 mb bundle, a bit slow) Python Eel desktop app, using RetinaFace
- P2: onnxruntime-web prototype with straightforward HTML/CSS/JS, using UltraFace (modified RetinaFace)
- P3: onnxruntime-web and Tauri

### P3

2023-12-27: Tried Neutralino but had some bundling issues, and Tauri APIs were really useful anyways.

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