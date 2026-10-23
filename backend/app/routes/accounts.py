from uuid import UUID

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import insert, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import accounts, cards, transactions
from ..schemas import AccountCreate, AccountResponse, DepositCreate, DepositResponse, TransactionResponse

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


@router.post("/{account_id}/deposits", response_model=DepositResponse, status_code=status.HTTP_201_CREATED)
def create_deposit(account_id: UUID, payload: DepositCreate, db: Session = Depends(get_db)) -> DepositResponse:
    amount_cents = int(Decimal(payload.amount) * 100)
    try:
        account = db.execute(
            update(accounts)
            .where(accounts.c.id == account_id)
            .values(balance_cents=accounts.c.balance_cents + amount_cents)
            .returning(accounts.c)
        ).first()
        if account is None:
            db.rollback()
            raise HTTPException(status_code=404, detail="Account not found")
        activity = db.execute(
            insert(transactions).values(
                account_id=account_id,
                kind="DEPOSIT",
                amount_cents=amount_cents,
                outcome="APPROVED",
            ).returning(transactions.c.id)
        ).scalar_one()
        db.commit()
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error while processing deposit")
    return DepositResponse(
        account=_to_response(db.execute(_account_query().where(accounts.c.id == account_id)).one()),
        transaction_id=activity,
        amount_cents=amount_cents,
    )


@router.get("/{account_id}/transactions", response_model=list[TransactionResponse])
def list_transactions(account_id: UUID, db: Session = Depends(get_db)) -> list[TransactionResponse]:
    if db.execute(select(accounts.c.id).where(accounts.c.id == account_id)).first() is None:
        raise HTTPException(status_code=404, detail="Account not found")
    rows = db.execute(
        select(transactions).where(transactions.c.account_id == account_id).order_by(
            transactions.c.created_at.desc(), transactions.c.id.desc()
        )
    ).all()
    return [TransactionResponse(**row._mapping) for row in rows]
