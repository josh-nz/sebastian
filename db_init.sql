drop database sebastian;
create database sebastian;

\c sebastian;

create table users (
  id uuid primary key,
  name text not null
);

create table events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date timestamp not null,
  capacity int not null
);

create table ticket_statuses (
  id integer primary key,
  status text not null
);

create table reservations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references users,
  expires_at timestamp not null
);

create table tickets (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references events,
  ticket_number int not null,
  ticket_status_id int not null references ticket_statuses,
  reservation_id uuid references reservations
);


insert into ticket_statuses (id, status)
values (1, 'available'), (2, 'reserved'), (3, 'booked');


-- Seed data:
insert into users (id, name) values ('38e61920-9d2e-4467-b6ef-0e38d9868b10', 'Josh');

insert into events (name, date, capacity)
values ('Jeff Buckley', '2025-10-30', 5);

do $$
declare jeffEventId uuid;
begin
select id into jeffEventId from events where name = 'Jeff Buckley';
insert into tickets (event_id, ticket_number, ticket_status_id)
values (jeffEventId, 1, 1),
  (jeffEventId, 2, 1),
  (jeffEventId, 3, 1),
  (jeffEventId, 4, 1),
  (jeffEventId, 5, 1);
end $$