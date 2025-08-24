export interface IListableEvent {
  id: string;
  name: string;
  date: Date;
  capacity: number;
}

export interface IViewableEvent {
  name: string;
  date: Date;
  availableTicketsCount: number;
}