#!/bin/bash
# StudioSpace server — endpoint smoke test suite
# Run: bash scripts/test.sh  (server must be running)
B="${1:-http://localhost:5001}"
PASS=0; FAIL=0; TMP=$(mktemp -d)
check() { # check <desc> <expected-substr> <actual>
  if [[ "$3" == *"$2"* ]]; then PASS=$((PASS+1)); echo "  ✅ $1"; else FAIL=$((FAIL+1)); echo "  ❌ $1  (wanted: $2)  got: ${3:0:240}"; fi
}
jq() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const o=JSON.parse(d);console.log($1)}catch(e){console.log('PARSE_ERR')}})"; }

OWNER=seed@example.com        # owns seed data + test listings
CUST=customer@example.com     # books other people's studios
CKO="$TMP/owner.jar"; CKC="$TMP/cust.jar"

login() { # login <email> <jarfile>
  curl -s -c "$2" -X POST $B/jwt -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" -d "{\"email\":\"$1\"}" > /dev/null
}

echo "== Health =="
check "GET / returns text" "running" "$(curl -s $B/)"
check "GET /health lists categories" "Podcast Lounge" "$(curl -s $B/health)"

echo "== Studios queries =="
N=$(curl -s "$B/studios?search=dhaka" | jq "JSON.parse(d).length")
[ "$N" -ge 1 ] && check "search=dhaka returns results (got $N)" "ok" "ok" || check "search=dhaka (got $N)" ">=1" "none"
check "category filter Music Suite" "Music Suite" "$(curl -s "$B/studios?category=Music%20Suite" | jq "JSON.parse(d).map(s=>s.category).join(',')")"
HIGH=$(curl -s "$B/studios?sort=priceHigh&limit=2" | jq "JSON.parse(d)[0].hourlyRate")
LOW=$(curl -s "$B/studios?sort=priceLow&limit=1" | jq "JSON.parse(d)[0].hourlyRate")
[ "$HIGH" -gt "$LOW" ] && check "sort price ordering (high $HIGH > $LOW)" "ok" "ok" || check "sort price ordering" "high>low" "$HIGH vs $LOW"
NEW0=$(curl -s "$B/studios?sort=newest" | jq "new Date(JSON.parse(d)[0].createdAt) >= new Date(JSON.parse(d).at(-1).createdAt)")
check "sort=newest ordering" "true" "$NEW0"
check "limit respected" "2" "$(curl -s "$B/studios?limit=2" | jq "JSON.parse(d).length")"
check "bad ObjectId → 404" "Studio not found" "$(curl -s $B/studios/999999999912345678901234)"
check "unknown-but-valid id → 404" "Studio not found" "$(curl -s $B/studios/5f6f8bb2bbf0a3d50cc75f6f)"

echo "== JWT + auth-protected studio mutation =="
check "POST /studios without token → 401" "Unauthorized access" "$(curl -s -X POST $B/studios -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" -d '{"title":"x"}')"
check "GET /my-studios without token → 401" "Unauthorized access" "$(curl -s "$B/my-studios?email=$OWNER")"
login $OWNER $CKO
cat > "$TMP/newstudio.json" <<EOF
{"title":"Test Loop Studio","category":"Music Suite","hourlyRate":33,"securityDeposit":50,"maxCapacity":4,"location":"Test Dhaka","image":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900","amenities":["Mixer","Wi-Fi"],"overview":"Test overview for the loop suite.","ownerName":"Seed Owner","ownerEmail":"$OWNER","ownerPhoto":"","rating":4.5,"totalReviews":0}
EOF
NEWID=$(curl -s -b $CKO -X POST $B/studios -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" --data-binary "@$TMP/newstudio.json" | jq "JSON.parse(d).insertedId")
check "POST /studios with token creates studio" "24-hex" "$(echo $NEWID | grep -E '^[0-9a-f]{24}$' >/dev/null && echo 24-hex)"
check "GET /my-studios lists it (root path)" "Test Loop Studio" "$(curl -s -b $CKO "$B/my-studios?email=$OWNER" | jq "JSON.parse(d).find(s=>s.title==='Test Loop Studio')?.title||'NOPE'")"
check "GET /studios/my-studios alias lists it" "Test Loop Studio" "$(curl -s -b $CKO "$B/studios/my-studios?email=$OWNER" | jq "JSON.parse(d).find(s=>s.title==='Test Loop Studio')?.title||'NOPE'")"
check "GET /my-studios MISMATCHED email → 403" "Forbidden" "$(curl -s -b $CKO "$B/my-studios?email=hacker@example.com")"

login $CUST $CKC
check "PATCH someone else's studio → 403" "Forbidden" "$(curl -s -b $CKC -X PATCH $B/studios/$NEWID -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" -d '{"title":"hacked"}')"
check "DELETE someone else's studio → 403" "Forbidden" "$(curl -s -b $CKC -X DELETE $B/studios/$NEWID)"
check "PATCH own studio updates rate" "modifiedCount" "$(curl -s -b $CKO -X PATCH $B/studios/$NEWID -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" -d '{"hourlyRate":35}')"
RATED=$(curl -s $B/studios/$NEWID | jq "JSON.parse(d).hourlyRate")
check "PATCH persisted (35 → got $RATED)" "35" "$RATED"

echo "== Bookings + double-booking prevention (Challenge 2) =="
CAT='' # customer books seed studio owned by owner
SID=$(curl -s -b $CKO "$B/my-studios?email=$OWNER" | jq "JSON.parse(d).find(s=>s.title==='Test Loop Studio')._id")
check "POST /bookings without token → 401" "Unauthorized access" "$(curl -s -X POST $B/bookings -H 'Content-Type: application/json' -d '{}')"
cat > "$TMP/b.json" <<EOF
{"studioId":"$SID","date":"2026-02-10","startTime":"10:00","endTime":"12:00","customerName":"Ada Lovelace"}
EOF
curl -s -b $CKC -X POST $B/bookings -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" --data-binary "@$TMP/b.json" > "$TMP/b1.json"
check "customer books owner studio → Pending" "Pending" "$(cat "$TMP/b1.json" | jq "JSON.parse(d).booking?.status||'NOPE'")"
COST=$(cat "$TMP/b1.json" | jq "JSON.parse(d).booking?.totalCost")
check "cost computed server-side (2h × \$35 = 70)" "70" "$COST"
BID=$(cat "$TMP/b1.json" | jq "JSON.parse(d).insertedId")
check "overlap 11:00–13:00 → 409 clear message" "already booked" "$(curl -s -b $CKC -X POST $B/bookings -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" --data-binary "@$TMP/b.json" | sed 's/12:00/11:00/' >/dev/null; cat > "$TMP/b2.json" <<EOF2
{"studioId":"$SID","date":"2026-02-10","startTime":"11:00","endTime":"13:00"}
EOF2
curl -s -b $CKC -X POST $B/bookings -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" --data-binary "@$TMP/b2.json")"
check "no overlap 12:00–14:00 → succeeds" "Pending" "$(cat > "$TMP/b3.json" <<EOF3
{"studioId":"$SID","date":"2026-02-10","startTime":"12:00","endTime":"14:00"}
EOF3
curl -s -b $CKC -X POST $B/bookings -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" --data-binary "@$TMP/b3.json" | jq "JSON.parse(d).booking?.status||'NOPE'")"
BID2=$(curl -s -b $CKC "$B/bookings?email=$CUST" | jq "JSON.parse(d).filter(b=>b.startTime==='12:00')[0]?._id")
check "GET /bookings?email lists own bookings" "$BID" "$(curl -s -b $CKC "$B/bookings?email=$CUST" | jq "JSON.parse(d).find(b=>b._id==='$BID')?._id")"
check "GET /bookings mismatched email → 403" "Forbidden" "$(curl -s -b $CKC "$B/bookings?email=$OWNER")"
check "cancel booking" "cancelled" "$(curl -s -b $CKC -X PATCH $B/bookings/$BID/cancel)"
check "cancel twice → 409 (no longer Pending)" "Only pending bookings" "$(curl -s -b $CKC -X PATCH $B/bookings/$BID/cancel)"
check "cleanup: cancel 2nd booking" "Booking cancelled" "$(curl -s -b $CKC -X PATCH $B/bookings/$BID2/cancel)"

echo "== Wishlist =="
check "POST /wishlist no token → 401" "Unauthorized access" "$(curl -s -X POST $B/wishlist -H 'Content-Type: application/json' -d '{}')"
cat > "$TMP/w.json" <<EOF
{"studioId":"$SID","title":"Test Loop Studio","category":"Music Suite","image":"","location":"Test Dhaka","hourlyRate":35,"rating":4.5,"ownerEmail":"$OWNER"}
EOF
check "POST /wishlist saves" "Saved to wishlist" "$(curl -s -b $CKC -X POST $B/wishlist -H 'Content-Type: application/json' -H "Origin: http://localhost:3000" --data-binary "@$TMP/w.json")"
WID=$(curl -s -b $CKC "$B/wishlist?email=$CUST" | jq "JSON.parse(d).find(w=>w.title==='Test Loop Studio')?._id")
check "GET /wishlist returns saved item" "Test Loop Studio" "$(curl -s -b $CKC "$B/wishlist?email=$CUST" | jq "JSON.parse(d).find(w=>w.title==='Test Loop Studio')?.title||'NOPE'")"
check "GET /wishlist mismatched email → 403" "Forbidden" "$(curl -s -b $CKC "$B/wishlist?email=$OWNER")"
check "DELETE /wishlist/:id" "Removed from wishlist" "$(curl -s -b $CKC -X DELETE $B/wishlist/$WID)"

echo "== Logout + cleanup =="
check "owner DELETE with token" "deleted" "$(curl -s -b $CKO -X DELETE $B/studios/$NEWID)"
check "deleted studio → 404" "Studio not found" "$(curl -s $B/studios/$NEWID)"
check "POST /logout clears cookie" "Logged out" "$(curl -s -c $CKO -b $CKO -X POST $B/logout)"
check "DELETE after logout w/ refreshed jar → 401" "Unauthorized access" "$(curl -s -b $CKO -X POST $B/studios -H 'Content-Type: application/json' -d '{"title":"x"}')"

rm -rf "$TMP"
echo
echo "RESULTS: $PASS passed, $FAIL failed"
exit $FAIL