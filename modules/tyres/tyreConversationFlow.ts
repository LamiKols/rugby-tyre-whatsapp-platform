import {
  handoffPatch,
  isHumanHandoffRequest
} from "../../core/handoff/handoffService.js";
import type { JobIntakeRepository } from "../../core/jobs/jobRepository.js";
import { isCancellationIntent, isRescheduleIntent } from "../../core/jobs/jobIntents.js";
import type {
  ConversationFlow,
  ConversationFlowContext,
  ConversationFlowResult
} from "../../core/conversations/types.js";
import { lookupTyresByCustomerInput, type TyreCatalogueRepository } from "./tyreCatalogueService.js";
import { normalizeTyreSize } from "./tyreSize.js";

const MENU = `Hi, this is Rugby Tyre Services.

How can we help?

1. Book an in-shop appointment
2. Mobile / emergency tyre callout
3. Check tyre size or price
4. Talk to someone`;

const ASK_TYRE_SIZE = "Please send your tyre size, for example 205/55/R16.";
const HUMAN_HANDOFF_MESSAGE =
  "Thanks. Someone from Rugby Tyre Services will reply as soon as possible.";
const MOBILE_INTAKE_START =
  "I can help take the details for a mobile tyre service.\n\nFirst, what is your name?";

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
      current_state: context.conversation.current_state
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

function intakeData(context: ConversationFlowContext): Record<string, unknown> {
  return context.conversation.state_data && typeof context.conversation.state_data === "object"
    ? context.conversation.state_data
    : {};
}

function textOrUnknown(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function issueLabel(input: string): string {
  const map: Record<string, string> = {
    "1": "Flat tyre",
    "2": "Puncture",
    "3": "Slow leak",
    "4": "Tyre replacement",
    "5": "Other"
  };
  return map[input.trim()] ?? input.trim();
}

function locationTypeLabel(input: string): string {
  const map: Record<string, string> = {
    "1": "Home",
    "2": "Work",
    "3": "Roadside",
    "4": "Other"
  };
  return map[input.trim()] ?? input.trim();
}

function urgencyLabel(input: string) {
  const map: Record<string, "emergency" | "today" | "tomorrow" | "flexible"> = {
    "1": "emergency",
    "2": "today",
    "3": "tomorrow",
    "4": "flexible"
  };
  const cleaned = input.trim().toLowerCase();
  if (map[cleaned]) {
    return map[cleaned];
  }
  if (cleaned.includes("emergency") || cleaned.includes("as soon")) {
    return "emergency";
  }
  if (cleaned.includes("today")) {
    return "today";
  }
  if (cleaned.includes("tomorrow")) {
    return "tomorrow";
  }
  if (cleaned.includes("flex")) {
    return "flexible";
  }
  return "unknown";
}

function clearIntakePatch() {
  return {
    current_state: "menu",
    current_intent: null,
    failed_attempts: 0,
    state_data: null
  };
}

export class TyreConversationFlow implements ConversationFlow {
  constructor(
    private readonly tyreCatalogueRepository: TyreCatalogueRepository,
    private readonly jobRepository?: JobIntakeRepository
  ) {}

  private async handleCancellation(context: ConversationFlowContext): Promise<ConversationFlowResult> {
    if (!this.jobRepository) {
      return {
        replies: [HUMAN_HANDOFF_MESSAGE],
        conversationPatch: handoffPatch("cancellation_request_needs_human")
      };
    }

    const jobs = await this.jobRepository.findActiveJobsForCustomer(context.customer.id);
    if (jobs.length === 1) {
      await this.jobRepository.updateJobStatus(jobs[0].id, "cancellation_requested", {
        cancellation_reason: context.inbound.body
      });
      return {
        replies: [
          "I've sent your cancellation request to Rugby Tyre Services. They will confirm shortly."
        ],
        conversationPatch: {
          ...clearIntakePatch(),
          current_intent: "cancellation_request"
        },
        audit: {
          action: "job.cancellation_requested",
          metadata: { job_reference: jobs[0].job_reference }
        }
      };
    }

    return {
      replies: [HUMAN_HANDOFF_MESSAGE],
      conversationPatch: handoffPatch(
        jobs.length > 1 ? "multiple_active_jobs_cancellation_request" : "cancellation_request_no_active_job"
      )
    };
  }

  private async handleReschedule(context: ConversationFlowContext): Promise<ConversationFlowResult> {
    if (!this.jobRepository) {
      return {
        replies: [HUMAN_HANDOFF_MESSAGE],
        conversationPatch: handoffPatch("reschedule_request_needs_human")
      };
    }

    const jobs = await this.jobRepository.findActiveJobsForCustomer(context.customer.id);
    if (jobs.length === 1) {
      await this.jobRepository.updateJobStatus(jobs[0].id, "reschedule_requested");
      return {
        replies: ["What new date or time would you prefer?"],
        conversationPatch: {
          current_intent: "reschedule_request",
          current_state: "awaiting_reschedule_time",
          failed_attempts: 0,
          state_data: { reschedule_job_id: jobs[0].id }
        },
        audit: {
          action: "job.reschedule_requested",
          metadata: { job_reference: jobs[0].job_reference }
        }
      };
    }

    return {
      replies: [HUMAN_HANDOFF_MESSAGE],
      conversationPatch: handoffPatch(
        jobs.length > 1 ? "multiple_active_jobs_reschedule_request" : "reschedule_request_no_active_job"
      )
    };
  }

  private async handleRescheduleTime(context: ConversationFlowContext): Promise<ConversationFlowResult> {
    const data = intakeData(context);
    const jobId = textOrUnknown(data.reschedule_job_id);

    if (!this.jobRepository || !jobId) {
      return {
        replies: [HUMAN_HANDOFF_MESSAGE],
        conversationPatch: handoffPatch("reschedule_time_missing_job")
      };
    }

    await this.jobRepository.updateJobStatus(jobId, "reschedule_requested", {
      reschedule_requested_text: context.inbound.body
    });

    return {
      replies: ["Thanks. I've sent your preferred new time to Rugby Tyre Services. They will confirm shortly."],
      conversationPatch: {
        ...clearIntakePatch(),
        current_intent: "reschedule_request"
      }
    };
  }

  private async handleMobileIntake(context: ConversationFlowContext): Promise<ConversationFlowResult> {
    if (!this.jobRepository) {
      return {
        replies: [HUMAN_HANDOFF_MESSAGE],
        conversationPatch: handoffPatch("mobile_intake_unavailable")
      };
    }

    const state = context.conversation.current_state;
    const body = context.inbound.body.trim();
    const data = intakeData(context);

    if (!body && !context.inbound.mediaUrl && !context.inbound.locationLat) {
      return unknownRetry(context);
    }

    if (state === "awaiting_mobile_customer_name") {
      await this.jobRepository.updateCustomerName(context.customer.id, body);
      return {
        replies: ["What is your vehicle registration?"],
        conversationPatch: {
          current_state: "awaiting_mobile_vehicle_reg",
          failed_attempts: 0,
          state_data: { ...data, customer_name: body }
        }
      };
    }

    if (state === "awaiting_mobile_vehicle_reg") {
      return {
        replies: [
          "What tyre size do you need? For example, 205/55/R16. If you are not sure, you can send a photo of the tyre wall."
        ],
        conversationPatch: {
          current_state: "awaiting_mobile_tyre_size",
          failed_attempts: 0,
          state_data: { ...data, vehicle_registration: body.toUpperCase() }
        }
      };
    }

    if (state === "awaiting_mobile_tyre_size") {
      const tyreSize = normalizeTyreSize(body) ?? (context.inbound.mediaUrl ? "Photo of tyre wall sent" : body);
      return {
        replies: [
          "What is the issue?\n\n1. Flat tyre\n2. Puncture\n3. Slow leak\n4. Tyre replacement\n5. Other"
        ],
        conversationPatch: {
          current_state: "awaiting_mobile_issue_type",
          failed_attempts: 0,
          state_data: { ...data, tyre_size: tyreSize }
        }
      };
    }

    if (state === "awaiting_mobile_issue_type") {
      return {
        replies: ["Where is the vehicle?\n\nPlease send the address, postcode, or share your WhatsApp location."],
        conversationPatch: {
          current_state: "awaiting_mobile_location",
          failed_attempts: 0,
          state_data: { ...data, issue_type: issueLabel(body) }
        }
      };
    }

    if (state === "awaiting_mobile_location") {
      const hasLocation = context.inbound.locationLat !== undefined && context.inbound.locationLng !== undefined;
      return {
        replies: ["Is the vehicle at:\n\n1. Home\n2. Work\n3. Roadside\n4. Other"],
        conversationPatch: {
          current_state: "awaiting_mobile_location_type",
          failed_attempts: 0,
          state_data: {
            ...data,
            address_text: hasLocation ? body || "WhatsApp location shared" : body,
            location_lat: context.inbound.locationLat,
            location_lng: context.inbound.locationLng,
            location_source: hasLocation ? "whatsapp_location" : "typed_address"
          }
        }
      };
    }

    if (state === "awaiting_mobile_location_type") {
      return {
        replies: [
          "When would you like the service?\n\nYou can reply with something like today afternoon, tomorrow morning, or a specific time."
        ],
        conversationPatch: {
          current_state: "awaiting_mobile_preferred_time",
          failed_attempts: 0,
          state_data: { ...data, location_type: locationTypeLabel(body) }
        }
      };
    }

    if (state === "awaiting_mobile_preferred_time") {
      return {
        replies: ["Is this urgent?\n\n1. Emergency / as soon as possible\n2. Today\n3. Tomorrow\n4. Flexible"],
        conversationPatch: {
          current_state: "awaiting_mobile_urgency",
          failed_attempts: 0,
          state_data: { ...data, preferred_time_text: body }
        }
      };
    }

    if (state === "awaiting_mobile_urgency") {
      return {
        replies: ["Any extra notes for the shop? Reply NONE if not."],
        conversationPatch: {
          current_state: "awaiting_mobile_additional_notes",
          failed_attempts: 0,
          state_data: { ...data, urgency: urgencyLabel(body) }
        }
      };
    }

    if (state === "awaiting_mobile_additional_notes") {
      const urgency = textOrUnknown(data.urgency) ?? "unknown";
      const job = await this.jobRepository.createJob({
        customer_id: context.customer.id,
        customer_name: textOrUnknown(data.customer_name),
        conversation_id: context.conversation.id,
        vehicle_registration: textOrUnknown(data.vehicle_registration),
        tyre_size: textOrUnknown(data.tyre_size),
        job_type: urgency === "emergency" ? "emergency_mobile" : "mobile",
        source: "whatsapp",
        status: "awaiting_owner_confirmation",
        service_required: "Mobile tyre service",
        issue_description: textOrUnknown(data.issue_type),
        address_text: textOrUnknown(data.address_text),
        location_lat: typeof data.location_lat === "number" ? data.location_lat : undefined,
        location_lng: typeof data.location_lng === "number" ? data.location_lng : undefined,
        location_source: textOrUnknown(data.location_source),
        preferred_time_text: textOrUnknown(data.preferred_time_text),
        urgency: urgency as "emergency" | "today" | "tomorrow" | "flexible" | "unknown",
        payment_status: "pending",
        customer_notes: [
          textOrUnknown(data.location_type) ? `Location type: ${textOrUnknown(data.location_type)}` : undefined,
          body.toUpperCase() === "NONE" ? undefined : body
        ]
          .filter(Boolean)
          .join("\n")
      });

      return {
        replies: [
          "Thanks. Your mobile tyre request has been received.\n\nRugby Tyre Services will confirm availability and timing shortly."
        ],
        conversationPatch: {
          ...clearIntakePatch(),
          current_intent: "mobile_job_intake"
        },
        audit: {
          action: "job.created_from_whatsapp",
          metadata: { job_reference: job.job_reference, urgency }
        }
      };
    }

    return unknownRetry(context);
  }

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

    if (context.conversation.current_state === "awaiting_reschedule_time") {
      return this.handleRescheduleTime(context);
    }

    if (isCancellationIntent(body)) {
      return this.handleCancellation(context);
    }

    if (isRescheduleIntent(body)) {
      return this.handleReschedule(context);
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

    if (context.conversation.current_state.startsWith("awaiting_mobile_")) {
      return this.handleMobileIntake(context);
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
      return {
        replies: [MOBILE_INTAKE_START],
        conversationPatch: {
          status: "active",
          current_intent: "mobile_job_intake",
          current_state: "awaiting_mobile_customer_name",
          failed_attempts: 0,
          handoff_required: false,
          handoff_reason: null,
          state_data: {}
        }
      };
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
