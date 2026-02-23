#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@milkdelivery.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")

# Get customer and product IDs
CUSTOMER_ID=$(curl -s "http://localhost:3000/api/v1/customers?limit=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['id'])")

PRODUCT_ID=$(curl -s "http://localhost:3000/api/v1/products?limit=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['id'])")

echo "Testing Subscription Creation..."
echo "Customer ID: $CUSTOMER_ID"
echo "Product ID: $PRODUCT_ID"
echo ""
curl -s -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"product_id\": \"$PRODUCT_ID\",
    \"plan_name\": \"Daily Milk Delivery\",
    \"plan_type\": \"daily\",
    \"start_date\": \"2025-11-05\",
    \"schedule\": [
      {\"day_of_week\": 1, \"quantity\": 1},
      {\"day_of_week\": 2, \"quantity\": 1},
      {\"day_of_week\": 3, \"quantity\": 1},
      {\"day_of_week\": 4, \"quantity\": 1},
      {\"day_of_week\": 5, \"quantity\": 1}
    ]
  }" | python3 -m json.tool
