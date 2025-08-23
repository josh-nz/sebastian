import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("events")
export class Event {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  date: Date;

  @Column()
  capacity: number;
}