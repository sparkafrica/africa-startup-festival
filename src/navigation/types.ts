import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  People: undefined;
  EventDetails: { eventId: string };
  Ticket: { ticketId: string };
  Favorites: undefined;
  Profile: undefined;
  Search: undefined;
  Menu: undefined;
  Notifications: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

