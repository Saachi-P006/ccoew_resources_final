import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Saachi@232568",
        database="college_resources"
    )
    print("✅ DB CONNECTED SUCCESSFULLY")
    conn.close()
except Exception as e:
    print("❌ DB CONNECTION FAILED:", e)
