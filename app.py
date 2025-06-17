from flask import Flask, render_template, request, redirect, url_for
import os, uuid, time
from firebaseManager import FirebaseManager
from photoAnalyzer import PhotoAnalyzer

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

firebase = FirebaseManager(
    db_url='https://photobattle-7a99f-default-rtdb.asia-southeast1.firebasedatabase.app/'
)
analyzer = PhotoAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create_room', methods=['POST'])
def create_room():
    title = request.form.get('title')
    max_players = int(request.form.get('max_players', 8))
    topic_mode = request.form.get('topic_mode', 'random')
    room_id = str(uuid.uuid4())[:6]

    firebase.create_room(
        room_id=room_id,
        title=title,
        max_players=max_players,
        topic_mode=topic_mode,
        category=None,
        topic=None
    )
    return redirect(url_for('room_page', room_id=room_id))

@app.route('/room/<room_id>')
def room_page(room_id):
    return render_template('room.html', room_id=room_id)

@app.route('/set_mission/<room_id>', methods=['POST'])
def set_mission(room_id):
    category = request.form.get('category')
    topic = request.form.get('topic')
    firebase.set_category_and_topic(room_id, category, topic)
    return {'ok': True}

@app.route('/submit/<room_id>/<uid>', methods=['POST'])
def submit_photo(room_id, uid):
    file = request.files.get('photo')
    if not file:
        return "No photo uploaded", 400

    filename = f"{uid}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    topic = firebase.get_topic(room_id)
    result = analyzer.check_image_relevance(filepath, topic)

    firebase.submit_photo(room_id, uid, filename, passed=result['passed'], reason=result['reason'], timestamp=time.time()*1000)

    if result['passed']:
        firebase.mark_passed(room_id, uid)
        if not firebase.get_winner(room_id):
            firebase.set_winner(room_id, uid)

    return redirect(url_for('result_page', room_id=room_id))

@app.route('/result/<room_id>')
def result_page(room_id):
    return render_template('result.html', room_id=room_id)

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True)
