import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine,text
from sqlalchemy.orm import sessionmaker

# DATABASE_URL = f"postgresql://{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', 'youaremysavior')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'hotelynk')}"
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def test_db_connection():
    """
    Simple function to test if DB connection is working.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            value = result.scalar()

            if value == 1:
                print("Database connection successful!")
                return True
            else:
                print("Unexpected DB response")
                return False

    except Exception as e:
        print("Database connection failed:")
        print(str(e))
        return False

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()