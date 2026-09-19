"""create tables

Revision ID: 347d71577587
Revises: 74094dec8165
Create Date: 2026-09-19 20:35:24.703543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '347d71577587'
down_revision: Union[str, Sequence[str], None] = '74094dec8165'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
