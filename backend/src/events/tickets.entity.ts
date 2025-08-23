import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("tickets")
export class Ticket {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  event_id: string;

  @Column()
  ticket_number: number;

  @Column()
  ticket_status_id: number;
}