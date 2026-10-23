from sqlalchemy import MetaData, Table, Column, BigInteger, DateTime, Integer, String, Text, UUID, text

metadata = MetaData()

accounts = Table(
    "accounts",
    metadata,
    Column("id", UUID, primary_key=True, server_default=text("gen_random_uuid()")),
    Column(
        "account_number",
        BigInteger,
        nullable=False,
        server_default=text("nextval('account_number_seq')"),
    ),
    Column("holder_name", Text, nullable=False),
    Column("currency", String(3), nullable=False),
    Column("balance_cents", Integer, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=text("now()")),
)

cards = Table(
    "cards",
    metadata,
    Column("id", UUID, primary_key=True),
    Column("account_id", UUID, nullable=False),
    Column("token", String(16), nullable=False),
    Column("issued_at", DateTime(timezone=True), nullable=False),
)

transactions = Table(
    "transactions",
    metadata,
    Column("id", UUID, primary_key=True, server_default=text("gen_random_uuid()")),
    Column("account_id", UUID, nullable=False),
    Column("card_id", UUID),
    Column("kind", String, nullable=False),
    Column("amount_cents", Integer, nullable=False),
    Column("merchant", Text),
    Column("category", Text),
    Column("outcome", String, nullable=False),
    Column("decline_reason", String),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=text("now()")),
)
