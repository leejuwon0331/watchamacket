const jwt = require("jsonwebtoken");
const SECRET = "watcha-market-secret-2026";
function authRequired(req,res,next){const h=req.headers.authorization;if(!h||!h.startsWith("Bearer "))return res.status(401).json({error:"로그인이 필요합니다"});try{req.user=jwt.verify(h.split(" ")[1],SECRET);next();}catch(e){res.status(401).json({error:"다시 로그인해주세요"});}}
function authOptional(req,res,next){const h=req.headers.authorization;if(h&&h.startsWith("Bearer ")){try{req.user=jwt.verify(h.split(" ")[1],SECRET);}catch(e){req.user=null;}}next();}
function getFeeRate(price,tier){const p=price/10000;if(tier==="prime")return p<=5?0:p<=50?1.5:p<=300?3:p<=1000?3.5:4;if(tier==="royal")return p<=5?0:p<=50?1.5:p<=300?2.5:p<=1000?3:3.5;if(tier==="black")return p<=5?0:p<=50?1:p<=300?2:p<=1000?2.5:3;return p<=5?0:p<=50?2:p<=300?3.5:p<=1000?4:5;}
function getAuctionFee(amount,tier){const r={free:5,prime:4.5,royal:4,black:3.5};return r[tier]||5;}
module.exports={authRequired,authOptional,getFeeRate,getAuctionFee,SECRET};
