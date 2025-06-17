import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseConfig } from "/static/js/firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const roomId = document.getElementById('roomCode').value;

// 1. 참가자/제출 정보/우승자 모두 불러오기
async function showResults() {
  const [participantsSnap, submissionsSnap, winnerSnap] = await Promise.all([
    get(ref(db, `rooms/${roomId}/participants`)),
    get(ref(db, `rooms/${roomId}/submissions`)),
    get(ref(db, `rooms/${roomId}/winner`))
  ]);
  const participants = participantsSnap.exists() ? participantsSnap.val() : {};
  const submissions = submissionsSnap.exists() ? submissionsSnap.val() : {};
  const winnerUid = winnerSnap.val();

  // 제출 순 타임라인 배열 만들기
  let timeline = [];
  Object.keys(submissions).forEach(uid => {
    const sub = submissions[uid];
    timeline.push({
      uid,
      name: participants[uid]?.name || uid,
      filename: sub.filename,
      passed: sub.passed,
      reason: sub.reason,
      time: sub.timestamp || "", // timestamp 저장시
      isWinner: winnerUid === uid
    });
  });

  // 제출 순으로 정렬(타임스탬프 저장 안했으면 그냥 배열 순서)
  // timeline.sort((a, b) => (a.time || 0) - (b.time || 0));

  // 테이블 렌더링
  const tbody = document.getElementById('timelineBody');
  tbody.innerHTML = '';
  timeline.forEach((t, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.isWinner ? '🏆' : ''}</td>
      <td>${t.name}</td>
      <td>
        <img src="/static/uploads/${t.filename}" style="max-width:80px;max-height:80px;border-radius:8px;">
      </td>
      <td>
        ${t.passed ? '<span class="badge bg-success">정답</span>' : '<span class="badge bg-danger">오답</span>'}
      </td>
      <td>${t.reason}</td>
      <td>${t.time ? new Date(t.time).toLocaleTimeString() : '-'}</td>
    `;
    tbody.appendChild(tr);
  });

  // 우승자
  if (winnerUid && participants[winnerUid]) {
    document.getElementById('winnerArea').innerHTML =
      `<b>🏆 우승자: ${participants[winnerUid].name}</b>`;
  } else {
    document.getElementById('winnerArea').innerText = "우승자가 없습니다.";
  }
}

showResults();
