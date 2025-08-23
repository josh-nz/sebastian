
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './event.new.dto';
import { Ticket } from './tickets.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private dataSource: DataSource
  ) {}

  findAll(): Promise<Event[]> {
    return this.eventsRepository.find();
  }

  findOne(id: string) {
    return this.dataSource.query(
      `select e.name, e.date, count(e.id) as tickets_left
       from events e
       join tickets t on t.event_id = e.id
       where e.id = $1
        and (t.ticket_status_id = 1 or (t.ticket_status_id = 2 and t.reservation_expires_at < now()))
       group by e.id, e.name, e.date;
      `,
      [id]);
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
}
