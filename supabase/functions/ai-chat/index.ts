// Supabase Edge Function: ai-chat
//
// Proxies chat messages to the Groq API so the API key stays server-side.
// Supports function calling (tool use) — the LLM can query real course data.
//
// Flow:
// 1. Browser sends: POST /ai-chat { messages: [{ role, content }] }
// 2. This function verifies the user is authenticated
// 3. Forwards the conversation to Groq (Llama 3.3 70B) with tools defined
// 4. If Groq wants to call a tool → run the Supabase query → send results back
// 5. Returns the final response to the browser

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// System prompt
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

You have access to tools that let you search and query real course data from the platform database. Use them when the user asks about specific courses, prices, instructors, or wants recommendations. Always use the tools instead of guessing — give answers based on real data.

Answer questions helpfully and concisely. If a tool returns no results, say so honestly.`;

// ── Tool definitions (OpenAI function-calling format) ──
const tools = [
  {
    type: "function",
    function: {
      name: "search_courses",
      description:
        "Search published courses by keyword. Optionally filter by maximum price. Returns title, price, instructor name, and average rating.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keyword to match against course titles",
          },
          max_price: {
            type: "number",
            description: "Maximum price filter (optional)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_course_details",
      description:
        "Get full details of a specific course by its title. Returns price, instructor, description, duration, sections, number of students, and average rating.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The course title (or partial title) to look up",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_popular_courses",
      description:
        "Get the most popular courses, sorted by number of enrolled students or by average rating.",
      parameters: {
        type: "object",
        properties: {
          sort_by: {
            type: "string",
            enum: ["enrollments", "rating"],
            description:
              "Sort by number of enrollments or by average rating (default: enrollments)",
          },
          limit: {
            type: "number",
            description: "Number of courses to return (default: 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cheapest_courses",
      description:
        "Get published courses sorted by price from lowest to highest.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of courses to return (default: 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_instructor_courses",
      description:
        "Get all published courses by a specific instructor name.",
      parameters: {
        type: "object",
        properties: {
          instructor_name: {
            type: "string",
            description: "The instructor's name (or partial name) to search for",
          },
        },
        required: ["instructor_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_courses",
      description:
        "Get the courses the current user is enrolled in, with their progress.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_courses",
      description:
        "Recommend courses the user is NOT enrolled in. Suggests popular courses they haven't taken yet.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of recommendations to return (default: 5)",
          },
        },
        required: [],
      },
    },
  },
];

// ── Tool execution — runs the actual Supabase queries ──
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  supabaseClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  switch (toolName) {
    // ─── search_courses ───
    case "search_courses": {
      let query = supabaseClient
        .from("courses")
        .select("id, title, price, instructor_id, discount_percent, sale_ends_at")
        .eq("status", "published")
        .ilike("title", `%${args.query}%`);

      if (args.max_price) {
        query = query.lte("price", args.max_price);
      }

      const { data: courses, error } = await query.limit(10);
      if (error) return JSON.stringify({ error: error.message });
      if (!courses || courses.length === 0)
        return JSON.stringify({ results: [], message: "No courses found" });

      // Get instructor names
      const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
      const { data: instructors } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);

      // Get review stats
      const courseIds = courses.map((c) => c.id);
      const { data: reviews } = await supabaseClient
        .from("course_reviews")
        .select("course_id, rating")
        .in("course_id", courseIds);

      const reviewStats: Record<string, { total: number; sum: number }> = {};
      for (const r of reviews || []) {
        if (!reviewStats[r.course_id])
          reviewStats[r.course_id] = { total: 0, sum: 0 };
        reviewStats[r.course_id].total++;
        reviewStats[r.course_id].sum += r.rating;
      }

      const results = courses.map((c) => {
        const instructor = instructors?.find((i) => i.id === c.instructor_id);
        const stats = reviewStats[c.id];
        const saleActive =
          Number(c.discount_percent) > 0 &&
          c.sale_ends_at &&
          new Date(c.sale_ends_at) > new Date();
        const effectivePrice = saleActive
          ? Math.round(Number(c.price) * (1 - Number(c.discount_percent) / 100) * 100) / 100
          : Number(c.price);

        return {
          title: c.title,
          price: `$${effectivePrice}`,
          original_price: saleActive ? `$${c.price}` : undefined,
          discount: saleActive ? `${c.discount_percent}% off` : undefined,
          instructor: instructor?.full_name || "Unknown",
          avg_rating: stats
            ? (stats.sum / stats.total).toFixed(1)
            : "No reviews yet",
          review_count: stats?.total || 0,
        };
      });

      return JSON.stringify({ results });
    }

    // ─── get_course_details ───
    case "get_course_details": {
      const { data: courses, error } = await supabaseClient
        .from("courses")
        .select("*")
        .eq("status", "published")
        .ilike("title", `%${args.title}%`)
        .limit(1);

      if (error) return JSON.stringify({ error: error.message });
      if (!courses || courses.length === 0)
        return JSON.stringify({ error: "Course not found" });

      const course = courses[0];

      // Instructor
      const { data: instructor } = await supabaseClient
        .from("profiles")
        .select("full_name")
        .eq("id", course.instructor_id)
        .single();

      // Sections
      const { data: sections } = await supabaseClient
        .from("course_sections")
        .select("id, title, order_index")
        .eq("course_id", course.id)
        .order("order_index");

      // Materials count
      const { data: materials } = await supabaseClient
        .from("course_materials")
        .select("id")
        .eq("course_id", course.id);

      // Enrollment count
      const { count: enrollmentCount } = await supabaseClient
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id)
        .eq("payment_status", "completed");

      // Reviews
      const { data: reviews } = await supabaseClient
        .from("course_reviews")
        .select("rating")
        .eq("course_id", course.id);

      const avgRating =
        reviews && reviews.length > 0
          ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
          : "No reviews yet";

      const saleActive =
        Number(course.discount_percent) > 0 &&
        course.sale_ends_at &&
        new Date(course.sale_ends_at) > new Date();
      const effectivePrice = saleActive
        ? Math.round(Number(course.price) * (1 - Number(course.discount_percent) / 100) * 100) / 100
        : Number(course.price);

      return JSON.stringify({
        title: course.title,
        description: course.description,
        price: `$${effectivePrice}`,
        original_price: saleActive ? `$${course.price}` : undefined,
        discount: saleActive ? `${course.discount_percent}% off` : undefined,
        duration: course.duration || "Not specified",
        instructor: instructor?.full_name || "Unknown",
        sections: sections?.map((s) => s.title) || [],
        materials_count: materials?.length || 0,
        enrolled_students: enrollmentCount || 0,
        avg_rating: avgRating,
        review_count: reviews?.length || 0,
      });
    }

    // ─── get_popular_courses ───
    case "get_popular_courses": {
      const limit = Number(args.limit) || 5;
      const sortBy = args.sort_by || "enrollments";

      const { data: courses, error } = await supabaseClient
        .from("courses")
        .select("id, title, price, instructor_id")
        .eq("status", "published");

      if (error) return JSON.stringify({ error: error.message });
      if (!courses || courses.length === 0)
        return JSON.stringify({ results: [], message: "No courses found" });

      const courseIds = courses.map((c) => c.id);

      // Enrollment counts
      const { data: enrollments } = await supabaseClient
        .from("enrollments")
        .select("course_id")
        .eq("payment_status", "completed")
        .in("course_id", courseIds);

      const enrollCounts: Record<string, number> = {};
      for (const e of enrollments || []) {
        enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1;
      }

      // Reviews
      const { data: reviews } = await supabaseClient
        .from("course_reviews")
        .select("course_id, rating")
        .in("course_id", courseIds);

      const reviewStats: Record<string, { total: number; sum: number }> = {};
      for (const r of reviews || []) {
        if (!reviewStats[r.course_id])
          reviewStats[r.course_id] = { total: 0, sum: 0 };
        reviewStats[r.course_id].total++;
        reviewStats[r.course_id].sum += r.rating;
      }

      // Instructor names
      const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
      const { data: instructors } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);

      // Sort
      const sorted = courses
        .map((c) => {
          const stats = reviewStats[c.id];
          return {
            ...c,
            enrollments: enrollCounts[c.id] || 0,
            avg_rating: stats ? stats.sum / stats.total : 0,
            review_count: stats?.total || 0,
          };
        })
        .sort((a, b) =>
          sortBy === "rating"
            ? b.avg_rating - a.avg_rating
            : b.enrollments - a.enrollments
        )
        .slice(0, limit);

      const results = sorted.map((c) => ({
        title: c.title,
        price: `$${c.price}`,
        instructor:
          instructors?.find((i) => i.id === c.instructor_id)?.full_name ||
          "Unknown",
        enrolled_students: c.enrollments,
        avg_rating: c.avg_rating ? c.avg_rating.toFixed(1) : "No reviews yet",
        review_count: c.review_count,
      }));

      return JSON.stringify({ results });
    }

    // ─── get_cheapest_courses ───
    case "get_cheapest_courses": {
      const limit = Number(args.limit) || 5;

      const { data: courses, error } = await supabaseClient
        .from("courses")
        .select("id, title, price, instructor_id")
        .eq("status", "published")
        .order("price", { ascending: true })
        .limit(limit);

      if (error) return JSON.stringify({ error: error.message });
      if (!courses || courses.length === 0)
        return JSON.stringify({ results: [], message: "No courses found" });

      const instructorIds = [...new Set(courses.map((c) => c.instructor_id))];
      const { data: instructors } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);

      const results = courses.map((c) => ({
        title: c.title,
        price: `$${c.price}`,
        instructor:
          instructors?.find((i) => i.id === c.instructor_id)?.full_name ||
          "Unknown",
      }));

      return JSON.stringify({ results });
    }

    // ─── get_instructor_courses ───
    case "get_instructor_courses": {
      // Find instructor by name
      const { data: instructors, error: pError } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor")
        .ilike("full_name", `%${args.instructor_name}%`);

      if (pError) return JSON.stringify({ error: pError.message });
      if (!instructors || instructors.length === 0)
        return JSON.stringify({ error: "Instructor not found" });

      const instructor = instructors[0];

      const { data: courses, error } = await supabaseClient
        .from("courses")
        .select("title, price, status")
        .eq("instructor_id", instructor.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) return JSON.stringify({ error: error.message });

      return JSON.stringify({
        instructor: instructor.full_name,
        courses: (courses || []).map((c) => ({
          title: c.title,
          price: `$${c.price}`,
        })),
      });
    }

    // ─── get_my_courses ───
    case "get_my_courses": {
      const { data: enrollments, error } = await supabaseClient
        .from("enrollments")
        .select("course_id")
        .eq("student_id", userId)
        .eq("payment_status", "completed");

      if (error) return JSON.stringify({ error: error.message });
      if (!enrollments || enrollments.length === 0)
        return JSON.stringify({
          courses: [],
          message: "You are not enrolled in any courses",
        });

      const courseIds = enrollments.map((e) => e.course_id);

      const { data: courses } = await supabaseClient
        .from("courses")
        .select("id, title, price, instructor_id")
        .in("id", courseIds);

      // Progress for each course
      const { data: allMaterials } = await supabaseClient
        .from("course_materials")
        .select("id, course_id")
        .in("course_id", courseIds);

      const { data: progress } = await supabaseClient
        .from("material_progress")
        .select("material_id, completed")
        .eq("student_id", userId)
        .eq("completed", true);

      const completedIds = new Set(
        (progress || []).map((p) => p.material_id)
      );

      // Instructor names
      const instructorIds = [
        ...new Set((courses || []).map((c) => c.instructor_id)),
      ];
      const { data: instructors } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);

      const results = (courses || []).map((c) => {
        const courseMaterials = (allMaterials || []).filter(
          (m) => m.course_id === c.id
        );
        const completedCount = courseMaterials.filter((m) =>
          completedIds.has(m.id)
        ).length;
        const totalCount = courseMaterials.length;

        return {
          title: c.title,
          instructor:
            instructors?.find((i) => i.id === c.instructor_id)?.full_name ||
            "Unknown",
          progress:
            totalCount > 0
              ? `${completedCount}/${totalCount} materials completed (${Math.round((completedCount / totalCount) * 100)}%)`
              : "No materials yet",
        };
      });

      return JSON.stringify({ courses: results });
    }

    // ─── recommend_courses ───
    case "recommend_courses": {
      const limit = Number(args.limit) || 5;

      // Get courses user is already enrolled in
      const { data: enrollments } = await supabaseClient
        .from("enrollments")
        .select("course_id")
        .eq("student_id", userId)
        .eq("payment_status", "completed");

      const enrolledIds = new Set(
        (enrollments || []).map((e) => e.course_id)
      );

      // Get all published courses
      const { data: courses, error } = await supabaseClient
        .from("courses")
        .select("id, title, price, instructor_id")
        .eq("status", "published");

      if (error) return JSON.stringify({ error: error.message });

      // Filter out enrolled courses
      const available = (courses || []).filter(
        (c) => !enrolledIds.has(c.id)
      );

      if (available.length === 0)
        return JSON.stringify({
          results: [],
          message: "You've enrolled in all available courses!",
        });

      const courseIds = available.map((c) => c.id);

      // Get enrollment counts for popularity sorting
      const { data: allEnrollments } = await supabaseClient
        .from("enrollments")
        .select("course_id")
        .eq("payment_status", "completed")
        .in("course_id", courseIds);

      const enrollCounts: Record<string, number> = {};
      for (const e of allEnrollments || []) {
        enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1;
      }

      // Reviews
      const { data: reviews } = await supabaseClient
        .from("course_reviews")
        .select("course_id, rating")
        .in("course_id", courseIds);

      const reviewStats: Record<string, { total: number; sum: number }> = {};
      for (const r of reviews || []) {
        if (!reviewStats[r.course_id])
          reviewStats[r.course_id] = { total: 0, sum: 0 };
        reviewStats[r.course_id].total++;
        reviewStats[r.course_id].sum += r.rating;
      }

      // Sort by enrollments (most popular first)
      const sorted = available
        .map((c) => ({
          ...c,
          enrollments: enrollCounts[c.id] || 0,
          avg_rating: reviewStats[c.id]
            ? reviewStats[c.id].sum / reviewStats[c.id].total
            : 0,
          review_count: reviewStats[c.id]?.total || 0,
        }))
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, limit);

      // Instructor names
      const instructorIds = [
        ...new Set(sorted.map((c) => c.instructor_id)),
      ];
      const { data: instructors } = await supabaseClient
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);

      const results = sorted.map((c) => ({
        title: c.title,
        price: `$${c.price}`,
        instructor:
          instructors?.find((i) => i.id === c.instructor_id)?.full_name ||
          "Unknown",
        enrolled_students: c.enrollments,
        avg_rating: c.avg_rating ? c.avg_rating.toFixed(1) : "No reviews yet",
      }));

      return JSON.stringify({ results });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// Helper: call Groq with retry on 429 (rate limit)
async function callGroq(
  apiKey: string,
  body: Record<string, unknown>,
  maxRetries = 2
): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) {
      return await response.json();
    }

    if (response.status === 429 && attempt < maxRetries) {
      // Wait 2 seconds before retrying
      console.log(`Rate limited, retrying in 2s (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    const errorBody = await response.text();
    console.error("Groq API error:", response.status, errorBody);
    throw new Error(`Groq API returned ${response.status}`);
  }

  throw new Error("Groq API max retries exceeded");
}

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

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const userContext = profile
      ? `\n\nThe user you're talking to is ${profile.full_name}, who has the ${profile.role} role. Tailor your answers to this role.`
      : "";

    // ── Step 2.5: Rate limiting — 20 requests per user per hour ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabaseClient
      .from("chat_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("requested_at", oneHourAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if ((count ?? 0) >= 20) {
      return new Response(
        JSON.stringify({
          error:
            "You've reached the limit of 20 messages per hour. Please try again later.",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log this request for rate limiting
    await supabaseClient
      .from("chat_rate_limits")
      .insert({ user_id: user.id });

    // ── Step 3: Call the Groq API with tools ──
    const apiKey = Deno.env.get("GROQ_API_KEY");

    // Build the conversation for Groq
    const groqMessages: Array<Record<string, unknown>> = [
      { role: "system", content: SYSTEM_PROMPT + userContext },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // First call — LLM may respond directly or request tool calls
    let groqData = await callGroq(apiKey!, {
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      tools,
      tool_choice: "auto",
      messages: groqMessages,
    });
    let choice = groqData.choices?.[0];

    // ── Step 3.5: Handle tool calls (loop up to 3 rounds) ──
    let toolRounds = 0;
    while (
      choice?.finish_reason === "tool_calls" &&
      choice?.message?.tool_calls &&
      toolRounds < 3
    ) {
      toolRounds++;

      // Add the assistant's tool_calls message to the conversation
      groqMessages.push(choice.message);

      // Execute each tool call and add results
      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        const fnArgs = JSON.parse(toolCall.function.arguments || "{}");

        console.log(`Tool call: ${fnName}`, fnArgs);

        const result = await executeTool(
          fnName,
          fnArgs,
          supabaseClient,
          user.id
        );

        groqMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Call Groq again with the tool results
      groqData = await callGroq(apiKey!, {
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        tools,
        messages: groqMessages,
      });
      choice = groqData.choices?.[0];
    }

    // ── Step 4: Return the final response ──
    const assistantMessage = choice?.message?.content || "";

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
