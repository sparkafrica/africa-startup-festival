import type { NativeStackScreenProps } from "@react-navigation/native-stack";

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
  Notifications: undefined;
  ScanQR: { initialTab?: "My Ticket" | "Scan Ticket" } | undefined;
  Exhibitors: undefined;
  Partners: undefined;
  Speakers: undefined;
  Schedule: undefined;
  Meetings: undefined;
  Connections: undefined;
  CompanyDetail: { exhibitorId: string; name?: string };
  SpeakerDetail: { speakerId: string; name?: string };
  Contact: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
