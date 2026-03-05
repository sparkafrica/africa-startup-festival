import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Attendee } from "../services/ticketService";

export type RootStackParamList = {
  Login: undefined;
  VerificationCode: { email: string };
  Welcome: undefined;
  CompleteProfile: { step?: "personal" | "company" } | undefined;
  CompleteCompanyProfile: undefined;
  ProfileCreated: undefined;
  Home: undefined;
  Attendees: undefined;
  EventDetails: { eventId: string };
  Ticket: { ticketId: string };
  Favorites: undefined;
  Profile: undefined;
  Search: undefined;
  Menu: undefined;
  Notifications: { openNotificationId?: number } | undefined;
  ScanQR: { initialTab?: "My Ticket" | "Scan Ticket" } | undefined;
  ScannedAttendee: { attendee: Attendee } | undefined;
  Exhibitors: undefined;
  Partners: undefined;
  Speakers: undefined;
  Schedule: undefined;
  Meetings:
    | {
        primaryTab?: "requests" | "scheduled" | "cancelled";
        secondaryTab?: "inbound" | "outbound";
      }
    | undefined;
  Connections: undefined;
  CompanyDetail: { exhibitorId: string; type: "exhibitor" | "partner"; name?: string };
  SpeakerDetail: { speakerId: string; name?: string };
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
