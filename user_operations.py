import mysql.connector
from mysql.connector import Error
from argon2 import PasswordHasher
from fastapi import HTTPException
from pydantic import BaseModel
from datetime import datetime
from contextlib import contextmanager
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from typing import List

# MySQL Connection Configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': '3306',
    'user': 'root',
    'password': 'kXcq4TAuY^{py7}',
    'database': 'app_database'
}

ph = PasswordHasher()


class UserData(BaseModel):
    email: str
    password: str


class FavoriteData(BaseModel):
    user_id: int
    supplier_id: str
    screen_opened_at: str
    favorited_at: str
    is_valid_favorite: bool


class ComplaintData(BaseModel):
    user_id: int
    complaint_text: str
    supplier_id: str | None = None


class RatingData(BaseModel):
    user_id: int
    supplier_id: str
    rating: int
    rated_at: str


try:
    from web_client_ids import GOOGLE_CLIENT_IDS
except ImportError:
    print("Warning: web_client_ids.py not found. Using default IDs.")
    GOOGLE_CLIENT_IDS = {
        "web": "Removed keys",
        "android": "Removed keys",
        "ios": "Removed keys"
    }


def google_register_or_login(token: str, platform: str = "android"):
    """Register or login a user with Google credentials"""
    print(f"Received Google auth request with token: {token[:15]}... (truncated), platform: {platform}")

    try:
        # TEST TOKEN HANDLING - �zel test token'lar� i�in
        if token == "mock_token_for_testing" or token.startswith("test_token"):
            print("Using TEST MODE with mock/test token")
            # Test kullan�c�s� i�in email
            test_email = "test@google.com"

            # Kullan�c�n�n var olup olmad���n� kontrol et
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE email = %s", (test_email,))
                user = cursor.fetchone()

                if user:
                    # Kullan�c� varsa, giri� bilgisini d�nd�r
                    print(f"Test user found with ID: {user[0]}")
                    return {
                        "message": "Test Google login successful",
                        "user_id": user[0],
                        "is_new_user": False
                    }
                else:
                    # Yeni test kullan�c�s� olu�tur
                    print(f"Creating new test user with email: {test_email}")
                    import secrets
                    import string

                    # Rastgele �ifre olu�tur
                    alphabet = string.ascii_letters + string.digits
                    random_password = ''.join(secrets.choice(alphabet) for _ in range(16))
                    hashed_password = ph.hash(random_password)

                    # Yeni kullan�c�y� ekle
                    try:
                        cursor.execute(
                            "INSERT INTO users (email, password) VALUES (%s, %s)",
                            (test_email, hashed_password)
                        )
                        conn.commit()

                        # Yeni kullan�c� ID'sini al
                        cursor.execute("SELECT id FROM users WHERE email = %s", (test_email,))
                        new_user = cursor.fetchone()

                        if new_user:
                            print(f"New test user created with ID: {new_user[0]}")
                            return {
                                "message": "Test Google registration successful",
                                "user_id": new_user[0],
                                "is_new_user": True
                            }
                        else:
                            raise Exception("Failed to get new user ID")
                    except Exception as e:
                        print(f"Error creating test user: {str(e)}")
                        conn.rollback()
                        raise

        # REAL AUTHENTICATION - For actual JWT tokens
        # Check if token looks like a JWT format (header.payload.signature)
        token_parts = token.split('.')
        if len(token_parts) != 3:
            raise ValueError(f"Wrong number of segments in token: {token[:15]}...")

        try:
            # Verify the token with Google
            client_id = GOOGLE_CLIENT_IDS.get(platform)
            if not client_id:
                print(f"Invalid platform: {platform}")
                raise ValueError(f"Invalid platform: {platform}")

            # Token'� Google ile do�rula
            print(f"Verifying token with Google using client_id: {client_id}")
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id
            )

            # Email'i token bilgisinden ��kar
            email = idinfo.get('email')
            if not email:
                print("Email not found in Google token")
                raise ValueError("Email not found in Google token")

            print(f"Successfully verified Google token for email: {email}")

            # Kullan�c�n�n var olup olmad���n� kontrol et
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                user = cursor.fetchone()

                if user:
                    # Kullan�c� varsa, giri� bilgisini d�nd�r
                    print(f"Existing user found with ID: {user[0]}")
                    return {
                        "message": "Google login successful",
                        "user_id": user[0],
                        "is_new_user": False
                    }
                else:
                    # Yeni kullan�c� olu�tur
                    print(f"Creating new user with email: {email}")
                    import secrets
                    import string

                    # Rastgele �ifre olu�tur
                    alphabet = string.ascii_letters + string.digits
                    random_password = ''.join(secrets.choice(alphabet) for _ in range(16))
                    hashed_password = ph.hash(random_password)

                    # Yeni kullan�c�y� ekle
                    cursor.execute(
                        "INSERT INTO users (email, password) VALUES (%s, %s)",
                        (email, hashed_password)
                    )
                    conn.commit()

                    # Yeni kullan�c� ID'sini al
                    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                    new_user = cursor.fetchone()

                    print(f"New user created with ID: {new_user[0]}")
                    return {
                        "message": "Google registration successful",
                        "user_id": new_user[0],
                        "is_new_user": True
                    }
        except Exception as e:
            print(f"Error in Google token verification: {str(e)}")
            raise

    except Exception as e:
        print(f"Google authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Google authentication failed: {str(e)}")


def submit_rating(data: RatingData):
    """Insert or update a user's rating for a supplier"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check if user has already rated this supplier
            cursor.execute(
                "SELECT id FROM ratings WHERE user_id = %s AND supplier_id = %s",
                (data.user_id, data.supplier_id)
            )
            existing = cursor.fetchone()

            if existing:
                # Update existing rating
                cursor.execute(
                    "UPDATE ratings SET rating = %s, rated_at = %s WHERE user_id = %s AND supplier_id = %s",
                    (data.rating, data.rated_at, data.user_id, data.supplier_id)
                )
            else:
                # Insert new rating
                cursor.execute(
                    "INSERT INTO ratings (user_id, supplier_id, rating, rated_at) VALUES (%s, %s, %s, %s)",
                    (data.user_id, data.supplier_id, data.rating, data.rated_at)
                )

            conn.commit()

        return {"message": "Rating submitted successfully", "success": True}
    except Exception as e:
        print(f"Rating submission error: {str(e)}")
        return {"message": "Rating submission failed", "error": str(e), "success": False}


def get_user_rating(user_id: int, supplier_id: str):
    """Fetch user's rating for a supplier"""
    print(f"Getting user rating for user_id={user_id}, supplier_id={supplier_id}")
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT rating FROM ratings WHERE user_id = %s AND supplier_id = %s",
                (user_id, supplier_id)
            )
            result = cursor.fetchone()

        if result:
            return {"rating": result[0]}
        else:
            raise HTTPException(status_code=404, detail="No rating found")
    except Exception as e:
        print(f"[ERROR] get_user_rating failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


def calculate_bulk_average_ratings(supplier_ids: List[str]):
    try:
        if not supplier_ids:
            print("🚫 [RANKING-BACKEND] supplier_ids listesi boş.")
            return []

        print(f"📥 [RANKING-BACKEND] Gelen supplier_ids: {supplier_ids}")

        with get_db_connection() as conn:
            cursor = conn.cursor()

            format_strings = ','.join(['%s'] * len(supplier_ids))

            query = f"""
                SELECT supplier_id, AVG(rating) as average_rating, COUNT(*) as total_ratings
                FROM ratings
                WHERE TRIM(supplier_id) IN ({format_strings})
                GROUP BY supplier_id
                ORDER BY average_rating DESC
            """
            print(f"🧠 [RANKING-BACKEND] SQL Sorgusu: {query}")
            cursor.execute(query, supplier_ids)
            results = cursor.fetchall()

        print("📊 [RANKING-BACKEND] Sorgu sonuçları:")
        for row in results:
            print(f" - {row[0]}: avg={row[1]}, count={row[2]}")

        return [
            {
                "supplier_id": row[0].strip() if isinstance(row[0], str) else row[0],
                "average_rating": float(row[1]),
                "count": row[2]
            }
            for row in results
        ]
    except Exception as e:
        print(f"❌ [RANKING-BACKEND] Hata: {str(e)}")
        raise HTTPException(status_code=500, detail="Rating calculation failed")


@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    connection = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        yield connection
    except Error as e:
        print(f"Database connection error: {str(e)}")
        if connection:
            connection.rollback()
        raise
    finally:
        if connection and connection.is_connected():
            connection.close()


def init_db():
    """Initialize the database by creating required tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        ''')

        conn.commit()


def register_user(data: UserData):
    """Register a new user"""
    try:
        hashed_password = ph.hash(data.password)  # Argon2 automatically salts each password

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (email, password) VALUES (%s, %s)",
                (data.email, hashed_password)
            )
            conn.commit()

        return {"message": "User registered successfully"}
    except Error as e:
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="User already exists")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def login_user(data: UserData):
    """Authenticate a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password FROM users WHERE email = %s", (data.email,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id, hashed_password = row

    try:
        ph.verify(hashed_password, data.password)
        return {
            "message": "Login successful",
            "user_id": user_id
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")


def get_all_users():
    """Get all registered users"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email FROM users")
        users = cursor.fetchall()

    return [{"id": user[0], "email": user[1]} for user in users]


def init_fav_table():
    """Initialize favorites tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # User favorites table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                supplier_id VARCHAR(255) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, supplier_id)
            )
        ''')

        # General favorites table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS general_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                supplier_id VARCHAR(255) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, supplier_id)
            )
        ''')

        conn.commit()


def toggle_favorite(user_id: int, supplier_id: str, favorited_at: str, screen_opened_at: str, is_valid_favorite: bool):
    """Toggle favorite status for a supplier"""
    try:
        print(f"TOGGLING FAVORITE: user_id={user_id}, supplier_id={supplier_id}, is_valid_favorite={is_valid_favorite}")

        # Ensure supplier_id is always treated as a string
        supplier_id_str = str(supplier_id)

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Check if user already favorited this supplier
            cursor.execute(
                "SELECT id FROM user_favorites WHERE user_id = %s AND supplier_id = %s",
                (user_id, supplier_id_str)
            )
            existing = cursor.fetchone()

            print(f"Existing favorite check result: {existing}")

            if existing:
                # Remove from both tables
                cursor.execute(
                    "DELETE FROM user_favorites WHERE user_id = %s AND supplier_id = %s",
                    (user_id, supplier_id_str)
                )
                cursor.execute(
                    "DELETE FROM general_favorites WHERE user_id = %s AND supplier_id = %s",
                    (user_id, supplier_id_str)
                )

                conn.commit()
                message = "Favorite removed"
                print(f"Deleted favorite for user_id={user_id}, supplier_id={supplier_id_str}")
            else:
                # Add to tables
                cursor.execute(
                    "INSERT INTO user_favorites (user_id, supplier_id) VALUES (%s, %s)",
                    (user_id, supplier_id_str)
                )

                if is_valid_favorite:
                    cursor.execute(
                        "INSERT INTO general_favorites (user_id, supplier_id) VALUES (%s, %s)",
                        (user_id, supplier_id_str)
                    )

                conn.commit()
                message = "Favorite added"
                print(
                    f"Added favorite for user_id={user_id}, supplier_id={supplier_id_str}, is_valid={is_valid_favorite}")

        return {"message": message, "success": True}
    except Exception as e:
        print(f"Database error in toggle_favorite: {str(e)}")
        return {"message": "Error occurred", "error": str(e), "success": False}


# Correct
def get_user_favorites(user_id: int):
    """Get favorites for a specific user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        print(f"[DEBUG] user_id: {user_id}")  # Kullanıcı ID log
        cursor.execute(
            "SELECT supplier_id FROM user_favorites WHERE user_id = %s",
            (user_id,)
        )
        favorites = cursor.fetchall()
        print(f"[DEBUG] Fetched favorites: {favorites}")  # Gelen veriyi yazdır

    return [favorite[0] for favorite in favorites]


def check_is_favorite(user_id: int, supplier_id: str):
    """Check if a supplier is favorited by a user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM user_favorites WHERE user_id = %s AND supplier_id = %s",
            (user_id, supplier_id)
        )
        is_favorite = cursor.fetchone() is not None

    return {"is_favorite": is_favorite}


def init_complaint_table():
    """Initialize complaints table"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS complaints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                supplier_id VARCHAR(255),
                complaint_text TEXT NOT NULL,
                created_at VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        conn.commit()


def submit_complaint(user_id: int, complaint_text: str, supplier_id: str = None):
    """Submit a new complaint"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Get current date and time
            created_at = datetime.now().isoformat()

            if supplier_id:
                # Supplier-specific complaint
                cursor.execute(
                    "INSERT INTO complaints (user_id, supplier_id, complaint_text, created_at) VALUES (%s, %s, %s, %s)",
                    (user_id, supplier_id, complaint_text, created_at)
                )
            else:
                # General complaint
                cursor.execute(
                    "INSERT INTO complaints (user_id, complaint_text, created_at) VALUES (%s, %s, %s)",
                    (user_id, complaint_text, created_at)
                )

            conn.commit()

        return {"message": "Complaint submitted successfully", "success": True}
    except Exception as e:
        print(f"Complaint submission error: {str(e)}")
        return {"message": f"Failed to submit complaint: {str(e)}", "success": False}


def get_user_complaints(user_id: int):
    """Get complaints for a specific user"""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT c.id, c.complaint_text, c.supplier_id, c.created_at, c.status
            FROM complaints c
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
        """, (user_id,))

        complaints = cursor.fetchall()

    return [
        {
            "id": complaint[0],
            "text": complaint[1],
            "supplier_id": complaint[2],
            "created_at": complaint[3],
            "status": complaint[4]
        }
        for complaint in complaints
    ]


def get_popular_suppliers():
    """Get list of popular suppliers based on favorite count"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Get count of each supplier_id in general favorites
            cursor.execute("""
                SELECT supplier_id, COUNT(*) as favorite_count
                FROM general_favorites
                GROUP BY supplier_id
                ORDER BY favorite_count DESC
            """)

            popular_suppliers = cursor.fetchall()

            # Debug logs
            print("--- POPULAR SUPPLIERS ---")
            for row in popular_suppliers:
                print(f"Supplier ID: {row[0]}  |  Count: {row[1]}")

        # Return supplier_id and count objects
        return [{"supplier_id": row[0], "count": row[1]} for row in popular_suppliers]
    except Exception as e:
        print(f"Popular suppliers error: {str(e)}")
        return []


def update_profile(old_email: str, old_password: str, new_email: str = None, new_password: str = None):
    """Update user's email and/or password"""
    try:
        # �nce kullan�c�n�n kimli�ini do�rula
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, password FROM users WHERE email = %s", (old_email,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="User not found")

            user_id, hashed_password = row

            # Eski �ifreyi do�rula
            try:
                ph.verify(hashed_password, old_password)
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid password")

            # G�ncelleme i�lemleri i�in de�i�kenleri haz�rla
            update_fields = []
            params = []

            # Email g�ncellemesi
            if new_email and new_email != old_email:
                # Yeni email'in kullan�mda olup olmad���n� kontrol et
                cursor.execute("SELECT id FROM users WHERE email = %s", (new_email,))
                if cursor.fetchone():
                    raise HTTPException(status_code=409, detail="Email already in use")

                update_fields.append("email = %s")
                params.append(new_email)

            # �ifre g�ncellemesi
            if new_password:
                new_hashed_password = ph.hash(new_password)
                update_fields.append("password = %s")
                params.append(new_hashed_password)

            # Hi�bir g�ncelleme yoksa hata d�nd�r
            if not update_fields:
                raise HTTPException(status_code=400, detail="No update specified")

            # G�ncelleme sorgusunu olu�tur
            update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
            params.append(user_id)

            # G�ncelleme sorgusunu �al��t�r
            cursor.execute(update_query, params)
            conn.commit()

            # G�ncellenen kullan�c� bilgilerini d�nd�r
            cursor.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
            updated_user = cursor.fetchone()

            return {
                "message": "Profile updated successfully",
                "user_id": updated_user[0],
                "email": updated_user[1]
            }

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")


def get_supplier_details(supplier_id: str):
    """Get details for a specific supplier"""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Assuming you have a suppliers table
            cursor.execute("SELECT id, name, category FROM suppliers WHERE id = %s", (supplier_id,))
            row = cursor.fetchone()

        if row:
            return {"id": row[0], "name": row[1], "category": row[2]}
        else:
            return {"supplier_id": supplier_id, "name": "Bilinmiyor", "category": None}

    except Exception as e:
        print(f"Supplier detail error: {str(e)}")
        return {"supplier_id": supplier_id, "name": "Hata", "category": None}


# Initialize suppliers table for get_supplier_details function
def init_supplier_table():
    """Initialize suppliers table"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS suppliers (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255)
            )
        ''')
        conn.commit()


# Call this function to initialize all tables
def initialize_all_tables():
    """Initialize all database tables"""
    init_db()  # Users table
    init_fav_table()  # Favorites tables
    init_complaint_table()  # Complaints table  
    init_supplier_table()  # Suppliers table
    init_rank_table()  # Ratings table


def init_rank_table():
    """Initialize ratings table"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                supplier_id VARCHAR(255) NOT NULL,
                rating INT NOT NULL,
                rated_at VARCHAR(255) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, supplier_id)
            )
        ''')
        conn.commit()


