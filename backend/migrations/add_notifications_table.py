"""
Migration script to add notifications table to the database.
Run this script after deploying the new code.
"""

from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.exc import ProgrammingError
from datetime import datetime
import os
import sys

# Add the project root to path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback if we can't import from the app
    from dotenv import load_dotenv
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create the database engine
engine = create_engine(DATABASE_URL)
metadata = MetaData()

def run_migration():
    """
    Run the migration to add the notifications table.
    """
    print("Starting migration to add notifications table")
    
    connection = engine.connect()
    transaction = connection.begin()
    
    try:
        # Check if the table already exists
        inspector = engine.dialect.inspector
        existing_tables = inspector(connection).get_table_names()
        
        if "notifications" in existing_tables:
            print("Notifications table already exists, migration skipped")
            transaction.rollback()
            connection.close()
            return
            
        # Create the notifications table
        notifications = Table(
            "notifications",
            metadata,
            Column("id", Integer, primary_key=True, index=True),
            Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            Column("type", String(50), nullable=False),
            Column("title", String(255), nullable=False),
            Column("message", Text, nullable=False),
            Column("read", Boolean, default=False),
            Column("project_id", Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
            Column("created_at", DateTime, default=datetime.now),
            Column("read_at", DateTime, nullable=True)
        )
        
        # Actually create the table
        notifications.create(connection)
        
        # Add a relationship on the User model (or leave this to the ORM)
        # This is optional since we've already updated the model in the code
        
        transaction.commit()
        print("Successfully added notifications table to the database")
    
    except Exception as e:
        transaction.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        connection.close()

if __name__ == "__main__":
    run_migration() 