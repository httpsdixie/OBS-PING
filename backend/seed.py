"""
Seed script — populates the database with the real Observer staff.
Run once: python seed.py
Safe to re-run: skips existing emails.
"""
import app.models  # noqa: ensure all models are registered
from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.models.user import User, UserRole, UserStatus
from app.core.security import hash_password
from app.constants.permissions import default_permissions_for_role

def parse_full_name(name: str):
    if not name:
        return "", "", "", ""
    parts = name.strip().split()
    if not parts:
        return "", "", "", ""
    
    suffixes = {"jr.", "jr", "sr.", "sr", "iii", "iv", "ii", "i"}
    extension = ""
    ext_index = -1
    for idx, part in enumerate(parts):
        clean_part = part.lower().strip(",.")
        if clean_part in suffixes:
            ext_index = idx
            break
    if ext_index != -1:
        extension = parts.pop(ext_index)
        
    if not parts:
        return "", "", "", extension
        
    if len(parts) == 1:
        return parts[0], "", "", extension
    elif len(parts) == 2:
        return parts[0], "", parts[1], extension
    else:
        last_name = parts[-1]
        first_name_parts = []
        middle_name_parts = []
        for i, p in enumerate(parts[:-1]):
            clean_p = p.replace('.', '')
            if (len(p) <= 2 and clean_p.isalpha()) and i > 0:
                middle_name_parts.append(p)
            elif middle_name_parts:
                middle_name_parts.append(p)
            else:
                first_name_parts.append(p)
        if not middle_name_parts and len(first_name_parts) > 1:
            middle_name_parts = [first_name_parts.pop()]
        first_name = " ".join(first_name_parts)
        middle_name = " ".join(middle_name_parts)
        return first_name, middle_name, last_name, extension

Base.metadata.create_all(bind=engine)

from sqlalchemy import text
from sqlalchemy import inspect
# Run migration check
inspector = inspect(engine)
if inspector.has_table("users"):
    columns = [col["name"] for col in inspector.get_columns("users")]
    if "first_name" not in columns:
        try:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN first_name VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN middle_name VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN last_name VARCHAR(50)"))
                conn.execute(text("ALTER TABLE users ADD COLUMN extension VARCHAR(10)"))
            
            # Backfill existing names
            db_session = SessionLocal()
            try:
                users_list = db_session.query(User).all()
                for u in users_list:
                    if u.name:
                        first, middle, last, ext = parse_full_name(u.name)
                        u.first_name = first
                        u.middle_name = middle
                        u.last_name = last
                        u.extension = ext
                db_session.commit()
            except Exception as be:
                print(f"Backfill error: {be}")
                db_session.rollback()
            finally:
                db_session.close()
        except Exception as e:
            print(f"Migration error: {e}")

db = SessionLocal()

# ---------------------------------------------------------------------------
# Staff data
# Format: (name, email_slug, role, position) or with custom email:
# (name, email_slug, role, position, "custom@evsu.edu.ph")
# Default password: observer2026  (change after first login)
# ---------------------------------------------------------------------------
STAFF = [
    # ── Editorial Board ─────────────────────────────────────────────────────
    ("Trisha Mae Ymas",             "eic",              UserRole.super_admin, "Editor-in-Chief"),
    ("Jessie Martin C. Morallos",   "assoc.editor",     UserRole.admin,       "Associate Editor", "jessiemartin.morallos@evsu.edu.ph"),
    ("Angela Faith M. Senillo",     "managing.editor",  UserRole.admin,       "Managing Editor"),
    ("Alvin John Marquez",          "circulation",      UserRole.admin,       "Circulation Manager", "alvinjohn.marquez@evsu.edu.ph"),
    ("Jonathan A. Labiste Jr.",     "creative.dir",     UserRole.admin,       "Creative Director"),
    ("Jhon Dhave T. Opsimar",       "multimedia.dir",   UserRole.admin,       "Multimedia Director", "jhondhave.opsimar@evsu.edu.ph"),

    # ── Section Editors ──────────────────────────────────────────────────────
    ("Rheina Mae K. Capucao",       "news.editor",      UserRole.admin,       "News Editor"),
    ("Liza Mae T. Boloy",           "literary.editor",  UserRole.admin,       "Literary Editor"),

    # ── Writers ──────────────────────────────────────────────────────────────
    ("Maria Ellanie Jane S. Bayona","writer.bayona",    UserRole.staff,       "Writer"),
    ("Marites Calixtro",            "writer.calixtro",  UserRole.staff,       "Writer"),
    ("Jerico Ombal",                "writer.ombal",     UserRole.staff,       "Writer"),
    ("Adelene I. Dela Cruz",        "writer.delacruz",  UserRole.staff,       "Writer"),
    ("Joseph Bryan P. Paculba",     "writer.paculba",   UserRole.staff,       "Writer", "josephbryan.paculba@evsu.edu.ph"),
    ("Mishelle T. Bohol",           "writer.bohol",     UserRole.staff,       "Writer", "mishelle.bohol@evsu.edu.ph"),
    ("Jaira Camelle Casane",        "writer.casane",    UserRole.staff,       "Writer", "jairacamelle.casane@evsu.edu.ph"),
    ("Maria Rhez C. Pajaron",       "writer.pajaron",   UserRole.staff,       "Writer", "mariarhez.pajaron@evsu.edu.ph"),

    # ── Photojournalists ─────────────────────────────────────────────────────
    ("Jhared Martin M. Tamse",      "photo.head",       UserRole.admin,       "Head Photojournalist"),
    ("Ivan Ray Pagalan",            "photo.pagalan",    UserRole.staff,       "Photojournalist"),
    ("Maeann Mahusay",              "photo.mahusay",    UserRole.staff,       "Photojournalist"),
    ("Trisha Mae Francisco",        "photo.francisco",  UserRole.staff,       "Photojournalist"),
    ("John Carlo Donayre",          "photo.donayre",    UserRole.staff,       "Photojournalist", "johncarlo.donayre@evsu.edu.ph"),
    ("Mitch Edial Avila",           "photo.avila",      UserRole.staff,       "Photojournalist"),
    ("Laika V. Lato",               "photo.lato",       UserRole.staff,       "Photojournalist", "laika.lato@evsu.edu.ph"),

    # ── Video Editors ────────────────────────────────────────────────────────
    ("Grace Ruelo",                 "video.head",       UserRole.admin,       "Head Video Editor"),
    ("Jake Cascara",                "video.cascara",    UserRole.staff,       "Video Editor"),
    ("Karen Diano",                 "video.diano",      UserRole.staff,       "Video Editor"),

    # ── Correspondents ───────────────────────────────────────────────────────
    ("Janna Payod",                 "corr.head",        UserRole.admin,       "Head Correspondent", "janna.payod@evsu.edu.ph"),
    ("Zhenlie Pongos",              "corr.pongos",      UserRole.staff,       "Correspondent"),
    ("Aura Lyneth Lumabas",         "corr.lumabas",     UserRole.staff,       "Correspondent"),
    ("Rose Repollo",                "corr.repollo",     UserRole.staff,       "Correspondent"),
    ("Jessica Castil",              "corr.castil",      UserRole.staff,       "Correspondent"),
    ("James Ruel Lopez",            "corr.lopez",       UserRole.staff,       "Correspondent"),
    ("Ma. Angeline Jumao-as",       "corr.jumaoas",     UserRole.staff,       "Correspondent"),
    ("Ricogie B. Malinao",          "corr.malinao",     UserRole.staff,       "Correspondent"),
    ("Ashbie Merino",               "corr.merino",      UserRole.staff,       "Correspondent", "ashbie.merino@evsu.edu.ph"),
    ("Manny Jan A. Surima",         "corr.surima",      UserRole.staff,       "Correspondent", "mannyjan.surima@evsu.edu.ph"),

    # ── Layout Artists ───────────────────────────────────────────────────────
    ("Dixie Shanne Perida",         "layout.head",      UserRole.admin,       "Head Layout Artist", "dixieshanne.perida@evsu.edu.ph"),
    ("Justin Bardiago",             "layout.bardiago",  UserRole.staff,       "Layout Artist", "justin.bardiago@evsu.edu.ph"),
    ("Trisha Mae Manawatao",        "layout.manawatao", UserRole.staff,       "Layout Artist"),
    ("Mildred Lacbayo",             "layout.lacbayo",   UserRole.staff,       "Layout Artist"),
    ("Jessa Joy M. Belencio",       "layout.belencio",  UserRole.staff,       "Layout Artist", "jessajoy.belencio@evsu.edu.ph"),

    # ── Illustrators ─────────────────────────────────────────────────────────
    ("April Grace Panta",           "illus.head",       UserRole.admin,       "Head Illustrator"),
    ("Jhoram Pobadora",             "illus.pobadora",   UserRole.staff,       "Illustrator"),
    ("Geraldyn Boholst",            "illus.boholst",    UserRole.staff,       "Illustrator"),
    ("Bryl Psalm Y. Laude",         "illus.laude",      UserRole.staff,       "Illustrator"),

    # ── Cartoonists ──────────────────────────────────────────────────────────
    ("Rj Q. Abayata",               "cartoon.head",     UserRole.admin,       "Head Cartoonist"),
    ("Randy Endolos",               "cartoon.endolos",  UserRole.staff,       "Cartoonist"),
    ("Cecile Salilin",              "cartoon.salilin",  UserRole.staff,       "Cartoonist"),
    ("Jhon Roe Omega",              "cartoon.omega",    UserRole.staff,       "Cartoonist"),
    ("Renelyn P. Marilao",          "cartoon.marilao",  UserRole.staff,       "Cartoonist"),

    # ── Editorial Consultant ─────────────────────────────────────────────────
    ("Alexander Jr. M. Morfe",      "consultant",       UserRole.consultant,  "Editorial Consultant"),
]

DEFAULT_PASSWORD = "observer2026"
DOMAIN           = "@observer.evsu.edu.ph"


created = 0
skipped = 0
updated = 0

for entry in STAFF:
    name, slug, role, position = entry[:4]
    email = entry[4] if len(entry) > 4 else f"{slug}{DOMAIN}"

    if db.query(User).filter(User.email == email).first():
        print(f"  skip  {email}")
        skipped += 1
        continue

    # Migrate existing row (e.g. observer slug → real EVSU email)
    by_name = db.query(User).filter(User.name == name).first()
    if by_name and by_name.email != email:
        old_email = by_name.email
        by_name.email = email
        print(f"  update {old_email} -> {email}  ({position})")
        updated += 1
        continue

    first, middle, last, ext = parse_full_name(name)

    new_user = User(
        name=name,
        first_name=first,
        middle_name=middle,
        last_name=last,
        extension=ext,
        email=email,
        hashed_password=hash_password(DEFAULT_PASSWORD),
        role=role,
        position=position,
        status=UserStatus.active,
    )
    new_user.permissions = default_permissions_for_role(role)
    db.add(new_user)
    print(f"  add   {email}  ({position})")
    created += 1

# Backfill empty permissions for existing accounts (safe to re-run)
perms_backfilled = 0
for user in db.query(User).filter(User.role != UserRole.super_admin).all():
    if not user.permissions:
        user.permissions = default_permissions_for_role(user.role)
        print(f"  perms {user.email}  ({user.role.value})")
        perms_backfilled += 1

db.commit()
db.close()

print()
print(f"Done. {created} created, {updated} updated, {skipped} skipped, {perms_backfilled} permissions backfilled.")
print(f"Default password: {DEFAULT_PASSWORD}")
print("Remind all members to change their password after first login.")
