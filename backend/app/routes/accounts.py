from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import accounts, cards
from ..schemas import AccountCreate, AccountResponse

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


def _account_query():
    return (
        select(
            accounts.c.id,
            accounts.c.account_number,
            accounts.c.holder_name,
            accounts.c.currency,
            accounts.c.balance_cents,
            accounts.c.created_at,
            cards.c.token.label("card_token"),
        )
        .select_from(accounts.outerjoin(cards, accounts.c.id == cards.c.account_id))
    )


def _to_response(row) -> AccountResponse:
    values = row._mapping
    token = values["card_token"]
    return AccountResponse(
        id=values["id"],
        account_number=values["account_number"],
        holder_name=values["holder_name"],
        currency=values["currency"],
        balance_cents=values["balance_cents"],
        created_at=values["created_at"],
        card_last4=token[-4:] if token else None,
    )


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)) -> AccountResponse:
    result = db.execute(
        accounts.insert()
        .values(holder_name=payload.holder_name, currency="USD", balance_cents=0)
        .returning(accounts.c)
    )
    db.commit()
    row = result.one()
    return AccountResponse(**row._mapping, card_last4=None)


@router.get("", response_model=list[AccountResponse])
def list_accounts(db: Session = Depends(get_db)) -> list[AccountResponse]:
    rows = db.execute(
        _account_query().order_by(accounts.c.created_at.desc(), accounts.c.id.desc())
    ).all()
    return [_to_response(row) for row in rows]


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: UUID, db: Session = Depends(get_db)) -> AccountResponse:
    row = db.execute(_account_query().where(accounts.c.id == account_id)).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return _to_response(row)
