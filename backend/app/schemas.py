from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
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


class DepositCreate(BaseModel):
    amount: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: str) -> str:
        try:
            amount = Decimal(value)
        except (InvalidOperation, ValueError):
            raise ValueError("amount must be a valid dollar amount")
        if not amount.is_finite() or amount <= 0 or amount > Decimal("10000.00"):
            raise ValueError("amount must be greater than 0 and no more than 10000.00")
        if amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) != amount:
            raise ValueError("amount must have at most two decimal places")
        return value


class DepositResponse(BaseModel):
    account: AccountResponse
    transaction_id: UUID
    amount_cents: int


class TransactionResponse(BaseModel):
    id: UUID
    account_id: UUID
    card_id: UUID | None
    kind: str
    amount_cents: int
    merchant: str | None
    category: str | None
    outcome: str
    decline_reason: str | None
    created_at: datetime


class CardResponse(BaseModel):
    id: UUID
    account_id: UUID
    card_last4: str
    issued_at: datetime
