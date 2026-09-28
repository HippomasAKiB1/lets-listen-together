import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

from sqlalchemy.engine import make_url

load_dotenv()

# Check DATABASE_URL (and DTABASE_URL fallback in case of env variable typo)
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DTABASE_URL", "")

connect_args = {}
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if DATABASE_URL:
    # Render provides connection strings starting with postgres://, but SQLAlchemy 1.4+
    # requires postgresql://. Also, for asyncpg we need postgresql+asyncpg://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    try:
        url = make_url(DATABASE_URL)
        if "asyncpg" in url.drivername or "postgresql" in url.drivername:
            # Required for transaction poolers like Neon's PgBouncer / Supabase pooler
            connect_args["statement_cache_size"] = 0
            connect_args["prepared_statement_cache_size"] = 0

            # asyncpg requires 'ssl' instead of libpq's 'sslmode'
            query = dict(url.query)
            if "sslmode" in query:
                query["ssl"] = query.pop("sslmode")
            if "connect_timeout" in query:
                query["timeout"] = query.pop("connect_timeout")

            # Neon and libpq connection strings can include channel_binding or other
            # options that asyncpg.connect does not accept as keyword arguments
            VALID_ASYNCPG_KEYS = {
                "host", "port", "user", "password", "passfile", "service", "servicefile",
                "database", "loop", "timeout", "statement_cache_size", "max_cached_statement_lifetime",
                "max_cacheable_statement_size", "command_timeout", "ssl", "direct_tls",
                "connection_class", "record_class", "server_settings", "target_session_attrs",
                "krbsrvname", "gsslib", "prepared_statement_cache_size", "prepared_statement_name_func",
                "async_fallback", "async_creator_fn"
            }
            clean_query = {k: v for k, v in query.items() if k in VALID_ASYNCPG_KEYS}
            url = url.set(query=clean_query)
            DATABASE_URL = url.render_as_string(hide_password=False)

            engine_kwargs["pool_size"] = 5
            engine_kwargs["max_overflow"] = 10
    except Exception:
        pass

if connect_args:
    engine_kwargs["connect_args"] = connect_args

engine = create_async_engine(DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Migrate server_timestamp to BIGINT if it is still an INTEGER (useful for Supabase)
        try:
            await conn.execute(text("ALTER TABLE current_song ALTER COLUMN server_timestamp TYPE BIGINT;"))
        except Exception:
            # Pass silently (e.g. SQLite doesn't support ALTER COLUMN type syntax)
            pass
