/**
 * Safe AI tool-calling boundary.
 *
 * These functions are the ONLY entry points the AI layer can use to read
 * marketplace data. Each wraps an existing service function — no direct
 * database access, no writes, no RLS bypass. See CONSTRAINTS.md "No writes
 * initiated by AI" and T-05-01/T-05-03.
 */
import * as listingService from "@/lib/services/listing.service";
import * as reviewService from "@/lib/services/review.service";

import type { ChatMessage } from "@/lib/services/ai.service";

type ToolResult = {
  success: boolean;
  message: string;
  data: unknown;
};

/**
 * OpenAI-compatible tool definition for `search_equipment`.
 */
export const SEARCH_EQUIPMENT_TOOL: {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
} = {
  type: "function",
  function: {
    name: "search_equipment",
    description:
      "Search for available equipment by optional category or location. Returns title, rate, category, and location for matching listings.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Optional category filter: Tractor, Harvester, Plough, Rotavator, Sprayer, Other",
        },
        location: {
          type: "string",
          description:
            "Optional location substring (e.g. Nashik, Maharashtra)",
        },
      },
    },
  },
};

/**
 * OpenAI-compatible tool definition for `get_equipment_reviews`.
 */
export const GET_REVIEWS_TOOL: {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
} = {
  type: "function",
  function: {
    name: "get_equipment_reviews",
    description:
      "Get reviews and average rating for a specific piece of equipment. Requires a title search term to identify the equipment.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description:
            "Title or partial title of the equipment (e.g. John Deere 5050D)",
        },
      },
    },
  },
};

/**
 * Tool implementations — these are what the AI "calls" via function-calling
 * in the chat completion request. Each returns structured data the AI then
 * narrates to the user.
 */
const toolImplementations: Record<
  string,
  (args: Record<string, string>) => Promise<ToolResult>
> = {
  search_equipment: async (args) => {
    const category = args.category || undefined;
    const location = args.location || undefined;
    const result = await listingService.getAllEquipment({
      category,
      location,
    });
    if (!result.success || !result.data) {
      return { success: false, message: result.message, data: [] };
    }
    const summary = result.data.map((eq) => ({
      id: eq.id,
      title: eq.title,
      category: eq.category,
      rate: eq.rate,
      rateUnit: eq.rate_unit,
      location: eq.location,
      owner: eq.users?.full_name ?? "Unknown",
    }));
    return {
      success: true,
      message: `Found ${summary.length} equipment(s)`,
      data: summary,
    };
  },

  get_equipment_reviews: async (args) => {
    const title = args.title || "";
    const searchResult = await listingService.getAllEquipment();
    if (!searchResult.success || !searchResult.data) {
      return { success: false, message: "Could not load equipment.", data: null };
    }
    const match = searchResult.data.find(
      (eq) => eq.title.toLowerCase().includes(title.toLowerCase())
    );
    if (!match) {
      return {
        success: false,
        message: `No equipment found matching "${title}".`,
        data: null,
      };
    }
    const [reviewsResult, avgResult] = await Promise.all([
      reviewService.getReviewsForEquipment(match.id),
      reviewService.getAverageRating(match.id),
    ]);
    return {
      success: true,
      message: "Reviews loaded",
      data: {
        equipmentTitle: match.title,
        averageRating: avgResult.data,
        totalReviews: (reviewsResult.data ?? []).length,
        reviews: (reviewsResult.data ?? []).map((r) => ({
          rating: r.rating,
          comment: r.comment,
          reviewer: r.users?.full_name ?? "Anonymous",
        })),
      },
    };
  },
};

export const ALL_TOOLS = [SEARCH_EQUIPMENT_TOOL, GET_REVIEWS_TOOL];

export const TOOL_CHOICE_AUTO = "auto" as const;

/**
 * Routes a tool-call response from the AI back to the right implementation.
 * Returns the function result as a user-role message the AI can summarize.
 */
export async function executeToolCall(
  toolName: string,
  args: Record<string, string>
): Promise<ChatMessage> {
  const fn = toolImplementations[toolName];
  if (!fn) {
    return {
      role: "user",
      content: `Error: unknown tool "${toolName}".`,
    };
  }
  const result = await fn(args);
  return {
    role: "user",
    content: JSON.stringify(result),
  };
}
