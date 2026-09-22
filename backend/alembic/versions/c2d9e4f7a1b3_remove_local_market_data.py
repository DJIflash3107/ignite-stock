"""remove local market data

Revision ID: c2d9e4f7a1b3
Revises: a8f4c9e21d7b
Create Date: 2026-09-22 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2d9e4f7a1b3"
down_revision: Union[str, Sequence[str], None] = "a8f4c9e21d7b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Investigation targets now store source identifiers, not local-table UUIDs.
    op.add_column("investigations", sa.Column("company_ticker", sa.String(length=32), nullable=True))
    op.add_column("investigations", sa.Column("index_code", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_investigations_company_ticker"), "investigations", ["company_ticker"], unique=False)
    op.create_index(op.f("ix_investigations_index_code"), "investigations", ["index_code"], unique=False)
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    investigation_fks = inspector.get_foreign_keys("investigations")
    for foreign_key in investigation_fks:
        if set(foreign_key.get("constrained_columns", [])) & {"company_id", "index_id"}:
            op.drop_constraint(foreign_key["name"], "investigations", type_="foreignkey")
    op.drop_index(op.f("ix_investigations_company_id"), table_name="investigations")
    op.drop_index(op.f("ix_investigations_index_id"), table_name="investigations")
    op.drop_column("investigations", "company_id")
    op.drop_column("investigations", "index_id")

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    for table in ("price_snapshots", "market_snapshots", "news_articles", "filings", "financial_metrics", "index_constituents", "companies", "indices", "sectors"):
        if table in existing_tables:
            op.drop_table(table)

    # Local market-data tables are intentionally removed; remaining MVP tables stay intact.


def downgrade() -> None:
    raise NotImplementedError("Local market-data tables and UUID targets cannot be restored safely")
