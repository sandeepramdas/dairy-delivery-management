#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "Testing Delivery Calendar API..."
echo ""
curl -s "http://localhost:3000/api/v1/deliveries/calendar?year=2025&month=11" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
