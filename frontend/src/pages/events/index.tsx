import { apiUrl } from "@/constants";
import { IListableEvent } from "@/entities";
import Link from "next/link";
import { useEffect, useState } from "react";


export default function ListEvents() {
  const [events, setEvents] = useState<IListableEvent[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
  }, []);

  return (
    <>
      <h1>Events</h1>
      <Link href="/events/create">Add event</Link>
      {isLoading && <div>Loading events…</div>}
      <ul>
        {events.map((ev) => (
          <li key={ev.id}><Link href={`/events/${ev.id}`}>{ev.name} {ev.date.toString()}</Link></li>
        ))}
      </ul>

    </>
  );
}