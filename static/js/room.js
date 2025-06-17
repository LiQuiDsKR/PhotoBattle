import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseConfig } from "/static/js/firebaseConfig.js";
import { CATEGORY_LIST } from "./missionData.js";

// Firebase 기본 설정
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let missionShown = false;

const roomId = document.getElementById('roomCode').value;

let userId = localStorage.getItem('photobattle_userId');
if (!userId) {
  userId = "user_" + Math.random().toString(36).slice(2, 10);
  localStorage.setItem('photobattle_userId', userId);
}

// 참가자 입장/등록
function joinRoomFlow() {
  let username = localStorage.getItem('photobattle_username');
  if (!username) {
    username = prompt("닉네임을 입력하세요 (최대 10자):")?.trim().slice(0, 10);
    if (!username) {
      alert("닉네임을 입력해야 입장 가능합니다."); window.location.href = "/"; return;
    }
    localStorage.setItem('photobattle_username', username);
  }
  set(ref(db, `rooms/${roomId}/participants/${userId}`), {
    name: username, ready: false, submitted: false
  });
}
joinRoomFlow();

// 방 정보/참가자 실시간 표시
function renderRoomInfo(roomData) {
  document.getElementById('roomTitle').innerText = roomData.title || "방";
  document.getElementById('roomInfo').innerText = `최대 ${roomData.max_players}명`;
  document.getElementById('roomMode').innerText = `주제: ${roomData.topic_mode === "vote" ? "투표" : "랜덤"}`;
  document.getElementById('roomCode').innerText = roomId;
}
onValue(ref(db, `rooms/${roomId}`), (snap) => {
  const roomData = snap.val();
  if (roomData) renderRoomInfo(roomData);
});

onValue(ref(db, `rooms/${roomId}/participants`), (snap) => {
  const ul = document.getElementById('participantList');
  ul.innerHTML = '';
  if (!snap.exists()) return;
  const participants = snap.val();
  Object.keys(participants).forEach(uid => {
    const p = participants[uid];
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `<span>${p.name}</span>
      <span class="badge ${p.ready ? "bg-success" : "bg-secondary"}">${p.ready ? "준비" : "대기"}</span>
      ${p.submitted ? '<span class="badge bg-warning">제출완료</span>' : ''}`;
    ul.appendChild(li);
  });
});

// 초대코드 복사
document.getElementById('copyInvite').onclick = () => {
  const inviteUrl = `${location.origin}/room/${roomId}`;
  navigator.clipboard.writeText(inviteUrl);
  alert("초대 링크가 복사되었습니다:\n" + inviteUrl);
};

// 준비/취소
document.getElementById('readyBtn').onclick = async () => {
  // 투표 모드 체크
  const modeSnap = await get(ref(db, `rooms/${roomId}/topic_mode`));
  const mode = modeSnap.val();
  if (mode === 'vote') {
    // 내 투표 여부 체크
    const voteSnap = await get(ref(db, `rooms/${roomId}/votes/${userId}`));
    if (!voteSnap.exists()) {
      alert("주제 투표를 먼저 해주세요!");
      return;
    }
  }
  // 준비 처리
  await update(ref(db, `rooms/${roomId}/participants/${userId}`), { ready: true });
  document.getElementById('readyBtn').style.display = "none";
  document.getElementById('cancelReadyBtn').style.display = "";
};

document.getElementById('cancelReadyBtn').onclick = async () => {
  await update(ref(db, `rooms/${roomId}/participants/${userId}`), { ready: false });
  document.getElementById('readyBtn').style.display = "";
  document.getElementById('cancelReadyBtn').style.display = "none";
};

// 투표 모드 UI 
onValue(ref(db, `rooms/${roomId}/topic_mode`), (snap) => {
  if (snap.val() === "vote") {
    document.getElementById('voteArea').style.display = "";
    const form = document.getElementById('voteForm');
    form.innerHTML = '';

    // 2열 세로배치용: 카테고리를 반씩 나눔
    const half = Math.ceil(CATEGORY_LIST.length / 2);
    const left = CATEGORY_LIST.slice(0, half);
    const right = CATEGORY_LIST.slice(half);

    const table = document.createElement('table');
    table.className = "table-borderless";
    for (let i = 0; i < left.length; i++) {
      const tr = document.createElement('tr');
      [left[i], right[i]].forEach(cate => {
        const td = document.createElement('td');
        if (cate) {
          const label = document.createElement('label');
          label.className = "form-check-label me-3";
          label.style.cursor = "pointer";
          const radio = document.createElement('input');
          radio.type = "radio";
          radio.className = "form-check-input me-1";
          radio.name = "vote";
          radio.value = cate.category;
          label.appendChild(radio);
          label.appendChild(document.createTextNode(" " + cate.category));
          td.appendChild(label);
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    }
    form.appendChild(table);
  } else {
    document.getElementById('voteArea').style.display = "none";
  }
});


document.getElementById('voteBtn')?.addEventListener('click', async () => {
  const checked = document.querySelector('input[name="vote"]:checked');
  if (!checked) return alert("주제를 선택하세요!");
  await set(ref(db, `rooms/${roomId}/votes/${userId}`), checked.value);
  document.getElementById('voteBtn').disabled = true;
});

// 모두 준비하면 카운트다운
onValue(ref(db, `rooms/${roomId}/participants`), (snap) => {
  const ps = snap.val();
  if (!ps) return;
  const allReady = Object.values(ps).filter(p => p).every(p => p.ready);
  if (allReady) startCountdown();
});

let isCounting = false;
function startCountdown() {
  if (isCounting) return;
  isCounting = true;
  let count = 3;
  document.getElementById('countdownArea').style.display = "";
  document.getElementById('countdownNum').innerText = count;
  const timer = setInterval(() => {
    count -= 1;
    document.getElementById('countdownNum').innerText = count > 0 ? count : "GO!";
    if (count <= 0) {
      clearInterval(timer);
      document.getElementById('countdownArea').style.display = "none";
      pickAndSaveMission();
    }
  }, 1000);
}

// 미션 선정/저장
async function pickAndSaveMission() {
  const isHost = await checkIfHost();
  if (!isHost) return;
  const roomSnap = await get(ref(db, `rooms/${roomId}`));
  const topic_mode = roomSnap.val().topic_mode;

  let pickedCategory, pickedObject;
  if (topic_mode === "vote") {
    // 투표 집계 & 확률 랜덤 선정
    const votesSnap = await get(ref(db, `rooms/${roomId}/votes`));
    const votes = votesSnap.exists() ? Object.values(votesSnap.val()) : [];
    const tally = {};
    votes.forEach(v => tally[v] = (tally[v] || 0) + 1);
    const weighted = [];
    Object.entries(tally).forEach(([cate, count]) => {
      for (let i = 0; i < count; i++) weighted.push(cate);
    });
    pickedCategory = weighted[Math.floor(Math.random() * weighted.length)];
    const objects = CATEGORY_LIST.find(c => c.category === pickedCategory)?.objects || [];
    pickedObject = objects[Math.floor(Math.random() * objects.length)];
  } else {
    // 랜덤 모드
    const picked = CATEGORY_LIST[Math.floor(Math.random() * CATEGORY_LIST.length)];
    pickedCategory = picked.category;
    pickedObject = picked.objects[Math.floor(Math.random() * picked.objects.length)];
  }
  await set(ref(db, `rooms/${roomId}/category`), pickedCategory);
  await set(ref(db, `rooms/${roomId}/topic`), pickedObject);
}

// 방장 판별
async function checkIfHost() {
  const psSnap = await get(ref(db, `rooms/${roomId}/participants`));
  const ps = psSnap.val();
  if (!ps) return false;
  const keys = Object.keys(ps);
  return keys[0] === userId;
}

// 카테고리 실시간 업데이트
onValue(ref(db, `rooms/${roomId}/category`), (snap) => {
  document.getElementById('missionCategory').innerText = snap.val() || "-";
  maybeShowMissionArea();
});

// 주제 실시간 업데이트
onValue(ref(db, `rooms/${roomId}/topic`), (snap) => {
  document.getElementById('missionObject').innerText = snap.val() || "-";
  maybeShowMissionArea();
});

// 게임 끝났을 때
onValue(ref(db, `rooms/${roomId}/status`), (snap) => {
  if (snap.val() === "ended") {
    window.location.href = `/result/${roomId}`;
  }
});

function maybeShowMissionArea() {
  if (missionShown) return;
  const cat = document.getElementById('missionCategory').innerText;
  const obj = document.getElementById('missionObject').innerText;
  // 둘 다 -이 아니면 미션이 정해진 것!
  if (cat !== "-" && obj !== "-") { // category, object
    showMissionArea();
    missionShown = true;
  }
}

function showMissionArea() {
  document.getElementById('missionArea').style.display = "";
}

// 사진 제출
document.getElementById('photoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  await fetch(`/submit/${roomId}/${userId}`, {
    method: "POST",
    body: formData
  });
  alert("제출 완료!");
});
