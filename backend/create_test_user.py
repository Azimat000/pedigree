# backend/create_test_user.py
from backend.database import SessionLocal
from backend import models

# Создаём сессию
db = SessionLocal()

# --- данные тестового пользователя ---
email = "test@example.com"
password = "password123"  # тестовый пароль
full_name = "Test User"

# Создаём пользователя
user = models.User(
    email=email,
    hashed_password = "password123",
    full_name=full_name,
    role="admin",
    is_active=True
)

db.add(user)
db.commit()
db.refresh(user)

print(f"Created user: {user.email} with id {user.id}")
db.close()
