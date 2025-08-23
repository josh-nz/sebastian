
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './event.new.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.eventsRepository.find();
  }

  findOne(id: string): Promise<Event | null> {
    return this.eventsRepository.findOneBy({ id });
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
