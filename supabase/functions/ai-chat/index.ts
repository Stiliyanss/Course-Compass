// Supabase Edge Function: ai-chat
//
// Proxies chat messages to the Gemini API so the API key stays server-side.
//
// Flow:
// 1. Browser sends: POST /ai-chat { messages: [{ role, content }] }
// 2. This function verifies the user is authenticated
// 3. Forwards the conversation to Gemini with a system prompt
// 4. Returns Gemini's response to the browser

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers — needed because the browser (localhost:5173) calls this
// function on a different domain (supabase project URL).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// System prompt — tells Gemini about the Course Compass platform
const SYSTEM_PROMPT = `You are a helpful assistant for Course Compass, an online course marketplace platform.

The platform has three user roles:
- Students: browse the course catalog, purchase courses via Stripe, track progress on materials, leave reviews and ratings, set weekly learning goals, and take notes on sections.
- Instructors: create and manage courses (draft/published/archived), organize content into sections, upload materials (PDF, video, documents), view analytics dashboards, and set sales/discounts.
- Admins: manage all users, review instructor applications, oversee all courses, and view platform-wide analytics.

Key platform features:
- Course catalog with search and filtering
- Stripe-powered payments with discount/sale support
- Course materials organized into sections with drag-and-drop reordering
- Per-material progress tracking with completion checkboxes
- Section notes for personal study annotations
- Material comments for student discussions
- Star ratings and written reviews on courses
- Student dashboard with learning streaks, weekly goals, and progress rings
- Instructor dashboard with revenue charts, enrollment analytics, and student lists
- Admin dashboard with platform-wide stats across Students and Instructors tabs
- Profile management with avatar uploads
- Instructor application process (students apply, admins approve/reject)

Navigation guide:
- Home page: browse featured courses and apply to become an instructor
- /courses: full course catalog with search
- /courses/:id: course detail page with sections, materials, reviews
- /student/dashboard: learning dashboard with progress and goals
- /student/my-courses: list of enrolled courses
- /student/apply-instructor: instructor application form
- /instructor/dashboard: revenue and enrollment analytics
- /instructor/courses: manage your courses
- /admin/dashboard: platform-wide statistics
- /admin/users: manage users and roles
- /admin/courses: manage all courses
- /admin/applications: review instructor applications

Answer questions helpfully and concisely. If you don't know something specific about the user's account or data, say so — you don't have access to their personal data. Focus on helping with platform navigation, feature explanations, and general guidance.`;

Deno.serve(async (req) => {
  // Handle preflight CORS request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Step 1: Parse and validate the request body ──
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages must be a non-empty array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many messages (max 50)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate each message has the correct shape
    for (const msg of messages) {
      if (
        !msg.role ||
        !["user", "assistant"].includes(msg.role) ||
        typeof msg.content !== "string" ||
        !msg.content.trim()
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Each message must have role ('user' or 'assistant') and non-empty content",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ── Step 2: Verify the user is authenticated ──
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
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Step 3: Call the Gemini API ──
    // Convert our messages format to Gemini's format:
    // Gemini uses "user" and "model" roles (not "assistant")
    // Gemini uses "parts" array with "text" field (not "content" string)
    const geminiMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })
    );

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorBody);
      throw new Error(`Gemini API returned ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();

    // Extract the text from Gemini's response
    const assistantMessage =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // ── Step 4: Return the response ──
    return new Response(
      JSON.stringify({ response: assistantMessage }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("AI chat error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
