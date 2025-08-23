import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity'

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(): Promise<Event[]> {
    return await this.eventsService.findAll();
  }

  @Get(":id")
  async getEvent(@Param() params: any): Promise<Event | null> {
    return await this.eventsService.findOne(params.id);
  }
}
