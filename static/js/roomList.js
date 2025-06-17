import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseConfig } from "/static/js/firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ul = document.getElementById('roomList');

onValue(ref(db, 'rooms'), (snap) => {
  ul.innerHTML = '';
  if (!snap.exists()) {
    ul.innerHTML = '<li class="list-group-item text-muted text-center">현재 열린 방이 없습니다</li>';
    return;
  }
  const rooms = snap.val();
  // 최신 생성순 내림차순 (key가 uuid이면 그대로도 ok)
  const roomEntries = Object.entries(rooms).reverse();
  roomEntries.forEach(([roomId, room]) => {
    // 상태 표시
    const statusText = room.status === "playing" ? "게임중" : room.status === "ended" ? "종료" : "대기중";
    // 현재 인원
    const numPlayers = room.participants ? Object.keys(room.participants).length : 0;
    const maxPlayers = room.max_players || "-";
    // 리스트 아이템 생성
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div>
        <span class="fw-bold">${room.title || "방"}</span>
        <span class="text-muted ms-2">${room.topic_mode === "vote" ? "투표" : "랜덤"}</span>
        <br>
        <small class="text-secondary">방 코드: ${roomId}</small>
      </div>
      <div>
        <span class="badge bg-${room.status === "playing" ? "danger" : room.status === "ended" ? "secondary" : "success"}">${statusText}</span>
        <span class="badge bg-light text-dark">${numPlayers}/${maxPlayers}명</span>
        <a href="/room/${roomId}" class="btn btn-outline-primary btn-sm ms-2">입장</a>
      </div>
    `;
    ul.appendChild(li);
  });
});
