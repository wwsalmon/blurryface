from flask import Flask  
from flask import render_template
from flaskwebgui import FlaskUI

app = Flask(__name__)

ui = FlaskUI(app = app, fullscreen = True, server = "flask")

@app.route("/")
def hello():  
    return render_template('index.html')

if __name__ == "__main__":
  # If you are debugging you can do that in the browser:
  app.run()
  # If you want to view the flaskwebgui window: // not working atm
  # ui.run() 