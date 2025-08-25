import { apiUrl } from "@/constants";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent } from "react";


export default function CheckoutReservation() {
  const router = useRouter();

  async function pay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const { reservationId } = router.query;
    const paymentData = {
      reservationId,
      paymentStatus: 1
    };

    const resp = await fetch(`${apiUrl}/events/payment_webhook`, {
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(paymentData),
      method: "POST"
    });

    console.log(resp);
    if (resp.status === 201) {
      alert("Tickets have been booked");
      router.push("/events");
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
      <h1>Enter payment details</h1>
      <form onSubmit={e => { void pay(e); }}>
        <button type="submit">Pay now</button>
      </form>
    </>
  );
}