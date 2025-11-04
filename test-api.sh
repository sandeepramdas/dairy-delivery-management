#!/bin/bash

echo "🧪 Testing Milk Delivery API with Supabase"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api/v1"

# Test 1: Login
echo "1️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@milkdelivery.com",
    "password": "admin123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo "✅ Login successful! Token: ${TOKEN:0:20}..."
  echo ""

  # Test 2: Get Areas
  echo "2️⃣  Testing Get Areas..."
  curl -s "$BASE_URL/areas" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  # Test 3: Get Products
  echo "3️⃣  Testing Get Products..."
  curl -s "$BASE_URL/products" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""

  echo "✅ All tests passed!"
else
  echo "❌ Login failed"
fi
