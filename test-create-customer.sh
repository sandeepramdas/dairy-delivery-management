#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# Get an area ID first
AREA_ID=$(curl -s "http://localhost:3000/api/v1/areas?limit=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['id'])")

echo "Testing Customer Creation..."
echo "Area ID: $AREA_ID"
echo ""
curl -s -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"full_name\": \"Test Customer\",
    \"phone\": \"9876543210\",
    \"email\": \"test@example.com\",
    \"area_id\": \"$AREA_ID\",
    \"address_line1\": \"123 Test Street\",
    \"city\": \"Test City\",
    \"pincode\": \"560001\",
    \"latitude\": 12.9716,
    \"longitude\": 77.5946
  }" | python3 -m json.tool
