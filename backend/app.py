from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import config
from routes.auth_routes import auth_bp
from routes.quiz_routes import quiz_bp

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = config.JWT_SECRET_KEY

# Allow CORS for your frontend origin, support credentials, and explicitly expose headers if needed
CORS(app, origins=["http://localhost:3000"], supports_credentials=True, methods=["GET", "POST", "OPTIONS"])

jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(quiz_bp, url_prefix="/quiz")

@app.route("/")
def home():
    return "✅ Flask server with JWT Auth is running!"

if __name__ == "__main__":
    app.run(debug=True, port=8000)
