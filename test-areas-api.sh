#!/bin/bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "Token received: ${TOKEN:0:20}..."
echo ""
echo "Testing areas API:"
curl -s http://localhost:3000/api/v1/areas?is_active=true \
  -H "Authorization: Bearer $TOKEN"
