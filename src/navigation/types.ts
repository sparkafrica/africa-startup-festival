import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Attendee } from "../services/ticketService";

export type RootStackParamList = {
  Login: undefined;
  VerificationCode: { email: string };
  Welcome: undefined;
  CompleteProfile: { step?: "personal" | "company" } | undefined;
  CompleteCompanyProfile: undefined;
  ProfileCreated: undefined;
  Home:
    | {
        /** FCM tap: show detail modal on Home without opening Notifications list. */
        openPushNotificationId?: number;
        openAppUpdateFromPush?: {
          title: string;
          description?: string;
          notificationId?: number;
          storeUrl?: string;
        };
      }
    | undefined;
  Attendees:
    | {
        /** Deeplink: open attendee profile sheet and highlight list row. */
        highlightUserId?: string;
      }
    | undefined;
  EventDetails: { eventId: string };
  Ticket: { ticketId: string };
  Favorites: undefined;
  Profile: undefined;
  Search: undefined;
  Menu: undefined;
  Notifications:
    | {
        openNotificationId?: number;
        /** Open app-update sheet (from FCM tap) with title/body from push data. */
        openAppUpdate?: {
          title: string;
          description?: string;
          notificationId?: number;
          storeUrl?: string;
        };
      }
    | undefined;
  ScanQR:
    | {
        initialTab?: "My Ticket" | "Scan Ticket";
        /** After tickets load, open the personal ticket QR modal (same as View QR Code). */
        openPersonalTicketQr?: boolean;
      }
    | undefined;
  ScannedAttendee: { attendee: Attendee } | undefined;
  Exhibitors: undefined;
  Partners: undefined;
  Speakers: undefined;
  Schedule:
    | {
        /** Scroll to and pulse this programme row (from Speakers → session tap). */
        highlightScheduleId?: number;
        highlightStage?: "main-stage" | "enterprise-stage";
      }
    | undefined;
  Meetings:
    | {
        primaryTab?: "requests" | "scheduled" | "cancelled";
        secondaryTab?: "inbound" | "outbound";
        /** Deeplink: scroll to and highlight this meeting row (~3s). */
        highlightMeetingId?: number;
      }
    | undefined;
  Messages:
    | {
        /** From push: open inbox first, then this thread (stack: Messages → Conversation). */
        openConversationId?: number;
        eventId?: number;
        otherPartyName?: string;
      }
    | undefined;
  Connections:
    | {
        /** Deeplink: scroll to and highlight this connection row (~3s). */
        highlightConnectionId?: number;
      }
    | undefined;
  Conversation: {
    eventId: number;
    conversationId: number;
    otherPartyName: string;
    otherPartyAvatarUri?: string;
  };
  CompanyDetail: { exhibitorId: string; type: "exhibitor" | "partner"; name?: string };
  Contact: undefined;
  Talent: undefined;
  PartnersOffers: undefined;
  AppGuide: undefined;
  ApiTest: undefined; // Temporary test screen - remove before production
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
