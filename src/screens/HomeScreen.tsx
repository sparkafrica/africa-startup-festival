import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { gradients } from "../theme/theme";
import {
  HeaderBar,
  BannerCard,
  Card,
  ChecklistItem,
  ExhibitorCard,
  BottomNavigation,
} from "../components";
import {
  HomeIcon,
  HomeIconFilled,
  PeopleIcon,
  PeopleIconFilled,
  CalendarIcon,
  CalendarIconFilled,
  ClockIcon,
  ClockIconFilled,
  HeartIcon,
  HeartIconFilled,
} from "../components/BottomNavIcons";

export default function HomeScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const [checklistExpanded, setChecklistExpanded] = useState(true);
  const [exhibitorsExpanded, setExhibitorsExpanded] = useState(true);

  const bottomNavItems = [
    {
      icon: (active: boolean) =>
        active ? (
          <HomeIconFilled size={24} color="#0284C7" />
        ) : (
          <HomeIcon size={24} color="#A3A3A3" />
        ),
      label: "Home",
      route: "Home",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <PeopleIconFilled size={24} color="#0284C7" />
        ) : (
          <PeopleIcon size={24} color="#A3A3A3" />
        ),
      label: "People",
      route: "People",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <CalendarIconFilled size={24} color="#0284C7" />
        ) : (
          <CalendarIcon size={24} color="#A3A3A3" />
        ),
      label: "Schedule",
      route: "Schedule",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <ClockIconFilled size={24} color="#0284C7" />
        ) : (
          <ClockIcon size={24} color="#A3A3A3" />
        ),
      label: "History",
      route: "History",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <HeartIconFilled size={24} color="#0284C7" />
        ) : (
          <HeartIcon size={24} color="#A3A3A3" />
        ),
      label: "Favorites",
      route: "Favorites",
    },
  ];

  return (
    <View className="flex-1 bg-surface">
      <HeaderBar
        onScanPress={() => console.log("Scan pressed")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Banners - Horizontal Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 pt-4 pb-3"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <BannerCard
            badge="EVENT LIVE IN LAGOS"
            title="Welcome to Spark 2026"
            description="Complete your checklist and start booking 1:1 meetings with attendees and partners."
            buttonText="View venue map"
            gradient={gradients.sparkBlue}
            onPress={() => console.log("View venue map")}
          />
          <BannerCard
            badge="PARTNER OFFERS"
            title="Unlock exclusive perks"
            description="Get discounts, cashback and special offers from exhibiting partners."
            buttonText="Browse offers"
            gradient={gradients.partnerGreen}
            onPress={() => console.log("Browse offers")}
          />
        </ScrollView>

        {/* Event Checklist Section */}
        <View className="px-4">
          <Card
            title="Event Checklist"
            description="Complete these to get the most out of the event."
            expandable
            expanded={checklistExpanded}
            onToggle={() => setChecklistExpanded(!checklistExpanded)}
            className="mb-4"
          >
            <View>
              <ChecklistItem
                title="Connect with attendees"
                description="Swipe or search attendees that match your goals."
              />
              <ChecklistItem
                title="Book meetings"
                description="Book focused 20-minute meetings with people you care about."
              />
              <ChecklistItem
                title="Add sessions to your schedule"
                description="Add sessions so you never miss a talk."
              />
            </View>
          </Card>

          {/* Exhibitors Section */}
          <Card
            title="Exhibitors"
            description="Tap a logo to view full profile, perks and job opportunities."
            expandable
            expanded={exhibitorsExpanded}
            onToggle={() => setExhibitorsExpanded(!exhibitorsExpanded)}
            className="mb-4"
          >
            <View className="flex-row flex-wrap -mx-1.5">
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  logo={require("../assets/logos/easytax.png")}
                  onPress={() => console.log("EasyTax pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  logo={require("../assets/logos/quantun2.png")}
                  onPress={() => console.log("Quantum² pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  logo={require("../assets/logos/leapyear.png")}
                  onPress={() => console.log("Leapyear pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  logo={require("../assets/logos/pollinate.png")}
                  onPress={() => console.log("Pollinate pressed")}
                />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Home"
          onNavigate={(route) => {
            if (route === "Favorites") {
              navigation.navigate("Favorites");
            } else if (route === "People") {
              navigation.navigate("People");
            } else if (route === "Home") {
              // Already on Home screen
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}
