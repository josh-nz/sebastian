import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity'
import { CreateEventDto } from './dto/create-event.dto';

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

  @Post()
  async createEvent(@Body() dto: CreateEventDto): Promise<{ id: string}> {
    return {
      id: await this.eventsService.create(dto)
    };
  }
}
