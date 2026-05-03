const express = require("express");
const db = require("../database");
const { authRequired } = require("../middleware");
const router = express.Router();

// 내 알림 목록
router.get("/", authRequired, (req, res) => {
  const notifs = db.find("notifications", n => n.user_id === req.user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 30);
  const unread = notifs.filter(n => !n.read).length;
  res.json({ notifications: notifs, unread_count: unread });
});

// 알림 읽음 처리
router.post("/read", authRequired, (req, res) => {
  const notifs = db.find("notifications", n => n.user_id === req.user.id && !n.read);
  notifs.forEach(n => db.update("notifications", nt => nt.id === n.id, { read: true }));
  res.json({ message: "읽음 처리 완료", count: notifs.length });
});

module.exports = router;
