#!/bin/bash

echo "🔍 Testing Frontend + Backend Connection..."
echo ""

# Test Backend
echo "1️⃣ Testing Backend (http://localhost:5000/api/health)..."
BACKEND_RESPONSE=$(curl -s http://localhost:5000/api/health 2>&1)

if [[ $BACKEND_RESPONSE == *"status"* ]]; then
  echo "✅ Backend is running!"
  echo "   Response: $BACKEND_RESPONSE"
else
  echo "❌ Backend is NOT running!"
  echo "   Error: $BACKEND_RESPONSE"
  echo ""
  echo "💡 Fix: Run 'cd backend && npm start' in another terminal"
  exit 1
fi

echo ""

# Test Frontend
echo "2️⃣ Testing Frontend (http://localhost:5173)..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>&1)

if [[ $FRONTEND_RESPONSE == "200" ]]; then
  echo "✅ Frontend is running!"
  echo "   HTTP Status: $FRONTEND_RESPONSE"
else
  echo "❌ Frontend is NOT running!"
  echo "   HTTP Status: $FRONTEND_RESPONSE"
  echo ""
  echo "💡 Fix: Run 'cd frontend && npm run dev' in another terminal"
  exit 1
fi

echo ""
echo "🎉 All services are running!"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Login with: admin / Admin123"
echo ""
