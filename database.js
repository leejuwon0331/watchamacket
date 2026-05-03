const fs = require("fs");
const path = require("path");
const DB_PATH = path.join(__dirname, "data", "db.json");
const DEFAULT = { users:[], products:[], likes:[], transactions:[], auctions:[], bids:[], subscriptions:[], posts:[], comments:[], post_likes:[], point_history:[], reward_items:[], reward_claims:[], reviews:[], inquiries:[], notifications:[], chat_rooms:[], chat_messages:[], nextId:{users:1,products:1,likes:1,transactions:1,auctions:1,bids:1,subscriptions:1,posts:1,comments:1,post_likes:1,point_history:1,reward_items:1,reward_claims:1,reviews:1,inquiries:1,notifications:1,chat_rooms:1,chat_messages:1} };
function load(){try{if(fs.existsSync(DB_PATH))return JSON.parse(fs.readFileSync(DB_PATH,"utf-8"));}catch(e){}return JSON.parse(JSON.stringify(DEFAULT));}
function save(d){fs.writeFileSync(DB_PATH,JSON.stringify(d,null,2),"utf-8");}
function insert(t,item){const d=load();const id=d.nextId[t]++;const n={id,...item,created_at:new Date().toISOString()};d[t].push(n);save(d);return n;}
function find(t,cond){return load()[t].filter(cond);}
function findOne(t,cond){return load()[t].find(cond);}
function update(t,cond,updates){const d=load();const i=d[t].findIndex(cond);if(i===-1)return null;d[t][i]={...d[t][i],...updates,updated_at:new Date().toISOString()};save(d);return d[t][i];}
function remove(t,cond){const d=load();const b=d[t].length;d[t]=d[t].filter(x=>!cond(x));save(d);return b!==d[t].length;}
function count(t,cond){const d=load();return cond?d[t].filter(cond).length:d[t].length;}
console.log("✅ 데이터베이스 준비 완료!");
module.exports={insert,find,findOne,update,remove,count};
