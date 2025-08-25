# Sebastian, the simple events booking system

## Setup

The `.tool-versions` file details the software used. [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev/) can install and isolate this software. Otherwise ensure compatible software is available and Postgres is running.

Run `npm install` to install the dependencies.

### Postgres

The NestJS app uses Postgres which is configured with username `postgres`, password `postgres`, and port `5432`. If you need to change this, you can do so in `backend/src/app.module.ts`.

The file `db_init.sql` in the root is used to create the database and tables along with some seed data. It can be executed with `psql -U postgres -f db_init.sql`

## Running the apps

### NestJS backend

```bash
cd backend
npm run start
```
The NestJS API is served on `http://localhost:3000`. There are further notes on the API below.

### Next.js frontend

```bash
cd frontend
npm run dev
```
Next.js is served on `http://localhost:3001` with the entry point for this application available at `http://localhost:3001/events`

The reservation endpoint requires a user. In absence of authentication, this is mocked via the `x-user-id` header. For convenience, the user table does not automatically generated ids. There is one seeded user, Josh, whose id is hard coded in the Next.js app. See file `frontend/src/constants.ts` if you need to change this. 

### Example API usage

List events:
`curl http://localhost:3000/events`

List event:
`curl http://localhost:3000/events/<eventId>`

Create event:
`curl -H "Content-Type: application/json" -d'{"name":"My event","date":"2025-12-31","capacity":10}' http://localhost:3000/events/create`

Reserve tickets:
`curl -H "Content-Type: application/json" -H "x-user-id:38e61920-9d2e-4467-b6ef-0e38d9868b10" -d'{"numberOfTickets":4}' http://localhost:3000/events/<eventId>/reserve`

Confirm payment:
`curl -H "Content-Type: application/json" -d'{"reservationId":"<reservationId>","paymentStatus":1}' http://localhost:3000/events/payment_webhook`

## A note on concurrency

This application takes a pessimistic approach to concurrency. Since it's known that events sell out, this concurrency model allows the user to be sure that when they start the ticket purchase process, they will get the tickets they have asked for. Conversely, an optimistic concurrency approach means the user finds out only at the end of the ticket purchase process whether they have in fact obtained the requested tickets. Therefore a pessimistic concurrency model provides a better user experience for this application.

The pessimistic concurrent model used in this application is based around Postgres row level locks. When a user requests to purchase tickets, a check is done to ensure the number of requested tickets are still available (that is, they are not booked or currently reserved). If this is the case, those rows are locked and a reservation is created for the user and the selected tickets.

Postgres doesn't allow multiple commands (which includes explicit transactions) within a prepared statement so this was implemented as a single SQL command so as to leverage an implicit transaction. The row level locks are in place until the end of this transaction, ensuring that other users trying to book these tickets will be blocked until this transaction ends, at which time those users will see those tickets as reserved and therefore not available to them.

The reservation has a time limit of 10 minutes, and if the user has not completed checkout by then, they become available for other users to reserve. Since payment integration is not required, the checkout process is not a complete model with respect to the reservation expiry. There are further comments about this in the code, see below for more details.

## Other notes

There are some comments on other design choices of the application in the relevant parts of the code.

backend/src/events/events.controller.ts lines 37 and 52.
backend/src/events/events.service.ts lines 25, 59, 101, 139.


Things intentionally omitted:
- Almost all server side and client side validation.
- Any code doc comments.
- Better code organisation (eg reservation NestJS module).
- Tests.
- Cross site request forgery protection.
- Solid error handling.

