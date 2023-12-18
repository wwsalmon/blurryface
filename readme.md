# prototyping a tool to automatically blur faces with

objectives/constraints
- must work offline and on-device, be reasonably fast on a reasonable laptop
- must recognize faces that are masked, hooded, glasses on, otherwise partially obscured
- eventually: create GUI that's easy for anyone on Mac OS and Windows to use (mobile eventually?)

dev notes
- opencv default face detection filter tested -- not great
- [face-recognition](https://pypi.org/project/face-recognition/) tested. it was okay but this package doesn't expose a lot of parameters
- [RetinaFace worked really well](https://sefiks.com/2021/04/27/deep-face-detection-with-retinaface-in-python/). Found via [DeepFace](https://github.com/serengil/deepface). Part of [InsightFace](https://insightface.ai/)
- sensitive-test-images folder has real-world sensitive images that this tool would be used on. hidden in .gitignore