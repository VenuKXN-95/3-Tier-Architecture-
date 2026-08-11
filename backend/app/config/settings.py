from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "E-Commerce Order System"
    mongo_uri: str = "mongodb://localhost:27017/?replicaSet=rs0"
    mongo_db_name: str = "ecommerce"
    debug: bool = False
    secret_key: str = "super-secret-jwt-key-for-shopflow-3tier-system"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
