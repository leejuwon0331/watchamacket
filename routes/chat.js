const express = require("express");
const db = require("../database");
const { authRequired } = require("../middleware");
const router = express.Router();

// 채팅방 목록
router.get("/rooms", authRequired, (req, res) => {
  const rooms = db.find("chat_rooms", r => r.buyer_id === req.user.id || r.seller_id === req.user.id)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
  const result = rooms.map(r => {
    const other = r.buyer_id === req.user.id
      ? db.findOne("users", u => u.id === r.seller_id)
      : db.findOne("users", u => u.id === r.buyer_id);
    const msgs = db.find("chat_messages", m => m.room_id === r.id);
    const last = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const unread = msgs.filter(m => m.sender_id !== req.user.id && !m.read).length;
    return { ...r, other_name: other?.name || "알 수 없음", last_message: last?.content || "", last_time: last?.created_at, unread };
  });
  res.json({ rooms: result });
});

// 채팅방 생성 또는 기존 방 찾기
router.post("/room", authRequired, (req, res) => {
  const { product_id, seller_id } = req.body;
  if (seller_id === req.user.id) return res.status(400).json({ error: "자신에게 채팅할 수 없습니다" });
  const existing = db.findOne("chat_rooms", r =>
    r.product_id === product_id && ((r.buyer_id === req.user.id && r.seller_id === seller_id) || (r.seller_id === req.user.id && r.buyer_id === seller_id)));
  if (existing) return res.json({ room: existing });
  const product = db.findOne("products", p => p.id === product_id);
  const room = db.insert("chat_rooms", { product_id, product_name: product?.name || "상품", buyer_id: req.user.id, seller_id });
  res.status(201).json({ room });
});

// 메시지 목록
router.get("/room/:id/messages", authRequired, (req, res) => {
  const room = db.findOne("chat_rooms", r => r.id === Number(req.params.id));
  if (!room) return res.status(404).json({ error: "채팅방 없음" });
  if (room.buyer_id !== req.user.id && room.seller_id !== req.user.id) return res.status(403).json({ error: "권한 없음" });
  const msgs = db.find("chat_messages", m => m.room_id === room.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  // 읽음 처리
  msgs.filter(m => m.sender_id !== req.user.id && !m.read).forEach(m => db.update("chat_messages", msg => msg.id === m.id, { read: true }));
  const other = room.buyer_id === req.user.id
    ? db.findOne("users", u => u.id === room.seller_id)
    : db.findOne("users", u => u.id === room.buyer_id);
  res.json({ room, messages: msgs, other_name: other?.name || "알 수 없음" });
});

// 메시지 보내기
router.post("/room/:id/send", authRequired, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "내용을 입력해주세요" });
  const room = db.findOne("chat_rooms", r => r.id === Number(req.params.id));
  if (!room) return res.status(404).json({ error: "채팅방 없음" });
  if (room.buyer_id !== req.user.id && room.seller_id !== req.user.id) return res.status(403).json({ error: "권한 없음" });
  const sender = db.findOne("users", u => u.id === req.user.id);
  const msg = db.insert("chat_messages", { room_id: room.id, sender_id: req.user.id, sender_name: sender.name, content, read: false });
  db.update("chat_rooms", r => r.id === room.id, { updated_at: new Date().toISOString() });
  res.json({ message: msg });
});

module.exports = router;
