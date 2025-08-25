import { apiUrl, userId } from "@/constants";
import { IViewableEvent } from "@/entities";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";


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

  async function buyTickets(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.target as any;
    const { eventId } = router.query;
    const resp = await fetch(`${apiUrl}/events/${eventId}/reserve`, {
      headers: { "x-user-id": userId, "Content-Type": "application/json"},
      body: JSON.stringify({ numberOfTickets: parseInt(form.numberOfTickets.value, 10)}),
      method: "POST"
    });

    if (resp.status === 201) {
      const { reservationId } = await resp.json();
      router.push(`/checkout/${reservationId}`);
    } else if (resp.status === 422) {
      const { message } = await resp.json();
      alert(message);
    } else {
      console.log("Unknown error, try again later.");
    }
  }

  return (
    <>
      <Link href="/events">Back to events</Link>
      {isLoading && <div>Loading event details…</div>}
      {event &&
        <>
          <h1>{event.name}</h1>
          <div>{new Date(event.date).toLocaleDateString()}</div>
          <div>Available tickets: {event.availableTicketsCount}</div>

          <form onSubmit={e => { void buyTickets(e); }}>
            <h2>Buy tickets</h2>
            <label htmlFor="numberOfTickets">Number of tickets:</label>
            <input id="numberOfTickets" name="numberOfTickets" type="number"/>
            <button type="submit">Buy now</button>
          </form>
        </>
      }
    </>
  );
}