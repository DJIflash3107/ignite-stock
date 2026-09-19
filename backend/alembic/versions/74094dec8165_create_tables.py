"""create tables

Revision ID: 74094dec8165
Revises: 655c82fe0f87
Create Date: 2026-09-19 20:28:53.749063

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74094dec8165'
down_revision: Union[str, Sequence[str], None] = '655c82fe0f87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
