import firebase_admin
from firebase_admin import credentials, db

class FirebaseManager:
    def __init__(self, db_url, cred_path='firebaseKey.json'):
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': db_url
            })

    def create_room(self, room_id, title, max_players, topic_mode, category=None, topic=None):
        db.reference(f'rooms/{room_id}').set({
            'title': title,
            'max_players': max_players,
            'topic_mode': topic_mode,
            'category': category,
            'topic': topic,
            'status': 'waiting',
            'participants': {},
            'submissions': {},
            'winner': ''
        })

    def add_participant(self, room_id, uid, name):
        db.reference(f'rooms/{room_id}/participants/{uid}').set(name)
    
    def submit_photo(self, room_id, uid, filename, passed, reason, timestamp=None):
        data = {"filename": filename, "passed": passed, "reason": reason}
        if timestamp:
            data["timestamp"] = int(timestamp)
        db.reference(f'rooms/{room_id}/submissions/{uid}').set(data)

    def mark_passed(self, room_id, uid):
        db.reference(f'rooms/{room_id}/submissions/{uid}/passed').set(True)

    def set_winner(self, room_id, uid):
        db.reference(f'rooms/{room_id}/winner').set(uid)
        db.reference(f'rooms/{room_id}/status').set('ended')

    def get_topic(self, room_id):
        ref = db.reference(f'rooms/{room_id}/topic')
        return ref.get()
    
    def get_winner(self, room_id):
        ref = db.reference(f'rooms/{room_id}/winner')
        return ref.get()