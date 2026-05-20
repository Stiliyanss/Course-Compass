// Supabase Edge Function: create-checkout
//
// This runs on Supabase's servers (not in the browser).
// It creates a Stripe Checkout Session for a course purchase.
//
// Flow:
// 1. Browser sends: POST /create-checkout { courseId: "..." }
// 2. This function verifies the user, fetches course data
// 3. Creates a Stripe Checkout Session with the course as a line item
// 4. Returns the Checkout URL to the browser
// 5. Browser redirects the student to Stripe's hosted payment page

import Stripe from "https://esm.sh/stripe@17.7.0?target=denoland";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers — needed because the browser (localhost:5173) calls this
// function on a different domain (supabase project URL).
// Without these, the browser would block the request.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle preflight CORS request
  // Browsers send an OPTIONS request first to check if the server allows
  // cross-origin requests. We respond with the CORS headers.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Step 1: Get the courseId from the request body ──
    const { courseId } = await req.json();
    if (!courseId) {
      return new Response(
        JSON.stringify({ error: "courseId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Verify the user is authenticated ──
    // We create a Supabase client using the user's JWT token from the
    // Authorization header. This client respects RLS — it can only access
    // what the user is allowed to see.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Fetch the course from the database ──
    // We need the title and price to create the Stripe Checkout Session.
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("id, title, price, image_url")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 4: Check if user is already enrolled ──
    const { data: existingEnrollment } = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .eq("payment_status", "completed")
      .maybeSingle();

    if (existingEnrollment) {
      return new Response(
        JSON.stringify({ error: "Already enrolled in this course" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Create Stripe Checkout Session ──
    // Initialize Stripe with the secret key (stored as a Supabase secret)
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-12-18.acacia",
    });

    // The session defines what the student is paying for and where
    // Stripe should redirect them after payment.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      // Line items = what the student is buying
      // Stripe needs the price in cents (e.g. $29.99 = 2999)
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.title,
              ...(course.image_url ? { images: [course.image_url] } : {}),
            },
            unit_amount: Math.round(Number(course.price) * 100),
          },
          quantity: 1,
        },
      ],

      // Metadata — Stripe stores these and sends them back in the webhook
      // This is how we know which user bought which course after payment
      metadata: {
        courseId: course.id,
        userId: user.id,
      },

      // Where to redirect the student after payment
      success_url: `${req.headers.get("origin")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/courses/${courseId}`,
    });

    // ── Step 6: Return the Checkout URL ──
    // The browser will redirect the student to this URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
