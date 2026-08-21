import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Safe Route Navigator"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    # Default to local SQLite for zero-config local runs, or postgresql://user:pass@localhost:5432/saferoute in docker
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./safe_route.db")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-safe-route-key-2026-hackathon")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Risk Engine Configuration
    DECAY_LAMBDA: float = float(os.getenv("DECAY_LAMBDA", "0.08")) # ~8.6 days half-life
    REPORT_CLUSTER_RADIUS_METERS: float = float(os.getenv("REPORT_CLUSTER_RADIUS_METERS", "150.0"))
    MAX_RISK_PENALTY_GAMMA: float = float(os.getenv("MAX_RISK_PENALTY_GAMMA", "0.25"))
    
    # External APIs (Optional, with local fallback)
    OSRM_URL: Optional[str] = os.getenv("OSRM_URL", None)
    OPENROUTESERVICE_API_KEY: Optional[str] = os.getenv("OPENROUTESERVICE_API_KEY", None)
    WEATHER_API_KEY: Optional[str] = os.getenv("WEATHER_API_KEY", None)
    
    # Demo Mode
    DEMO_MODE_DEFAULT: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
