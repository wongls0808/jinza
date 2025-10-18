-- Persist bank logos in database to survive restarts/deploys
create table if not exists bank_logos (
  bank_id int primary key references banks(id) on delete cascade,
  mime text not null,
  data bytea not null,
  updated_at timestamptz default now()
);

create index if not exists ix_bank_logos_updated_at on bank_logos(updated_at desc);
