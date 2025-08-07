import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { getUsers } from "@/database";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Authenticating your Liveblocks application
// https://liveblocks.io/docs/authentication

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(request: NextRequest) {
  try {
    // Get auth type from query parameters or default to writer
    const authType = request.nextUrl.searchParams.get("authType") || "writer";

    // Get user based on auth type
    let user;

    switch (authType) {
      case "writer":
        // Full access user - can read, write, and see comments
        user = getUsers()[0];
        break;

      case "reviewer":
        // Authenticated user but can't see comments
        user = getUsers()[1];
        break;

      case "guest":
        // Anonymous user - read-only access with persistent ID
        const cookieStore = await cookies();
        let anonId = cookieStore.get("anon_id")?.value;

        if (!anonId) {
          anonId = uuidv4();

          // Set the cookie for 30 days
          cookieStore.set("anon_id", anonId, {
            httpOnly: true,
            secure: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
          });
        }

        user = {
          id: `anonymous-${anonId}`,
          info: {
            name: "Anonymous User",
            color: "#888888",
            avatar: "",
          },
        };
        break;

      default:
        // Default to writer
        user = getUsers()[0];
    }

    // Identify the user and return the result
    const session = await liveblocks.prepareSession(user.id, {
      userInfo: user.info,
    });

    session.allow(
      "*",
      authType === "writer" || authType === "reviewer"
        ? session.FULL_ACCESS
        : session.READ_ACCESS
    );

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Auth error:", error);
    return new Response("Authentication failed", { status: 500 });
  }
}
