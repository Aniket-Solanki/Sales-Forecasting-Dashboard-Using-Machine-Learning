"""add_model_registry_table

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-31

"""
from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # ml_models (Model Registry Table)
    # ------------------------------------------------------------------
    op.create_table(
        "ml_models",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            default=uuid4,
            nullable=False,
        ),
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.Column("model_binary", sa.LargeBinary(), nullable=False),
        sa.Column("mape", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("model_version", name="uq_ml_models_version"),
    )
    op.create_index("ix_ml_models_version", "ml_models", ["model_version"], unique=True)


def downgrade() -> None:
    op.drop_table("ml_models")
