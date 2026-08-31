"""initial_schema_users_products_sales_history_forecasts

Revision ID: 0001
Revises:
Create Date: 2026-08-31

"""
from typing import Sequence, Union
from uuid import uuid4

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable uuid-ossp extension for uuid_generate_v4() support
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            default=uuid4,
            nullable=False,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="viewer"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ------------------------------------------------------------------
    # products
    # ------------------------------------------------------------------
    op.create_table(
        "products",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            default=uuid4,
            nullable=False,
        ),
        sa.Column("sku", sa.String(100), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("sku", name="uq_products_sku"),
    )
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)
    op.create_index("ix_products_category", "products", ["category"])

    # ------------------------------------------------------------------
    # sales_history
    # ------------------------------------------------------------------
    op.create_table(
        "sales_history",
        sa.Column(
            "id",
            sa.BigInteger(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("units_sold", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("revenue", sa.Numeric(10, 2), nullable=False),
        sa.UniqueConstraint(
            "product_id", "date", name="uq_sales_history_product_date"
        ),
    )
    # CRITICAL composite index per spec — dashboard queries heavily filter by (product_id, date)
    op.create_index(
        "ix_sales_history_product_id_date", "sales_history", ["product_id", "date"]
    )

    # ------------------------------------------------------------------
    # forecasts
    # ------------------------------------------------------------------
    op.create_table(
        "forecasts",
        sa.Column(
            "id",
            sa.BigInteger(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("forecast_date", sa.Date(), nullable=False),
        sa.Column("predicted_units", sa.Float(), nullable=False),
        sa.Column("lower_bound", sa.Float(), nullable=True),   # 95% CI floor
        sa.Column("upper_bound", sa.Float(), nullable=True),   # 95% CI ceiling
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.UniqueConstraint(
            "product_id", "forecast_date", name="uq_forecasts_product_date"
        ),
    )
    op.create_index(
        "ix_forecasts_product_id_forecast_date",
        "forecasts",
        ["product_id", "forecast_date"],
    )


def downgrade() -> None:
    op.drop_table("forecasts")
    op.drop_table("sales_history")
    op.drop_table("products")
    op.drop_table("users")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
