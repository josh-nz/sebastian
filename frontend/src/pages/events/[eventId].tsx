import { apiUrl } from "@/constants";
import { IViewableEvent } from "@/entities";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";


export default function ViewEvent() {
  const router = useRouter();
  const [event, setEvents] = useState<IViewableEvent | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const { eventId } = router.query;

      fetch(`${apiUrl}/events/${eventId}`)
        .then((res) => res.json())
        .then((data) => {
          setEvents(data);
          setLoading(false);
        });
    }
  }, [router.isReady]);

  return (
    <>
      <Link href="/events">Back to events</Link>
      {isLoading && <div>Loading event details…</div>}
      {event &&
        <>
          <h1>{event.name}</h1>
          <div>{event.date.toString()}</div>
          <div>Available tickets: {event.availableTicketsCount}</div>
        </>
      }
    </>
  );
}