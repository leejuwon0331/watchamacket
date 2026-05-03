const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../database");
const { authRequired, authOptional, getFeeRate } = require("../middleware");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => cb(null, "p-" + Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 상품 목록 (필터 강화)
router.get("/", authOptional, (req, res) => {
  const { brand, sort, q, minPrice, maxPrice, condition, location } = req.query;
  let items = db.find("products", p => p.status === "active");
  if (brand && brand !== "all") items = items.filter(p => p.brand === brand);
  if (q) items = items.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  if (minPrice) items = items.filter(p => p.price >= Number(minPrice));
  if (maxPrice) items = items.filter(p => p.price <= Number(maxPrice));
  if (condition) items = items.filter(p => p.condition === condition);
  if (location) items = items.filter(p => p.location && p.location.includes(location));
  if (sort === "low") items.sort((a, b) => a.price - b.price);
  else if (sort === "high") items.sort((a, b) => b.price - a.price);
  else if (sort === "popular") items.sort((a, b) => db.count("likes", l => l.product_id === b.id) - db.count("likes", l => l.product_id === a.id));
  else if (sort === "discount") items.sort((a, b) => { const da = a.original_price ? (a.original_price - a.price) / a.original_price : 0; const db2 = b.original_price ? (b.original_price - b.price) / b.original_price : 0; return db2 - da; });
  else items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const tier = req.user ? (db.findOne("users", u => u.id === req.user.id)?.pass_tier || "free") : "free";
  const result = items.map(p => {
    const seller = db.findOne("users", u => u.id === p.seller_id);
    const rate = getFeeRate(p.price, tier);
    const reviews = db.find("reviews", r => r.seller_id === p.seller_id);
    const avgRating = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10 : 0;
    const sellerTxCount = db.count("transactions", t => t.seller_id === p.seller_id && t.status === "settled");
    return { ...p, seller_name: seller?.name || "알 수 없음", seller_level: getSellerLevel(sellerTxCount), seller_rating: avgRating, seller_review_count: reviews.length, fee_rate: rate, fee_amount: Math.round(p.price * rate / 100), like_count: db.count("likes", l => l.product_id === p.id) };
  });
  res.json({ products: result });
});

// 상품 상세
router.get("/:id", authOptional, (req, res) => {
  const p = db.findOne("products", p => p.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
  db.update("products", pr => pr.id === p.id, { views: (p.views || 0) + 1 });
  const seller = db.findOne("users", u => u.id === p.seller_id);
  const tier = req.user ? (db.findOne("users", u => u.id === req.user.id)?.pass_tier || "free") : "free";
  const rate = getFeeRate(p.price, tier);
  const reviews = db.find("reviews", r => r.seller_id === p.seller_id);
  const avgRating = reviews.length ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10 : 0;
  const sellerTxCount = db.count("transactions", t => t.seller_id === p.seller_id && t.status === "settled");
  const inquiries = db.find("inquiries", i => i.product_id === p.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(i => {
    const author = db.findOne("users", u => u.id === i.author_id);
    return { ...i, author_name: author?.name || "알 수 없음" };
  });
  res.json({ ...p, seller_name: seller?.name, seller_kakao: seller?.kakao_link || null, seller_level: getSellerLevel(sellerTxCount), seller_rating: avgRating, seller_review_count: reviews.length, seller_reviews: reviews.slice(0, 5), fee_rate: rate, fee_amount: Math.round(p.price * rate / 100), like_count: db.count("likes", l => l.product_id === p.id), inquiries });
});

// 상품 등록 (다중 이미지)
router.post("/", authRequired, upload.array("images", 5), (req, res) => {
  const { name, description, price, original_price, brand, condition, location, checklist, kakao_link } = req.body;
  if (!name || !price || !brand) return res.status(400).json({ error: "상품명, 가격, 브랜드 필수" });
  const images = req.files ? req.files.map(f => "/uploads/" + f.filename) : [];
  if (kakao_link) db.update("users", u => u.id === req.user.id, { kakao_link });
  const product = db.insert("products", { seller_id: req.user.id, name, description, price: Number(price), original_price: Number(original_price) || null, brand, condition: condition || "A급", location, image_url: images[0] || null, images: JSON.stringify(images), checklist: checklist || null, status: "active", views: 0 });
  res.status(201).json({ message: "상품 등록 완료!", product_id: product.id });
});

// 찜
router.post("/:id/like", authRequired, (req, res) => {
  const ex = db.findOne("likes", l => l.user_id === req.user.id && l.product_id === Number(req.params.id));
  if (ex) { db.remove("likes", l => l.user_id === req.user.id && l.product_id === Number(req.params.id)); res.json({ liked: false }); }
  else { db.insert("likes", { user_id: req.user.id, product_id: Number(req.params.id) }); res.json({ liked: true }); }
});

// 구매
router.post("/:id/buy", authRequired, (req, res) => {
  const p = db.findOne("products", p => p.id === Number(req.params.id) && p.status === "active");
  if (!p) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
  if (p.seller_id === req.user.id) return res.status(400).json({ error: "자신의 상품은 구매 불가" });
  const buyer = db.findOne("users", u => u.id === req.user.id);
  const txType = req.body.tx_type || "safe";
  const rate = txType === "safe" ? getFeeRate(p.price, buyer.pass_tier) : 0;
  const fee = Math.round(p.price * rate / 100);
  const tx = db.insert("transactions", { product_id: p.id, buyer_id: req.user.id, seller_id: p.seller_id, price: p.price, fee_rate: rate, fee_amount: fee, tx_type: txType, status: txType === "safe" ? "paid" : "direct_contact", product_name: p.name });
  db.update("products", pr => pr.id === p.id, { status: "in_transaction" });
  // 알림 생성
  addNotification(p.seller_id, "거래", "'" + p.name + "' 상품이 구매되었습니다!", "/my-tx");
  res.status(201).json({ message: txType === "safe" ? "안전거래 결제 완료!" : "일반거래 시작!", transaction_id: tx.id, price: p.price, fee_rate: rate, fee_amount: fee, total: p.price + fee });
});

// 거래 후기 작성
router.post("/:id/review", authRequired, (req, res) => {
  const { rating, content, transaction_id } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "별점 1~5 필수" });
  const p = db.findOne("products", p => p.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
  const existing = db.findOne("reviews", r => r.product_id === p.id && r.reviewer_id === req.user.id);
  if (existing) return res.status(400).json({ error: "이미 후기를 작성했습니다" });
  const reviewer = db.findOne("users", u => u.id === req.user.id);
  db.insert("reviews", { product_id: p.id, seller_id: p.seller_id, reviewer_id: req.user.id, reviewer_name: reviewer.name, rating: Number(rating), content: content || "" });
  addNotification(p.seller_id, "후기", reviewer.name + "님이 후기를 남겼습니다 (⭐" + rating + ")", null);
  res.json({ message: "후기가 등록되었습니다!" });
});

// 문의하기
router.post("/:id/inquiry", authRequired, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "문의 내용을 입력해주세요" });
  const p = db.findOne("products", p => p.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "상품을 찾을 수 없습니다" });
  db.insert("inquiries", { product_id: p.id, author_id: req.user.id, content, reply: null });
  addNotification(p.seller_id, "문의", "'" + p.name + "'에 새 문의가 도착했습니다", null);
  res.json({ message: "문의가 등록되었습니다!" });
});

// 문의 답변 (판매자)
router.post("/inquiry/:inqId/reply", authRequired, (req, res) => {
  const inq = db.findOne("inquiries", i => i.id === Number(req.params.inqId));
  if (!inq) return res.status(404).json({ error: "문의를 찾을 수 없습니다" });
  const p = db.findOne("products", p => p.id === inq.product_id);
  if (!p || p.seller_id !== req.user.id) return res.status(403).json({ error: "판매자만 답변 가능" });
  db.update("inquiries", i => i.id === inq.id, { reply: req.body.content });
  addNotification(inq.author_id, "답변", "문의에 판매자가 답변했습니다", null);
  res.json({ message: "답변 완료!" });
});

function getSellerLevel(txCount) {
  if (txCount >= 50) return { name: "🏆 마스터셀러", color: "#C8A55A" };
  if (txCount >= 20) return { name: "⭐ 파워셀러", color: "#8E44AD" };
  if (txCount >= 5) return { name: "✅ 인증셀러", color: "#27AE60" };
  return { name: "🌱 새싹셀러", color: "#888" };
}

function addNotification(userId, type, message, link) {
  db.insert("notifications", { user_id: userId, type, message, link, read: false });
}

module.exports = router;
