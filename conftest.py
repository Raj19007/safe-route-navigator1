import sys
import os
import pytest

# Ensure backend package is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database.seed import seed_database_if_empty

@pytest.fixture(scope="session", autouse=True)
def init_test_database():
    seed_database_if_empty()
    yield
