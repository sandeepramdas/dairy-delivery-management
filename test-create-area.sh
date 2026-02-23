#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "Testing Area Creation..."
echo ""
curl -s -X POST http://localhost:3000/api/v1/areas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Zone",
    "code": "TEST-ZONE",
    "description": "Test area for validation",
    "delivery_charge": 10.00,
    "is_active": true
  }' | python3 -m json.tool
