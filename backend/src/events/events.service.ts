
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Ticket } from './tickets.entity';
import { ViewEventDto } from './dto/view-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private dataSource: DataSource
  ) {}

  async findEvents(): Promise<Event[]> {
    return await this.eventsRepository.find({
      order: { date: "DESC", name: "ASC" }
    });
  }

  async findEvent(eventId: string): Promise<ViewEventDto | undefined> {
    // This query will want revisiting as the application grows. Counting the available
    // tickets each time has a performance and contention cost. And if we want to include
    // the available ticket count on the list of events page, that will incur an even 
    // bigger performance and contention cost (counting N tickets for M events for each
    // event list request).
    // Business decisions around how up-to-date the list of available tickets should be
    // along with the system's performance will inform a better implementation when needs
    // arise.

    const [event] = await this.dataSource.query<any[]>(
      `with ticketCount as (
         select count(t.id) as availableTicketsCount
         from tickets t
         left join reservations r on r.id = t.reservation_id
         where t.event_id = $1
           and (t.ticket_status_id = 1 or (t.ticket_status_id = 2 and r.expires_at < now()))
       )
       select e.id, e.name, e.date, ticketCount.availableTicketsCount
       from events e, ticketCount
       where e.id = $1;
      `,
      [eventId]);

    return event ? 
      {
        id: event.id,
        name: event.name,
        date: new Date(event.date),
        availableTicketsCount: parseInt(event.availableticketscount, 10)
      }
      : undefined;
  }

  async create(dto: CreateEventDto): Promise<string> {
    // Possible performance impact on database and user here,
    // as we try to insert potentially thousands of rows. One
    // solution would be for this function to initiate a background
    // task that batch inserts the data over time. It's unlikely
    // that event creation is required to be immediately available.
    // Give the focus is on the concurrency of buying tickets, this
    // is sufficent for now and I consider a more advanced
    // implemenation to be out of scope.
    // The mixture of raw SQL and TypeORM usage was simply
    // down to the easiest path of making this work. TypeORM seems
    // to want to generate primary key UUIDs itself, whereas I
    // opted for the database to do this. Similarly I didn't want
    // to be building a bulk insert ticket statement from strings
    // myself when TypeORM provides fucntions to do this work.
    return await this.dataSource.transaction(async (txn) => {
      const [event] = await txn.query<[{ id: string }]>(
        `insert into events (name, date, capacity)
        values ($1, $2, $3)
        returning id;
        `,
        [dto.name, dto.date, dto.capacity]);

      const tickets: Partial<Ticket>[] = [];
      for (let i = 1; i <= dto.capacity; i++) {
        tickets.push({
          event_id: event.id,
          ticket_number: i,
          ticket_status_id: 1
        });
      }

      await txn.createQueryBuilder()
        .insert()
        .into(Ticket)
        .values(tickets)
        .execute();
      
      return event.id;
    });
  }

  async reserveTickets(userId: string, eventId: string, numberOfTickets: number): Promise<{ reservationId: string } | undefined> {
    // Considered out of scope: Possibly prevent a user from making a new reservation while they still have a pending one. A user could tie up all the
    // tickets with temporary reservations by making multiple POSTs. Ie, same user concurrency can be improved.
    const [reservation] = await this.dataSource.query<[{ reservationId: string }]>(
      `with available_tickets as materialized (
         select t.id
         from tickets t
         left join reservations r on r.id = t.reservation_id
         where t.event_id = $2
           and (t.ticket_status_id = 1 or (t.ticket_status_id = 2 and r.expires_at < now()))
         order by t.ticket_number
         limit $3
         for update of t -- may want to add 'skip locked' for a slightly more optimistic approach with less lock contention at the possibility of the optimistic approach failing when it may have otherwise succeeded if it had waited on the lock.
       ),
       make_reservation as (
         insert into reservations (user_id, expires_at)
         select $1, now() + interval '10 mins'
         where (select count(id) from available_tickets) = $3
         returning id
       ),
       update_tickets as (
         update tickets
         set ticket_status_id = 2,
           reservation_id = make_reservation.id
         from available_tickets, make_reservation
         where available_tickets.id = tickets.id
           and (select count(id) from available_tickets) = $3
         returning make_reservation.id
       )
       select id as reservation_id
       from make_reservation;
      `,
      [userId, eventId, numberOfTickets]
    );

    return reservation;
  }

  async process_payment(reservationId: string, paymentStatus: PaymentStatus): Promise<boolean> {
    // A pseudo webhook callback from a payment processor. Ordinarily you would want to
    // add a status to the reservation (eg payment in progress) and remove the reservation
    // expiry or check the reservation status during ticket reservation so these tickets are not 
    // allocated to someone else during payment processing.
    // These changes to the reservation table would happen when the user enters the payment details
    // step, and can see and review the now locked state of their order. Upon callback from the
    // payment processor, the system can create an order if payment is approved or do something else
    // if not, such as putting a new expiry timer on the reserved tickets and update the reservation
    // stauts so the user can decide what to do (eg try paying with a different payment method, if
    // that flow isn't already handled by the payment processor).
    // For the purposes of this task, all of the above is considered out of scope.

    if (paymentStatus === PaymentStatus.Approved) {
      const [reservation] = await this.dataSource.query<[{ reservation_id: string }]>(
        `update tickets t
         set ticket_status_id = 3
         from reservations r
         where t.reservation_id = r.id
           and r.id = $1;
        `,
        [reservationId]
      );
      return true;
    } else if (paymentStatus === PaymentStatus.Declined) {
      // Act accordingly.
      return false;
    }

    throw new Error("Assertion error: Unexpected code branch reached. Did PaymentStatus get a new enum member that wasn't handled?");
  }
}

enum PaymentStatus {
  Declined = 0,
  Approved = 1,
}
