const db=require("./database"),bcrypt=require("bcryptjs");
console.log("샘플 데이터 넣는 중...\n");
const pw=bcrypt.hashSync("123456",10);
[{email:"watch@test.com",name:"시계매니아",phone:"010-1234-5678"},{email:"seiko@test.com",name:"워치콜렉터",phone:"010-2345-6789"},{email:"casio@test.com",name:"디지털마켓",phone:"010-3456-7890"},{email:"swiss@test.com",name:"스위스타임",phone:"010-4567-8901"},{email:"vintage@test.com",name:"빈티지숍",phone:"010-5678-9012"}].forEach(u=>db.insert("users",{...u,password:pw,pass_tier:"free"}));
[{seller_id:1,name:"카시오 G-SHOCK GA-2100-1A1 카시오크",price:89000,original_price:150000,brand:"casio",condition:"A급",location:"서울 강남구",description:"일명 카시오크. 3회 착용, 풀박스.",status:"active",views:182},{seller_id:2,name:"세이코 프레사지 SRPD37 칵테일타임",price:245000,original_price:380000,brand:"seiko",condition:"S급",location:"서울 마포구",description:"미착용 새제품. 보증서 포함.",status:"active",views:305},{seller_id:2,name:"오리엔트 뱀비노 V2",price:95000,original_price:180000,brand:"orient",condition:"A급",location:"부산 해운대구",description:"가성비 최강 드레스워치.",status:"active",views:198},{seller_id:1,name:"스와치 x 오메가 문스와치 미션 투 더 문",price:380000,original_price:390000,brand:"swatch",condition:"S급",location:"서울 종로구",description:"미착용 풀박스.",status:"active",views:712},{seller_id:4,name:"해밀턴 카키 필드 38mm",price:420000,original_price:650000,brand:"hamilton",condition:"A급",location:"대전 유성구",description:"첫 스위스 시계 추천 1위.",status:"active",views:389},{seller_id:3,name:"카시오 G-SHOCK DW-5600BB 올블랙",price:45000,original_price:99000,brand:"casio",condition:"B급",location:"경기 수원시",description:"올블랙 스퀘어. 200M 방수.",status:"active",views:241},{seller_id:2,name:"세이코 5 스포츠 SRPD91",price:135000,original_price:230000,brand:"seiko",condition:"A급",location:"인천 부평구",description:"블랙 다이얼 오토매틱.",status:"active",views:256},{seller_id:1,name:"스와치 문스와치 미션 투 어스",price:350000,original_price:390000,brand:"swatch",condition:"A급",location:"서울 홍대",description:"블루 다이얼. 거의 새것.",status:"active",views:503},{seller_id:3,name:"오리엔트 카멜레온",price:78000,original_price:150000,brand:"orient",condition:"A급",location:"광주 북구",description:"레드 다이얼 입문 모델.",status:"active",views:167},{seller_id:4,name:"해밀턴 재즈마스터 오픈하트 40mm",price:680000,original_price:1050000,brand:"hamilton",condition:"S급",location:"서울 강남구",description:"오픈하트 디자인. 미착용.",status:"active",views:612},{seller_id:5,name:"카시오 F-91W 레트로 디지털",price:12000,original_price:25000,brand:"casio",condition:"A급",location:"서울 신촌",description:"전설의 가성비 시계.",status:"active",views:523},{seller_id:2,name:"세이코 프레사지 SRPE43 블루문",price:285000,original_price:420000,brand:"seiko",condition:"S급",location:"서울 잠실",description:"블루문 다이얼. 보증서 포함.",status:"active",views:387}].forEach(p=>db.insert("products",p));
const now=Date.now();
[{seller_id:1,name:"스와치 문스와치 미션 투 마스 한정",brand:"swatch",condition:"S급",start_price:400000,current_bid:520000,bid_count:18,status:"active",ends_at:new Date(now+62*3600000).toISOString(),description:"레드 다이얼 한정판."},{seller_id:4,name:"해밀턴 벤츄라 엘비스 에디션",brand:"hamilton",condition:"S급",start_price:700000,current_bid:890000,bid_count:24,status:"active",ends_at:new Date(now+30*3600000).toISOString(),description:"엘비스 모델 복각."},{seller_id:5,name:"카시오 G-SHOCK DW-6900 초회판 1994",brand:"casio",condition:"B급",start_price:150000,current_bid:280000,bid_count:31,status:"active",ends_at:new Date(now+5*3600000).toISOString(),description:"1994년 초판 빈티지."},{seller_id:2,name:"세이코 프레사지 아리타 포슬린 한정판",brand:"seiko",condition:"S급",start_price:900000,current_bid:1200000,bid_count:15,status:"active",ends_at:new Date(now+74*3600000).toISOString(),description:"도자기 다이얼. 2000개 한정."}].forEach(a=>db.insert("auctions",a));
[[1,2],[1,4],[2,1],[3,5],[4,1],[5,3]].forEach(([u,p])=>db.insert("likes",{user_id:u,product_id:p}));
[{author_id:1,title:"첫 카시오크 구매! 손목샷 공유합니다",content:"드디어 GA-2100 샀어요! 올블랙 실물이 예뻐요.",type:"wristshot",watch_brand:"casio",watch_model:"GA-2100",status:"active",views:342},{author_id:2,title:"세이코 칵테일타임 3개월 사용 리뷰",content:"그린 다이얼이 빛에 따라 달라져요. 가성비 끝판왕.",type:"review",watch_brand:"seiko",watch_model:"SRPD37",status:"active",views:528},{author_id:3,title:"10만원 이하 입문 시계 추천 부탁!",content:"카시오 G-SHOCK이랑 오리엔트 뱀비노 중 고민이에요.",type:"free",status:"active",views:215}].forEach(p=>db.insert("posts",p));
[{post_id:1,author_id:2,content:"카시오크 축하해요!"},{post_id:1,author_id:3,content:"올블랙 너무 예쁘다..."},{post_id:2,author_id:1,content:"칵테일타임 그린 진짜 예쁘죠!"},{post_id:3,author_id:1,content:"카시오 추천! 내구성 좋아요"}].forEach(c=>db.insert("comments",c));
[[1,1],[2,1],[3,2],[1,2]].forEach(([u,p])=>db.insert("post_likes",{user_id:u,post_id:p}));
// 샘플 안전거래 데이터
db.insert("transactions",{product_id:3,buyer_id:1,seller_id:2,price:95000,fee_rate:2,fee_amount:1900,tx_type:"safe",status:"shipped",product_name:"오리엔트 뱀비노 V2",tracking_number:"CJ1234567890",shipped_at:new Date(now-24*3600000).toISOString()});
db.insert("transactions",{product_id:6,buyer_id:3,seller_id:3,price:45000,fee_rate:0,fee_amount:0,tx_type:"safe",status:"paid",product_name:"카시오 G-SHOCK DW-5600BB 올블랙"});

// 리워드 상점 상품 (포인트로 교환 가능한 시계!)
[
  {name:"카시오 F-91W 레트로",description:"전설의 가성비 시계! 레트로 감성.",points_required:500,stock:10,brand:"casio",status:"active",image:"⌚"},
  {name:"WATCHA MARKET 스트랩",description:"브랜드 로고가 새겨진 나토 스트랩.",points_required:300,stock:20,brand:"watcha",status:"active",image:"🎗️"},
  {name:"시계 보관 케이스 (1칸)",description:"벨벳 내부, 가죽 외피 시계 보관 케이스.",points_required:800,stock:15,brand:"watcha",status:"active",image:"📦"},
  {name:"카시오 G-SHOCK DW-5600BB",description:"올블랙 스퀘어. 내구성 최강.",points_required:2000,stock:5,brand:"casio",status:"active",image:"⚡"},
  {name:"세이코 5 스포츠 SRPD55",description:"블루 다이얼 오토매틱. 데일리 워치.",points_required:5000,stock:3,brand:"seiko",status:"active",image:"🔧"},
  {name:"오리엔트 뱀비노 V2",description:"크림 다이얼 드레스워치. 가성비 끝판왕.",points_required:3000,stock:5,brand:"orient",status:"active",image:"🌀"},
  {name:"해밀턴 카키 필드 38mm",description:"첫 스위스 시계! 밀리터리 헤리티지.",points_required:10000,stock:2,brand:"hamilton",status:"active",image:"🇨🇭"},
  {name:"스와치 문스와치 미션 투 더 문",description:"MZ세대 워너비 시계. 한정 리워드.",points_required:8000,stock:1,brand:"swatch",status:"active",image:"🎨"},
].forEach(r=>db.insert("reward_items",r));

// 테스트 계정에 샘플 포인트 적립
[
  {user_id:1,amount:200,reason:"회원가입 축하",type:"earn"},
  {user_id:1,amount:100,reason:"구매 완료",type:"earn"},
  {user_id:1,amount:100,reason:"구매 완료",type:"earn"},
  {user_id:1,amount:100,reason:"판매 완료",type:"earn"},
  {user_id:1,amount:30,reason:"리뷰 작성",type:"earn"},
  {user_id:1,amount:20,reason:"게시글 작성",type:"earn"},
  {user_id:1,amount:20,reason:"게시글 작성",type:"earn"},
  {user_id:1,amount:5,reason:"댓글 작성",type:"earn"},
  {user_id:1,amount:5,reason:"댓글 작성",type:"earn"},
  {user_id:1,amount:10,reason:"일일 출석",type:"earn"},
  {user_id:1,amount:10,reason:"일일 출석",type:"earn"},
  {user_id:1,amount:10,reason:"일일 출석",type:"earn"},
].forEach(p=>db.insert("point_history",p));

console.log("=============================");
console.log("  샘플 데이터 삽입 완료!");
console.log("  테스트 계정: watch@test.com / 123456");
console.log("  보유 포인트: 610P (워치팬 Lv.2)");
console.log("=============================");
console.log("  이제 npm start 를 입력하세요!");

// 샘플 거래 후기
[
  {product_id:1,seller_id:1,reviewer_id:2,reviewer_name:"워치콜렉터",rating:5,content:"카시오크 상태 완벽! 풀박스 그대로. 빠른 배송 감사합니다."},
  {product_id:4,seller_id:1,reviewer_id:3,reviewer_name:"디지털마켓",rating:4,content:"문스와치 잘 받았어요. 약간의 사용감 있지만 만족합니다."},
  {product_id:2,seller_id:2,reviewer_id:1,reviewer_name:"시계매니아",rating:5,content:"프레사지 새제품 그대로! 보증서도 깔끔. 최고의 판매자."},
  {product_id:7,seller_id:2,reviewer_id:4,reviewer_name:"스위스타임",rating:5,content:"세이코5 완벽한 상태. 나토 스트랩 덤도 감사해요!"},
  {product_id:5,seller_id:4,reviewer_id:1,reviewer_name:"시계매니아",rating:4,content:"해밀턴 잘 받았습니다. 포장도 꼼꼼했어요."},
].forEach(r=>db.insert("reviews",r));

// 샘플 문의
[
  {product_id:1,author_id:3,content:"혹시 스트랩 교체한 적 있나요?",reply:"아니요, 순정 스트랩 그대로입니다!"},
  {product_id:2,author_id:4,content:"직거래 가능한가요? 마포구 근처예요",reply:"네 가능합니다! 채팅 주세요."},
  {product_id:4,author_id:5,content:"문스와치 정품 맞나요?",reply:null},
].forEach(i=>db.insert("inquiries",i));

// 샘플 알림
[
  {user_id:1,type:"거래",message:"'카시오크' 상품이 구매되었습니다!",link:"/my-tx",read:false},
  {user_id:1,type:"후기",message:"워치콜렉터님이 후기를 남겼습니다 (⭐5)",link:null,read:false},
  {user_id:1,type:"문의",message:"'카시오크'에 새 문의가 도착했습니다",link:null,read:true},
  {user_id:1,type:"리워드",message:"구매 완료! +100P 적립되었습니다",link:null,read:true},
].forEach(n=>db.insert("notifications",n));

// 샘플 채팅
db.insert("chat_rooms",{product_id:1,product_name:"카시오 G-SHOCK GA-2100-1A1 카시오크",buyer_id:2,seller_id:1});
db.insert("chat_messages",{room_id:1,sender_id:2,sender_name:"워치콜렉터",content:"안녕하세요! 카시오크 아직 판매 중인가요?",read:true});
db.insert("chat_messages",{room_id:1,sender_id:1,sender_name:"시계매니아",content:"네! 아직 판매 중이에요. 관심 가져주셔서 감사합니다 😊",read:true});
db.insert("chat_messages",{room_id:1,sender_id:2,sender_name:"워치콜렉터",content:"혹시 직거래도 가능할까요? 강남 근처예요",read:true});
db.insert("chat_messages",{room_id:1,sender_id:1,sender_name:"시계매니아",content:"직거래 가능해요! 안전거래로 결제하시면 만나서 확인하고 수령 확인 눌러주시면 됩니다.",read:false});
