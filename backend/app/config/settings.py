from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "E-Commerce Order System"
    mongo_uri: str = "mongodb://localhost:27018/?directConnection=true"
    mongo_db_name: str = "ecommerce"
    debug: bool = False
    secret_key: str = "super-secret-jwt-key-for-shopflow-3tier-system"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
if (
    "localhost" in settings.mongo_uri or "127.0.0.1" in settings.mongo_uri
) and "directConnection=" not in settings.mongo_uri:
    sep = "&" if "?" in settings.mongo_uri else "?"
    settings.mongo_uri += f"{sep}directConnection=true"
