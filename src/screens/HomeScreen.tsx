import React, { useState } from "react";
import { View, ScrollView, Pressable, Text } from "react-native";
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
  PartnerCard,
  SpeakerCard,
  BottomNavigation,
} from "../components";
import { ArrowUpRightIcon } from "../components/icons";
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

  const bottomNavItems = [
    {
      icon: (active: boolean) =>
        active ? (
          <HomeIconFilled size={24} color="#000000" />
        ) : (
          <HomeIcon size={24} color="#A3A3A3" />
        ),
      label: "Home",
      route: "Home",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <PeopleIconFilled size={24} color="#000000" />
        ) : (
          <PeopleIcon size={24} color="#A3A3A3" />
        ),
      label: "People",
      route: "People",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <CalendarIconFilled size={24} color="#000000" />
        ) : (
          <CalendarIcon size={24} color="#A3A3A3" />
        ),
      label: "Schedule",
      route: "Schedule",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <ClockIconFilled size={24} color="#000000" />
        ) : (
          <ClockIcon size={24} color="#A3A3A3" />
        ),
      label: "History",
      route: "History",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <HeartIconFilled size={24} color="#000000" />
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
            // badge="EVENT LIVE IN LAGOS"
            title="Welcome to ATE 2026"
            description="Complete your checklist and start booking 1:1 meetings with attendees and partners."
            buttonText="View venue map"
            gradient={gradients.sparkBlack}
            backgroundImage={require("../assets/images/left-card.jpg")}
            onPress={() => console.log("View venue map")}
          />
          <BannerCard
            // badge="PARTNER OFFERS"
            title="Review event perks"
            description="Get your ATE 2026 tickets for access to the event days"
            buttonText="See schedule meetings"
            gradient={gradients.partnerGreen}
            backgroundImage={require("../assets/images/right-card.jpg")}
            onPress={() => console.log("Browse offers")}
          />
        </ScrollView>

        {/* Body sections */}
        <View className="px-4">
          {/* Event Checklist Section */}
          <Card
            title="Event Checklist"
            description="Complete these to get the most out of the event."
            expandable
            expanded={checklistExpanded}
            onToggle={() => setChecklistExpanded(!checklistExpanded)}
            className="mb-4"
          >
            {/* Checklist */}
            <View>
              <ChecklistItem
                title="Connect with attendees"
                description="Swipe or search attendees that match your goals."
                completed={true}
              />
              <ChecklistItem
                title="Request a meetings"
                description="Book focused 20-minute meetings with people you care about."
                completed={false}
              />
              <ChecklistItem
                title="Add sessions to your schedule"
                description="Add sessions so you never miss a talk."
                completed={true}
              />
            </View>
          </Card>

          {/* Exhibitors Section */}
          <Card
            title="Exhibitors"
            description="Tap a logo to view full profile, perks and job opportunities."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            {/* Exhibitors */}
            <View className="flex-row flex-wrap -mx-1.5">
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="Kora"
                  logoColor="#2762C7"
                  onPress={() => console.log("kora pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="Uber"
                  logoColor="#000000"
                  onPress={() => console.log("Uber pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="MTN"
                  logoColor="#FFC107"
                  onPress={() => console.log("MTN pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="Zoko"
                  logoColor="#E91E63"
                  onPress={() => console.log("Zoko pressed")}
                />
              </View>
            </View>
            <Pressable
              onPress={() => console.log("View all Exhibitors")}
              className="bg-black rounded-xl py-4 px-6 flex-row items-center justify-center mt-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text className="text-white font-semibold text-base px-2">
                View all Exhibitors
              </Text>
              <ArrowUpRightIcon size={18} color="#FFFFFF" />
            </Pressable>
          </Card>

          {/* Partners Section */}
          <Card
            title="Partners"
            description="Tap a logo to view full profile, perks and job opportunities."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            <View className="flex-row flex-wrap -mx-1.5">
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="Kora"
                  logoColor="#2762C7"
                  onPress={() => console.log("Kora pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="Uber"
                  logoColor="#000000"
                  onPress={() => console.log("Uber pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="MTN"
                  logoColor="#FFC107"
                  onPress={() => console.log("MTN pressed")}
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="ZOHO"
                  logoColor="#E91E63"
                  onPress={() => console.log("ZOHO pressed")}
                />
              </View>
            </View>
            <Pressable
              onPress={() => console.log("View all Partners")}
              className="bg-black rounded-xl py-4 px-6 flex-row items-center justify-center mt-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text className="text-white font-semibold text-base px-2">
                View all Partners
              </Text>
              <ArrowUpRightIcon size={18} color="#FFFFFF" />
            </Pressable>
          </Card>

          {/* Speakers Section */}
          <Card
            title="Speakers"
            description="Tap a logo to view full profile, perks and job opportunities."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            <View className="flex-row flex-wrap -mx-1.5">
              <View className="px-1.5 mb-3" style={{ width: "50%" }}>
                <SpeakerCard
                  name="Sarah Johnson"
                  role="Tech Lead at Google"
                  avatarColor="#2762C7"
                  onPress={() => console.log("Sarah Johnson pressed")}
                />
              </View>
              <View className="px-1.5 mb-3" style={{ width: "50%" }}>
                <SpeakerCard
                  name="Michael Chen"
                  role="CEO at StartupX"
                  avatarColor="#1BB273"
                  onPress={() => console.log("Michael Chen pressed")}
                />
              </View>
              <View className="px-1.5 mb-3" style={{ width: "50%" }}>
                <SpeakerCard
                  name="Emily Davis"
                  role="Product Designer"
                  avatarColor="#9333EA"
                  onPress={() => console.log("Emily Davis pressed")}
                />
              </View>
              <View className="px-1.5 mb-3" style={{ width: "50%" }}>
                <SpeakerCard
                  name="David Wilson"
                  role="Engineering Manager"
                  avatarColor="#F97316"
                  onPress={() => console.log("David Wilson pressed")}
                />
              </View>
            </View>
            <Pressable
              onPress={() => console.log("View all Speakers")}
              className="bg-black rounded-xl py-4 px-6 flex-row items-center justify-center mt-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text className="text-white font-semibold text-base px-2">
                View all Speakers
              </Text>
              <ArrowUpRightIcon size={18} color="#FFFFFF" />
            </Pressable>
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
