// ═══════════════════════════════════════════
// 안전거래 API
// 흐름: 결제완료(paid) → 배송중(shipped) → 수령확인(received) → 정산완료(settled)
// ═══════════════════════════════════════════

const express = require("express");
const db = require("../database");
const { authRequired } = require("../middleware");
const router = express.Router();

// ─── 내 거래 목록 ───
// GET /api/transactions/my
router.get("/my", authRequired, (req, res) => {
  const userId = req.user.id;
  const buying = db.find("transactions", t => t.buyer_id === userId && t.status !== "cancelled");
  const selling = db.find("transactions", t => t.seller_id === userId && t.status !== "cancelled");

  const format = (t, role) => {
    const product = db.findOne("products", p => p.id === t.product_id);
    const other = role === "buyer"
      ? db.findOne("users", u => u.id === t.seller_id)
      : db.findOne("users", u => u.id === t.buyer_id);
    return {
      ...t,
      role,
      product_name: t.product_name || product?.name || "상품",
      other_name: other?.name || "알 수 없음",
      status_text: getStatusText(t.status, role),
      next_action: getNextAction(t.status, role),
    };
  };

  res.json({
    buying: buying.map(t => format(t, "buyer")).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    selling: selling.map(t => format(t, "seller")).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  });
});

// ─── 거래 상세 ───
// GET /api/transactions/:id
router.get("/:id", authRequired, (req, res) => {
  const t = db.findOne("transactions", t => t.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
  if (t.buyer_id !== req.user.id && t.seller_id !== req.user.id) {
    return res.status(403).json({ error: "이 거래에 대한 권한이 없습니다" });
  }

  const role = t.buyer_id === req.user.id ? "buyer" : "seller";
  const product = db.findOne("products", p => p.id === t.product_id);
  const buyer = db.findOne("users", u => u.id === t.buyer_id);
  const seller = db.findOne("users", u => u.id === t.seller_id);

  res.json({
    ...t,
    role,
    product_name: t.product_name || product?.name,
    buyer_name: buyer?.name,
    seller_name: seller?.name,
    status_text: getStatusText(t.status, role),
    next_action: getNextAction(t.status, role),
    timeline: getTimeline(t),
  });
});

// ─── 판매자: 배송 시작 ───
// POST /api/transactions/:id/ship
router.post("/:id/ship", authRequired, (req, res) => {
  const t = db.findOne("transactions", t => t.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
  if (t.seller_id !== req.user.id) return res.status(403).json({ error: "판매자만 배송 처리할 수 있습니다" });
  if (t.status !== "paid") return res.status(400).json({ error: "결제 완료 상태에서만 배송할 수 있습니다" });

  const tracking = req.body.tracking_number || "";
  db.update("transactions", tx => tx.id === t.id, { status: "shipped", tracking_number: tracking, shipped_at: new Date().toISOString() });
  res.json({ message: "배송 처리 완료! 구매자에게 알림이 전송됩니다.", status: "shipped" });
});

// ─── 구매자: 수령 확인 ───
// POST /api/transactions/:id/confirm
router.post("/:id/confirm", authRequired, (req, res) => {
  const t = db.findOne("transactions", t => t.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
  if (t.buyer_id !== req.user.id) return res.status(403).json({ error: "구매자만 수령 확인할 수 있습니다" });
  if (t.status !== "shipped") return res.status(400).json({ error: "배송중 상태에서만 수령 확인할 수 있습니다" });

  db.update("transactions", tx => tx.id === t.id, { status: "received", received_at: new Date().toISOString() });

  // 포인트 자동 적립!
  const { addPoints } = require("./rewards");
  addPoints(t.buyer_id, "buy");   // 구매자 +100P
  addPoints(t.seller_id, "sell"); // 판매자 +100P

  // 자동 정산 (실제로는 PG사 연동 후 처리)
  setTimeout(() => {
    db.update("transactions", tx => tx.id === t.id, { status: "settled", settled_at: new Date().toISOString() });
    db.update("products", p => p.id === t.product_id, { status: "sold" });
  }, 1000);

  const settlement = t.price; // 판매자 수수료 0%
  res.json({ message: "수령 확인 완료! 판매자에게 " + settlement.toLocaleString() + "원이 정산됩니다.", status: "received", settlement });
});

// ─── 거래 취소 ───
// POST /api/transactions/:id/cancel
router.post("/:id/cancel", authRequired, (req, res) => {
  const t = db.findOne("transactions", t => t.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
  if (t.buyer_id !== req.user.id && t.seller_id !== req.user.id) return res.status(403).json({ error: "권한이 없습니다" });
  if (t.status === "settled" || t.status === "received") return res.status(400).json({ error: "이미 완료된 거래는 취소할 수 없습니다" });

  db.update("transactions", tx => tx.id === t.id, { status: "cancelled", cancelled_at: new Date().toISOString() });
  db.update("products", p => p.id === t.product_id, { status: "active" });
  res.json({ message: "거래가 취소되었습니다. 결제 금액이 환불됩니다.", status: "cancelled" });
});

// ─── 상태 텍스트 ───
function getStatusText(status, role) {
  const texts = {
    paid: role === "buyer" ? "결제 완료 · 판매자 배송 대기" : "구매자 결제 완료 · 배송해주세요!",
    shipped: role === "buyer" ? "배송 중 · 상품 도착 후 수령 확인해주세요" : "배송 완료 · 구매자 수령 대기",
    received: "수령 확인 · 정산 처리 중",
    settled: "거래 완료! 정산 완료",
    cancelled: "거래 취소됨",
    direct_contact: "일반거래 · 판매자와 직접 연락",
  };
  return texts[status] || status;
}

// ─── 다음 행동 ───
function getNextAction(status, role) {
  if (status === "paid" && role === "seller") return { action: "ship", label: "배송 처리하기" };
  if (status === "shipped" && role === "buyer") return { action: "confirm", label: "수령 확인하기" };
  if (status === "paid" || status === "shipped") return { action: "cancel", label: "거래 취소" };
  return null;
}

// ─── 타임라인 ───
function getTimeline(t) {
  const timeline = [{ step: "결제 완료", done: true, time: t.created_at, icon: "💳" }];
  if (t.shipped_at || t.status === "shipped" || t.status === "received" || t.status === "settled") {
    timeline.push({ step: "배송 시작", done: true, time: t.shipped_at, icon: "📦" });
  } else {
    timeline.push({ step: "배송 대기", done: false, icon: "📦" });
  }
  if (t.received_at || t.status === "received" || t.status === "settled") {
    timeline.push({ step: "수령 확인", done: true, time: t.received_at, icon: "✅" });
  } else {
    timeline.push({ step: "수령 대기", done: false, icon: "✅" });
  }
  if (t.settled_at || t.status === "settled") {
    timeline.push({ step: "정산 완료", done: true, time: t.settled_at, icon: "💰" });
  } else {
    timeline.push({ step: "정산 대기", done: false, icon: "💰" });
  }
  return timeline;
}

module.exports = router;
