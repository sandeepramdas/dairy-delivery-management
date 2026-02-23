#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "Testing Payments API - GET all payments..."
curl -s "http://localhost:3000/api/v1/payments" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "Testing Payments API - Create payment..."
# Get a customer ID
CUSTOMER_ID=$(curl -s "http://localhost:3000/api/v1/customers?limit=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['id'])")

curl -s -X POST "http://localhost:3000/api/v1/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"amount\": 100.50,
    \"payment_method\": \"cash\",
    \"payment_date\": \"2025-11-04\",
    \"reference_number\": \"PAY-TEST-001\",
    \"notes\": \"Test payment\"
  }" | python3 -m json.tool
