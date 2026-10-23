from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AccountCreate(BaseModel):
    holder_name: str = Field(min_length=1, max_length=120)

    @field_validator("holder_name")
    @classmethod
    def normalize_holder_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("holder_name must not be blank")
        return normalized


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    account_number: int
    holder_name: str
    currency: str
    balance_cents: int
    created_at: datetime
    card_last4: str | None = None
