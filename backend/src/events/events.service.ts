
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './event.new.dto';

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
    const newEvent = this.eventsRepository.create({
      name: dto.name,
      date: dto.date,
      capacity: dto.capacity
    });

    const event = await this.eventsRepository.save(newEvent);
    return event.id;
  }
}
