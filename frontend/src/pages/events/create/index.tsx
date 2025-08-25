import { apiUrl } from "@/constants";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent } from "react";

export default function CreateEvent() {
  const router = useRouter();

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.target as any;
    const eventData = {
      name: form.name.value,
      date: form.date.value,
      capacity: parseInt(form.capacity.value, 10)
    };

    const resp = await fetch(`${apiUrl}/events/create`, {
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(eventData),
      method: "POST"
    });

    if (resp.status === 201) {
      const { eventId } = await resp.json();
      router.push(`/events/${eventId}`);
    }
    else {
      alert("Unknown error, try again later.");
    }
  }

  return (
    <>
      <Link href="/events">Back to events</Link>
      <h1>Add a new event</h1>
      <form onSubmit={e => { void createEvent(e); }}>
        <div>
          <label htmlFor="name">Event name:</label>
          <input id="name" name="name" type="text" required />
        </div>
        <div>
          <label htmlFor="date">Event date:</label>
          <input id="date" name="date" type="date" required />
        </div>
        <div>
          <label htmlFor="capacity">Event capacity:</label>
          <input id="capacity" name="capacity" type="number" required />
        </div>
        <button type="submit">Create event</button>
      </form>
    </>
  );
}