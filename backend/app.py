from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv
import os
import bcrypt
import cloudinary
import cloudinary.uploader

# ---------- LOAD ENV VARIABLES ----------
load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------- CLOUDINARY CONFIG ----------
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

ALLOWED_EXTENSIONS = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
    "png":  "image/png",
}

def allowed_file(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ALLOWED_EXTENSIONS

# ---------- DB CONFIG ----------
dbconfig = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", ""),
    "database": os.getenv("DB_NAME", "college_resources"),
}

POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 5))

cnxpool = mysql.connector.pooling.MySQLConnectionPool(
    pool_name="college_pool",
    pool_size=POOL_SIZE,
    **dbconfig
)

def get_db_connection():
    return cnxpool.get_connection()


# ---------- ROUTES ----------
@app.route("/")
def home():
    return jsonify({"status": "Backend + DB connected 💾"})


@app.route("/years")
def get_years():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM years")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/semesters")
def get_semesters():
    year_id = request.args.get("year_id")
    if not year_id:
        return jsonify({"error": "year_id required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM semesters WHERE year_id = %s", (year_id,))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/subjects")
def get_subjects():
    department_id = request.args.get("department_id")
    semester_id   = request.args.get("semester_id")
    if not department_id or not semester_id:
        return jsonify({"error": "department_id & semester_id required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, subject_name
        FROM subjects
        WHERE department_id = %s AND semester_id = %s
    """, (department_id, semester_id))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/subjects/all")
def get_all_subjects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, subject_name FROM subjects")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/resources")
def get_resources():
    subject_id = request.args.get("subject_id")
    if not subject_id:
        return jsonify({"error": "subject_id required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT title, resource_url, resource_type AS folder
        FROM resources
        WHERE subject_id = %s
    """, (subject_id,))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/resources/by-subject")
def get_resources_by_subject_and_type():
    subject_id    = request.args.get("subject_id")
    resource_type = request.args.get("resource_type")
    if not subject_id or not resource_type:
        return jsonify({"error": "subject_id and resource_type required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT title, resource_url
        FROM resources
        WHERE subject_id = %s AND resource_type = %s
    """, (subject_id, resource_type))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ---------- TEACHER LOGIN (bcrypt) ----------
@app.route("/teacher/login", methods=["POST"])
def teacher_login():
    try:
        data     = request.json
        email    = data.get("email")
        password = data.get("password")
        if not email or not password:
            return jsonify({"error": "Email & password required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, password FROM teachers WHERE email=%s", (email,))
        teacher = cursor.fetchone()
        cursor.close()
        conn.close()

        if not teacher:
            return jsonify({"error": "Teacher not found"}), 401

        stored_pw = teacher["password"]

        # Support both bcrypt hashes (new) and plain text (legacy accounts)
        # Once a legacy teacher logs in, their password is auto-upgraded to bcrypt
        is_bcrypt = stored_pw.startswith("$2b$") or stored_pw.startswith("$2a$")

        if is_bcrypt:
            # Normal bcrypt check
            if not bcrypt.checkpw(password.encode(), stored_pw.encode()):
                return jsonify({"error": "Invalid password"}), 401
        else:
            # Legacy plain text check
            if stored_pw != password:
                return jsonify({"error": "Invalid password"}), 401
            # Auto-upgrade plain text password to bcrypt hash
            new_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            conn2 = get_db_connection()
            cur2  = conn2.cursor()
            cur2.execute("UPDATE teachers SET password = %s WHERE id = %s", (new_hash, teacher["id"]))
            conn2.commit()
            cur2.close()
            conn2.close()

        return jsonify({
            "message":    "Login successful",
            "teacher_id": teacher["id"],
            "name":       teacher["name"]
        })
    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ---------- URL UPLOAD ----------
@app.route("/teacher/upload", methods=["POST"])
def upload_resource():
    data = request.json
    required = ["title", "resource_url", "resource_type", "subject_id", "teacher_id"]
    for r in required:
        if r not in data:
            return jsonify({"error": f"{r} missing"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO resources
        (title, resource_url, resource_type, subject_id, uploaded_by)
        VALUES (%s, %s, %s, %s, %s)
    """, (data["title"], data["resource_url"], data["resource_type"],
          data["subject_id"], data["teacher_id"]))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Resource uploaded successfully"})


# ---------- FILE UPLOAD (Cloudinary) ----------
@app.route("/teacher/upload-file", methods=["POST"])
def upload_file():
    try:
        required_fields = ["title", "resource_type", "subject_id", "teacher_id"]
        for field in required_fields:
            if not request.form.get(field):
                return jsonify({"error": f"{field} missing"}), 400

        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed. Allowed: PDF, DOCX, PPTX, JPG, PNG"}), 400

        ext = file.filename.rsplit(".", 1)[-1].lower()
        resource_type_cl = "image" if ext in ("jpg", "jpeg", "png") else "raw"

        result = cloudinary.uploader.upload(
            file,
            resource_type=resource_type_cl,
            folder="college_resources",
            use_filename=True,
            unique_filename=True,
        )

        file_url = result.get("secure_url")
        if not file_url:
            return jsonify({"error": "Cloudinary upload failed"}), 500

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO resources
            (title, resource_url, resource_type, subject_id, uploaded_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            request.form["title"],
            file_url,
            request.form["resource_type"],
            request.form["subject_id"],
            request.form["teacher_id"]
        ))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "File uploaded successfully", "url": file_url})

    except Exception as e:
        print("FILE UPLOAD ERROR:", e)
        return jsonify({"error": "Server error during upload"}), 500


@app.route("/api/quicklinks")
def get_quick_links():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.category, c.color, q.name, q.url
        FROM quicklink_categories c
        JOIN quicklinks q ON c.id = q.category_id
        ORDER BY c.id
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    grouped = {}
    for row in rows:
        cat = row["category"]
        if cat not in grouped:
            grouped[cat] = {"category": cat, "color": row["color"], "links": []}
        grouped[cat]["links"].append({"name": row["name"], "url": row["url"]})
    return jsonify(list(grouped.values()))


@app.route("/debug/teachers")
def debug_teachers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM teachers")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


@app.route("/departments")
def get_departments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name FROM departments")
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ---------- GET TEACHER'S OWN RESOURCES ----------
@app.route("/teacher/my-resources")
def get_my_resources():
    teacher_id = request.args.get("teacher_id")
    if not teacher_id:
        return jsonify({"error": "teacher_id required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.id, r.title, r.resource_url, r.resource_type,
               s.subject_name, d.name AS department_name
        FROM resources r
        JOIN subjects s ON r.subject_id = s.id
        JOIN departments d ON s.department_id = d.id
        WHERE r.uploaded_by = %s
        ORDER BY r.id DESC
    """, (teacher_id,))
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ---------- DELETE RESOURCE (own only) ----------
@app.route("/teacher/resource/<int:resource_id>", methods=["DELETE"])
def delete_resource(resource_id):
    teacher_id = request.args.get("teacher_id")
    if not teacher_id:
        return jsonify({"error": "teacher_id required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, resource_url FROM resources WHERE id = %s AND uploaded_by = %s",
        (resource_id, teacher_id)
    )
    resource = cursor.fetchone()

    if not resource:
        cursor.close()
        conn.close()
        return jsonify({"error": "Resource not found or not yours"}), 404

    url = resource["resource_url"]
    if "cloudinary.com" in url:
        try:
            parts = url.split("/upload/")
            if len(parts) == 2:
                public_id_with_version = parts[1]
                segments = public_id_with_version.split("/")
                if segments[0].startswith("v") and segments[0][1:].isdigit():
                    segments = segments[1:]
                public_id = "/".join(segments).rsplit(".", 1)[0]
                ext = url.rsplit(".", 1)[-1].lower()
                cl_resource_type = "image" if ext in ("jpg", "jpeg", "png") else "raw"
                cloudinary.uploader.destroy(public_id, resource_type=cl_resource_type)
        except Exception as e:
            print("Cloudinary delete warning:", e)

    cursor.execute("DELETE FROM resources WHERE id = %s AND uploaded_by = %s",
                   (resource_id, teacher_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Resource deleted successfully"})


@app.route("/test-cloudinary")
def test_cloudinary():
    try:
        import cloudinary.api
        result = cloudinary.api.ping()
        return jsonify({"status": "ok", "result": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# ---------- STUDENT SUBMIT RESOURCE ----------
@app.route("/student/submit", methods=["POST"])
def student_submit():
    try:
        data = request.json
        required = ["title", "resource_url", "resource_type", "subject_id", "submitted_by"]
        for r in required:
            if r not in data:
                return jsonify({"error": f"{r} missing"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO pending_resources
            (title, resource_url, resource_type, subject_id, submitted_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (data["title"], data["resource_url"], data["resource_type"],
              data["subject_id"], data["submitted_by"]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Submitted for approval!"})
    except Exception as e:
        print("STUDENT SUBMIT ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ---------- STUDENT FILE SUBMIT (Cloudinary) ----------
@app.route("/student/submit-file", methods=["POST"])
def student_submit_file():
    try:
        required_fields = ["title", "resource_type", "subject_id", "submitted_by"]
        for field in required_fields:
            if not request.form.get(field):
                return jsonify({"error": f"{field} missing"}), 400

        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file"}), 400

        ext = file.filename.rsplit(".", 1)[-1].lower()
        resource_type_cl = "image" if ext in ("jpg", "jpeg", "png") else "raw"

        result = cloudinary.uploader.upload(
            file,
            resource_type=resource_type_cl,
            folder="college_resources/pending",
            use_filename=True,
            unique_filename=True,
        )
        file_url = result.get("secure_url")
        if not file_url:
            return jsonify({"error": "Cloudinary upload failed"}), 500

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO pending_resources
            (title, resource_url, resource_type, subject_id, submitted_by)
            VALUES (%s, %s, %s, %s, %s)
        """, (request.form["title"], file_url, request.form["resource_type"],
              request.form["subject_id"], request.form["submitted_by"]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "File submitted for approval!", "url": file_url})
    except Exception as e:
        print("STUDENT FILE SUBMIT ERROR:", e)
        return jsonify({"error": "Server error during upload"}), 500


# ---------- ADMIN LOGIN ----------
@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

    if data.get("email") == ADMIN_EMAIL and data.get("password") == ADMIN_PASSWORD:
        return jsonify({"message": "Login successful", "admin": True})
    return jsonify({"error": "Invalid credentials"}), 401


# ---------- GET ALL PENDING SUBMISSIONS ----------
@app.route("/admin/pending")
def get_pending():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.title, p.resource_url, p.resource_type,
               p.submitted_by, p.submitted_at, p.status,
               s.subject_name, d.name AS department_name
        FROM pending_resources p
        JOIN subjects    s ON p.subject_id    = s.id
        JOIN departments d ON s.department_id = d.id
        WHERE p.status = 'pending'
        ORDER BY p.submitted_at DESC
    """)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    for row in data:
        if row.get("submitted_at"):
            row["submitted_at"] = str(row["submitted_at"])
    return jsonify(data)


# ---------- APPROVE SUBMISSION ----------
@app.route("/admin/approve/<int:pending_id>", methods=["POST"])
def approve_submission(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM pending_resources WHERE id = %s", (pending_id,))
    item = cursor.fetchone()
    if not item:
        cursor.close()
        conn.close()
        return jsonify({"error": "Not found"}), 404

    cursor.execute("""
        INSERT INTO resources
        (title, resource_url, resource_type, subject_id, uploaded_by)
        VALUES (%s, %s, %s, %s, %s)
    """, (item["title"], item["resource_url"], item["resource_type"],
          item["subject_id"], 1))

    cursor.execute(
        "UPDATE pending_resources SET status = 'approved' WHERE id = %s",
        (pending_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Approved and published!"})


# ---------- REJECT SUBMISSION ----------
@app.route("/admin/reject/<int:pending_id>", methods=["POST"])
def reject_submission(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE pending_resources SET status = 'rejected' WHERE id = %s",
        (pending_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Submission rejected."})


# ---------- GET ALL TEACHERS (admin) ----------
@app.route("/admin/teachers")
def get_all_teachers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.id, t.name, t.email, d.name AS department_name
        FROM teachers t
        LEFT JOIN departments d ON t.department_id = d.id
        ORDER BY t.id DESC
    """)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ---------- ADD TEACHER (admin) — password hashed with bcrypt ----------
@app.route("/admin/teacher", methods=["POST"])
def add_teacher():
    data = request.json
    required = ["name", "email", "password"]
    for r in required:
        if r not in data:
            return jsonify({"error": f"{r} missing"}), 400
    try:
        # Hash the password before storing
        hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO teachers (name, email, password, department_id)
            VALUES (%s, %s, %s, %s)
        """, (data["name"], data["email"], hashed,
              data.get("department_id") or None))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Teacher added successfully!"})
    except Exception as e:
        print("ADD TEACHER ERROR:", e)
        return jsonify({"error": "Email already exists or server error"}), 500


# ---------- DELETE TEACHER (admin) ----------
@app.route("/admin/teacher/<int:teacher_id>", methods=["DELETE"])
def delete_teacher(teacher_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM teachers WHERE id = %s", (teacher_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Teacher deleted."})


# ============================================================
# ADD THESE ROUTES TO app.py
# Paste just above "# ---------- RUN SERVER ----------"
# ============================================================


# ============================================================
# ADD THESE ROUTES TO app.py
# Paste just above "# ---------- RUN SERVER ----------"
# ============================================================


# ---------- GET ALL PLAYLISTS ----------
# ── REPLACE your existing /playlists route with this ──

@app.route("/playlists")
def get_playlists():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, title, url, added_by, role, clicks
        FROM playlists
        ORDER BY
            CASE WHEN role = 'teacher' THEN 0 ELSE 1 END ASC,  -- teachers first
            CASE WHEN role = 'teacher' THEN added_at END DESC,  -- teachers: newest first
            CASE WHEN role = 'student' THEN clicks END DESC     -- students: most clicked first
    """)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(data)


# ── ADD this new route (paste it right after the /playlists route) ──

@app.route("/playlists/<int:playlist_id>/click", methods=["POST"])
def track_playlist_click(playlist_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE playlists SET clicks = clicks + 1 WHERE id = %s",
            (playlist_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Click tracked"})
    except Exception as e:
        print("CLICK TRACK ERROR:", e)
        return jsonify({"error": "Server error"}), 500

# ---------- TEACHER ADD PLAYLIST (direct, no approval) ----------
@app.route("/teacher/playlist", methods=["POST"])
def teacher_add_playlist():
    try:
        data = request.json
        required = ["title", "url", "teacher_name"]
        for r in required:
            if r not in data:
                return jsonify({"error": f"{r} missing"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO playlists (title, url, added_by, role)
            VALUES (%s, %s, %s, 'teacher')
        """, (data["title"], data["url"], data["teacher_name"]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Playlist added successfully!"})
    except Exception as e:
        print("TEACHER PLAYLIST ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ---------- STUDENT SUBMIT PLAYLIST (pending approval) ----------
@app.route("/student/playlist", methods=["POST"])
def student_submit_playlist():
    try:
        data = request.json
        required = ["title", "url", "submitted_by"]
        for r in required:
            if r not in data:
                return jsonify({"error": f"{r} missing"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO pending_playlists (title, url, submitted_by)
            VALUES (%s, %s, %s)
        """, (data["title"], data["url"], data["submitted_by"]))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Submitted for approval!"})
    except Exception as e:
        print("STUDENT PLAYLIST ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ---------- GET PENDING PLAYLISTS (admin) ----------
@app.route("/admin/pending-playlists")
def get_pending_playlists():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, title, url, submitted_by, submitted_at, status
        FROM pending_playlists
        WHERE status = 'pending'
        ORDER BY submitted_at DESC
    """)
    data = cursor.fetchall()
    cursor.close()
    conn.close()
    for row in data:
        if row.get("submitted_at"):
            row["submitted_at"] = str(row["submitted_at"])
    return jsonify(data)


# ---------- APPROVE PLAYLIST (admin) ----------
@app.route("/admin/approve-playlist/<int:pending_id>", methods=["POST"])
def approve_playlist(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM pending_playlists WHERE id = %s", (pending_id,))
    item = cursor.fetchone()
    if not item:
        cursor.close()
        conn.close()
        return jsonify({"error": "Not found"}), 404

    cursor.execute("""
        INSERT INTO playlists (title, url, added_by, role)
        VALUES (%s, %s, %s, 'student')
    """, (item["title"], item["url"], item["submitted_by"]))

    cursor.execute(
        "UPDATE pending_playlists SET status = 'approved' WHERE id = %s",
        (pending_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Playlist approved and published!"})


# ---------- REJECT PLAYLIST (admin) ----------
@app.route("/admin/reject-playlist/<int:pending_id>", methods=["POST"])
def reject_playlist(pending_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE pending_playlists SET status = 'rejected' WHERE id = %s",
        (pending_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Playlist rejected."})


# ---------- DELETE PLAYLIST (admin) ----------
@app.route("/admin/playlist/<int:playlist_id>", methods=["DELETE"])
def delete_playlist(playlist_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM playlists WHERE id = %s", (playlist_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Playlist deleted."})


# ---------- RUN SERVER ----------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)