#!/bin/bash
# Test product creation
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

echo "Testing Product Creation..."
echo ""
curl -s -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Test Ghee",
    "product_code": "PRD123TEST",
    "unit": "kg",
    "price_per_unit": 500,
    "description": "Pure cow ghee",
    "is_active": true
  }' | python3 -m json.tool
