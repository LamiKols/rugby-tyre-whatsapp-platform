import {
  handoffPatch,
  isHumanHandoffRequest
} from "../../core/handoff/handoffService.js";
import type {
  ConversationFlow,
  ConversationFlowContext,
  ConversationFlowResult
} from "../../core/conversations/types.js";
import { lookupTyresByCustomerInput, type TyreCatalogueRepository } from "./tyreCatalogueService.js";

const MENU = `Hi, this is Rugby Tyre Services.

How can we help?

1. Book an in-shop appointment
2. Mobile / emergency tyre callout
3. Check tyre size or price
4. Talk to someone`;

const ASK_TYRE_SIZE = "Please send your tyre size, for example 205/55/R16.";
const HUMAN_HANDOFF_MESSAGE =
  "Thanks. Someone from Rugby Tyre Services will reply as soon as possible.";

function unknownRetry(context: ConversationFlowContext): ConversationFlowResult {
  const failedAttempts = context.conversation.failed_attempts + 1;

  if (failedAttempts >= 2) {
    return {
      replies: [
        "I am not quite sure what you need from the menu.",
        HUMAN_HANDOFF_MESSAGE
      ],
      conversationPatch: handoffPatch("unrecognised_message_after_two_attempts"),
      audit: {
        action: "handoff_required",
        metadata: { reason: "unrecognised_message_after_two_attempts" }
      }
    };
  }

  return {
    replies: [`Please choose one of the menu options by replying 1, 2, 3 or 4.\n\n${MENU}`],
    conversationPatch: {
      failed_attempts: failedAttempts,
      current_state: "menu"
    }
  };
}

function comingSoonHandoff(intent: string, message: string): ConversationFlowResult {
  return {
    replies: [message, HUMAN_HANDOFF_MESSAGE],
    conversationPatch: {
      ...handoffPatch(intent),
      current_intent: intent
    },
    audit: {
      action: "handoff_required",
      metadata: { reason: intent }
    }
  };
}

function formatTyreOptions(size: string, options: Awaited<ReturnType<TyreCatalogueRepository["findActiveBySize"]>>) {
  const lines = options.map(
    (option, index) =>
      `${index + 1}. ${option.brand} (${option.category}) - GBP${option.fitted_price} fitted`
  );

  const placeholderNotice = options.some((option) => option.is_placeholder_seed_data)
    ? "\n\nThese are placeholder prices and will be confirmed by the shop."
    : "";

  return `We have options for ${size}:

${lines.join("\n")}${placeholderNotice}

Reply HELP if you want someone to check this for you.`;
}

export class TyreConversationFlow implements ConversationFlow {
  constructor(private readonly tyreCatalogueRepository: TyreCatalogueRepository) {}

  async handle(context: ConversationFlowContext): Promise<ConversationFlowResult> {
    const body = context.inbound.body.trim();
    const upper = body.toUpperCase();

    if (isHumanHandoffRequest(body)) {
      return {
        replies: [HUMAN_HANDOFF_MESSAGE],
        conversationPatch: handoffPatch("customer_requested_human"),
        audit: {
          action: "handoff_required",
          metadata: { reason: "customer_requested_human" }
        }
      };
    }

    if (context.isNewConversation) {
      return {
        replies: [MENU],
        conversationPatch: {
          current_state: "menu",
          failed_attempts: 0
        }
      };
    }

    if (context.conversation.current_state === "awaiting_tyre_size") {
      const lookup = await lookupTyresByCustomerInput(body, this.tyreCatalogueRepository);

      if (!lookup.parsed) {
        return unknownRetry(context);
      }

      if (lookup.options.length === 0) {
        return {
          replies: [
            "I could not find that tyre size in the current list.\n\nPlease send a photo of the tyre wall or wait for someone from Rugby Tyre Services to reply.",
            HUMAN_HANDOFF_MESSAGE
          ],
          conversationPatch: {
            ...handoffPatch("tyre_size_not_found"),
            current_intent: "tyre_lookup"
          },
          audit: {
            action: "handoff_required",
            metadata: { reason: "tyre_size_not_found", size: lookup.parsed.canonical }
          }
        };
      }

      return {
        replies: [formatTyreOptions(lookup.parsed.canonical, lookup.options)],
        conversationPatch: {
          status: "active",
          current_intent: "tyre_lookup",
          current_state: "menu",
          failed_attempts: 0,
          handoff_required: false,
          handoff_reason: null
        }
      };
    }

    if (upper === "1") {
      return comingSoonHandoff(
        "appointment_booking_phase_1_stub",
        "Appointment booking is coming soon. Someone from Rugby Tyre Services will help shortly."
      );
    }

    if (upper === "2") {
      return comingSoonHandoff(
        "mobile_callout_phase_1_stub",
        "Mobile and emergency callout handling is coming soon. Someone from Rugby Tyre Services will help shortly."
      );
    }

    if (upper === "3") {
      return {
        replies: [ASK_TYRE_SIZE],
        conversationPatch: {
          status: "active",
          current_intent: "tyre_lookup",
          current_state: "awaiting_tyre_size",
          failed_attempts: 0,
          handoff_required: false,
          handoff_reason: null
        }
      };
    }

    if (upper === "4") {
      return {
        replies: [HUMAN_HANDOFF_MESSAGE],
        conversationPatch: handoffPatch("menu_option_human"),
        audit: {
          action: "handoff_required",
          metadata: { reason: "menu_option_human" }
        }
      };
    }

    return unknownRetry(context);
  }
}
