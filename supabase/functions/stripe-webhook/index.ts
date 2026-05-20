// Supabase Edge Function: stripe-webhook
//
// This is called by Stripe (not by our browser) after a payment is processed.
// Stripe sends a POST request with event data whenever something happens
// (payment succeeded, payment failed, etc.)
//
// Flow:
// 1. Student pays on Stripe Checkout → Stripe sends event here
// 2. We verify the event is genuinely from Stripe (not forged)
// 3. If it's a successful payment, we create an enrollment + payment record
// 4. The student is now enrolled in the course
//
// Why we use SUPABASE_SERVICE_ROLE_KEY here:
// This request comes from Stripe's servers, not from a logged-in user.
// There's no user session/JWT, so we can't use RLS.
// The service role key bypasses RLS — it has full admin access.
// This is safe because only Stripe can call this function (verified by signature).

import Stripe from "https://esm.sh/stripe@17.7.0?target=denoland";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Stripe sends a special signature header with every webhook request.
// We use STRIPE_WEBHOOK_SIGNING_SECRET to verify it.
// This prevents anyone from faking a payment event.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!;

// Create a Supabase client with the service role key (admin access)
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    // ── Step 1: Get the raw request body and Stripe signature ──
    // We need the raw body (not parsed JSON) for signature verification.
    // Stripe signs the raw body, so parsing it first would break verification.
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No stripe-signature header" }),
        { status: 400 }
      );
    }

    // ── Step 2: Verify the event is from Stripe ──
    // constructEvent() checks the signature against our webhook secret.
    // If someone sends a fake request, this will throw an error.
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400 }
      );
    }

    // ── Step 3: Handle the event ──
    // We only care about "checkout.session.completed" — this means
    // the student successfully paid. Stripe sends many event types,
    // but we ignore the rest.
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract the metadata we attached in create-checkout
      const courseId = session.metadata?.courseId;
      const userId = session.metadata?.userId;

      if (!courseId || !userId) {
        console.error("Missing metadata in session:", session.id);
        return new Response(
          JSON.stringify({ error: "Missing metadata" }),
          { status: 400 }
        );
      }

      // ── Step 4: Create the enrollment ──
      // This is the key action — the student is now enrolled in the course.
      const { error: enrollmentError } = await supabaseAdmin
        .from("enrollments")
        .insert({
          student_id: userId,
          course_id: courseId,
          payment_status: "completed",
        });

      if (enrollmentError) {
        console.error("Failed to create enrollment:", enrollmentError);
        return new Response(
          JSON.stringify({ error: "Failed to create enrollment" }),
          { status: 500 }
        );
      }

      // ── Step 5: Create a payment record ──
      // This stores the payment details for reference.
      // amount_total is in cents, so we divide by 100 to get dollars.
      const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          student_id: userId,
          course_id: courseId,
          amount: (session.amount_total || 0) / 100,
          provider: "stripe",
          status: "completed",
        });

      if (paymentError) {
        // Log but don't fail — the enrollment was already created
        // The student can access the course even if the payment record fails
        console.error("Failed to create payment record:", paymentError);
      }

      console.log(`Enrollment created: user ${userId} → course ${courseId}`);
    }

    // ── Step 6: Acknowledge the event ──
    // We must return 200 to tell Stripe we received the event.
    // If we return an error, Stripe will retry the webhook multiple times.
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
