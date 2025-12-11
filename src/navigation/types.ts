import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Attendees: undefined;
  EventDetails: { eventId: string };
  Ticket: { ticketId: string };
  Favorites: undefined;
  Profile: undefined;
  Search: undefined;
  Menu: undefined;
  Notifications: undefined;
  ScanQR: undefined;
  Exhibitors: undefined;
  Partners: undefined;
  Speakers: undefined;
  Schedule: undefined;
  Meetings: undefined;
  Connections: undefined;
  CompanyDetail: { exhibitorId: string; name?: string };
  SpeakerDetail: { speakerId: string; name?: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
