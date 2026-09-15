from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from .models import Base
from .mongodb import is_mongo_available, get_mongo_db

engine = create_engine("sqlite:///./hr_dashboard.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    if is_mongo_available():
        yield get_mongo_db()
    else:
        db = SessionLocal()
        try: yield db
        finally: db.close()

def init_db():
    inspector = inspect(engine)
    if "employees" in inspector.get_table_names() and "full_name" not in {c["name"] for c in inspector.get_columns("employees")}:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

