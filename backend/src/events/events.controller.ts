import { Body, Controller, Get, Param, Post, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity'
import { CreateEventDto } from './dto/create-event.dto';
import { ReserveTicketsDto } from './dto/reserve-tickets.dto';

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

  @Post(":id/reserve")
  async reserveTickets(@Headers("x-user-id") userId: string | undefined, @Param() params: any, @Body() dto: ReserveTicketsDto): Promise<{ reservation_id: string }> {
    // Simulating an authenticated user.
    // userId would come from a secure cookie or JWT bearer token after authentication.
    // Authentication would typically be handled by middleware.
    if (userId === undefined) {
      throw new Error("Assertion failure: Header `x-user-id` is blank or undefined. User not authenticated.");
    }

    const reservation = await this.eventsService.reserveTickets(userId, params.id, dto.numberOfTickets);
    if (reservation === undefined) {
      throw new HttpException("Reservation failed, insufficient tickets available", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return reservation;
  }
}
