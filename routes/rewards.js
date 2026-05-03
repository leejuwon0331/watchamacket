// ═══════════════════════════════════════════
// 리워드 API
// 거래할 때마다 포인트 적립 → 포인트로 시계 교환!
// ═══════════════════════════════════════════

const express = require("express");
const db = require("../database");
const { authRequired } = require("../middleware");
const router = express.Router();

// 포인트 적립 규칙
const POINT_RULES = {
  buy: { points: 100, label: "구매 완료" },
  sell: { points: 100, label: "판매 완료" },
  review: { points: 30, label: "리뷰 작성" },
  post: { points: 20, label: "게시글 작성" },
  comment: { points: 5, label: "댓글 작성" },
  daily_login: { points: 10, label: "일일 출석" },
  signup: { points: 200, label: "회원가입 축하" },
};

// ─── 내 포인트 & 등급 조회 ───
router.get("/my", authRequired, (req, res) => {
  const user = db.findOne("users", u => u.id === req.user.id);
  const history = db.find("point_history", h => h.user_id === req.user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalEarned = history.filter(h => h.amount > 0).reduce((s, h) => s + h.amount, 0);
  const totalSpent = history.filter(h => h.amount < 0).reduce((s, h) => s + Math.abs(h.amount), 0);
  const balance = totalEarned - totalSpent;
  const level = getLevel(totalEarned);
  const claims = db.find("reward_claims", c => c.user_id === req.user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    balance,
    total_earned: totalEarned,
    total_spent: totalSpent,
    level,
    history: history.slice(0, 20),
    claims,
    next_level: getNextLevel(totalEarned),
  });
});

// ─── 리워드 상점 (교환 가능한 시계 목록) ───
router.get("/shop", (req, res) => {
  const items = db.find("reward_items", i => i.status === "active");
  res.json({ items, point_rules: POINT_RULES });
});

// ─── 리워드 교환 (포인트로 시계 받기!) ───
router.post("/claim/:id", authRequired, (req, res) => {
  const item = db.findOne("reward_items", i => i.id === Number(req.params.id) && i.status === "active");
  if (!item) return res.status(404).json({ error: "리워드 상품을 찾을 수 없습니다" });
  if (item.stock <= 0) return res.status(400).json({ error: "품절된 상품입니다" });

  // 포인트 잔액 확인
  const history = db.find("point_history", h => h.user_id === req.user.id);
  const balance = history.reduce((s, h) => s + h.amount, 0);

  if (balance < item.points_required) {
    return res.status(400).json({
      error: "포인트가 부족합니다",
      needed: item.points_required,
      current: balance,
      shortage: item.points_required - balance,
    });
  }

  // 포인트 차감
  db.insert("point_history", {
    user_id: req.user.id,
    amount: -item.points_required,
    reason: "리워드 교환: " + item.name,
    type: "spend",
  });

  // 재고 감소
  db.update("reward_items", i => i.id === item.id, { stock: item.stock - 1 });

  // 교환 기록
  const claim = db.insert("reward_claims", {
    user_id: req.user.id,
    reward_item_id: item.id,
    reward_name: item.name,
    points_used: item.points_required,
    status: "pending",
  });

  res.json({
    message: "🎉 " + item.name + " 교환 완료! 배송 정보를 확인해주세요.",
    claim_id: claim.id,
    remaining_points: balance - item.points_required,
  });
});

// ─── 포인트 적립 (내부 호출용) ───
function addPoints(userId, type) {
  const rule = POINT_RULES[type];
  if (!rule) return;
  db.insert("point_history", {
    user_id: userId,
    amount: rule.points,
    reason: rule.label,
    type: "earn",
  });
}

// ─── 등급 시스템 ───
function getLevel(totalPoints) {
  if (totalPoints >= 10000) return { name: "⌚ 워치마스터", level: 5, color: "#C8A55A", min: 10000 };
  if (totalPoints >= 5000) return { name: "🏆 워치컬렉터", level: 4, color: "#8E44AD", min: 5000 };
  if (totalPoints >= 2000) return { name: "🔥 워치러버", level: 3, color: "#E67E22", min: 2000 };
  if (totalPoints >= 500) return { name: "⭐ 워치팬", level: 2, color: "#3498DB", min: 500 };
  return { name: "🌱 워치비기너", level: 1, color: "#27AE60", min: 0 };
}

function getNextLevel(totalPoints) {
  const levels = [500, 2000, 5000, 10000];
  const next = levels.find(l => l > totalPoints);
  if (!next) return null;
  return { target: next, current: totalPoints, remaining: next - totalPoints, progress: Math.round((totalPoints / next) * 100) };
}

module.exports = router;
module.exports.addPoints = addPoints;
