from datetime import datetime
from typing import Annotated
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# ---------------------------------------------------------------------------
# Reusable Annotated column types (SQLAlchemy 2.0 pattern)
# These are used as type hints, NOT as default values on Mapped columns.
# Usage:  id: Mapped[uuid_pk]  (NOT  id: Mapped[UUID] = uuid_pk)
# ---------------------------------------------------------------------------

uuid_pk = Annotated[
    UUID,
    mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    ),
]

created_at_col = Annotated[
    datetime,
    mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    ),
]

updated_at_col = Annotated[
    datetime,
    mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    ),
]


class Base(DeclarativeBase):
    type_annotation_map = {
        # Register UUID → PG_UUID so mapped_column infers it automatically
        UUID: PG_UUID(as_uuid=True),
    }