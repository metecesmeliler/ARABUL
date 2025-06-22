import sqlite3
import os

# Veritabani yolu
db_path = os.path.join("chroma_database", "chroma.sqlite3")

# Veritabanina baglan
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Tablolari listele
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Veritabanindaki Tablolar:")
for table in tables:
    table_name = table[0]
    print(f"\n--- {table_name} tablosundaki veriler ---")

    # Her tablodaki verileri al
    cursor.execute(f"SELECT * FROM {table_name};")
    rows = cursor.fetchall()

    # Sutun basliklarini al
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = [col[1] for col in cursor.fetchall()]
    print(" | ".join(columns))

    # Satirlari yazdir
    for row in rows:
        print(" | ".join(str(cell) for cell in row))

# Baglantiyi kapat
conn.close()
