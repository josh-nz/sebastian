import { Body, Controller, Get, Param, Post, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity'
import { CreateEventDto } from './dto/create-event.dto';
import { ReserveTicketsDto } from './dto/reserve-tickets.dto';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

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

  // Out of scope: User cancelling a reservation. This would require an authenticated POST with the reservationId and then
  // updating the corresponding tables to undo the reservation process, checking first that the reservation had not expired
  // and therefore confirming the tickets can safely be modified to available (and not accidently adjusting someone else's
  // reserved tickets).

  @Post("payment_webhook")
  async paymentProcessorWebhookCallback(@Body() dto: PaymentWebhookDto) {
    const success = await this.eventsService.process_payment(dto.reservationId, dto.paymentStatus);
    if (success) {
      return;
    }
    
    throw new HttpException("An error occurred during payment processing.", HttpStatus.UNPROCESSABLE_ENTITY)
  }
}
