import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { CATEGORY_LIST } from "./missionData.js";
const db = getDatabase(firebaseConfig);

export async function pickAndSaveMission(roomId, userId) {
  const psSnap = await get(ref(db, `rooms/${roomId}/participants`));
  const ps = psSnap.val();
  if (!ps) return;
  const keys = Object.keys(ps);
  const isHost = keys[0] === userId;
  if (!isHost) return;  // 방장만 처리

  // topic_mode를 구독하여 분기
  const roomSnap = await get(ref(db, `rooms/${roomId}`));
  const topic_mode = roomSnap.val().topic_mode;

  let pickedCategory, pickedObject;
  if (topic_mode === "vote") {
    // 투표 집계 & 확률 랜덤 선정
    const votesSnap = await get(ref(db, `rooms/${roomId}/votes`));
    const votes = votesSnap.exists() ? Object.values(votesSnap.val()) : [];
    // 집계
    const tally = {};
    votes.forEach(v => tally[v] = (tally[v] || 0) + 1);
    const weighted = [];
    Object.entries(tally).forEach(([cate, count]) => {
      for (let i = 0; i < count; i++) weighted.push(cate);
    });
    pickedCategory = weighted[Math.floor(Math.random() * weighted.length)];
    // 대상 랜덤 선정
    const objects = CATEGORY_LIST.find(c => c.category === pickedCategory)?.objects || [];
    pickedObject = objects[Math.floor(Math.random() * objects.length)];
  } else {
    // 랜덤 모드: 카테고리/대상 모두 랜덤
    const picked = CATEGORY_LIST[Math.floor(Math.random() * CATEGORY_LIST.length)];
    pickedCategory = picked.category;
    pickedObject = picked.objects[Math.floor(Math.random() * picked.objects.length)];
  }

  // 결과 파이어베이스에 저장
  await set(ref(db, `rooms/${roomId}/category`), pickedCategory);
  await set(ref(db, `rooms/${roomId}/topic`), pickedObject);
}
