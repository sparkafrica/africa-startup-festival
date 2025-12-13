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
import EventChecklist from "../components/EventChecklist";
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

  // TODO: Replace with backend data - check if there are unread notifications
  // This would typically come from an API call or context/state management
  const [hasUnreadNotifications] = useState(false);

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
      label: "Attendees",
      route: "Attendees",
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
      label: "Meetings",
      route: "Meetings",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <HeartIconFilled size={24} color="#000000" />
        ) : (
          <HeartIcon size={24} color="#A3A3A3" />
        ),
      label: "Connections",
      route: "Connections",
    },
  ];

  return (
    <View className="flex-1 bg-surface">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
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
            buttonText="View attendees"
            gradient={gradients.sparkBlack}
            backgroundImage={require("../assets/images/left-card.jpg")}
            // backgroundImage={{
            //   uri: "https://res.cloudinary.com/dznd7vzlb/image/upload/v1765286724/DSC_5673_left_card_img_jou0ok.jpg"
            // }}
            onPress={() => console.log("View attendees")}
          />
          <BannerCard
            // badge="PARTNER OFFERS"
            title="Review event schedule"
            description="Get your ATE 2026 itinerary ready ahead of the event day"
            buttonText="See schedule"
            gradient={gradients.partnerGreen}
            backgroundImage={require("../assets/images/right-card.jpg")}
            // backgroundImage={{
            //   uri: "https://res.cloudinary.com/dznd7vzlb/image/upload/v1765286711/DSC_5145_right_card_img_gqppcl.jpg"
            // }}
            onPress={() => console.log("See schedule")}
          />
        </ScrollView>

        {/* Body sections */}
        <View className="px-4">
          {/* Event Checklist Section */}
          <EventChecklist
            title="Event Checklist"
            description="Complete these to get the most out of the event."
            expanded={checklistExpanded}
            onToggle={() => setChecklistExpanded(!checklistExpanded)}
            className="mb-4"
          >
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
          </EventChecklist>

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
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "kora",
                      name: "Kora",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="Uber"
                  logoColor="#000000"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "uber",
                      name: "Uber",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="MTN"
                  logoColor="#FFC107"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "mtn",
                      name: "MTN",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <ExhibitorCard
                  name="Zoko"
                  logoColor="#E91E63"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "zoko",
                      name: "Zoko",
                    })
                  }
                />
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Exhibitors")}
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
            <View className="flex-row flex-wrap -mx-1.5 ">
              <View className="px-1.5 mb-2 " style={{ width: "50%" }}>
                <PartnerCard
                  name="Kora"
                  logoColor="#2762C7"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "kora",
                      name: "Kora",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="Uber"
                  logoColor="#000000"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "uber",
                      name: "Uber",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="MTN"
                  logoColor="#FFC107"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "mtn",
                      name: "MTN",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-2" style={{ width: "50%" }}>
                <PartnerCard
                  name="ZOHO"
                  logoColor="#E91E63"
                  onPress={() =>
                    navigation.navigate("CompanyDetail", {
                      exhibitorId: "zoho",
                      name: "ZOHO",
                    })
                  }
                />
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Partners")}
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
            description="Tap an image to view full profile of each speaker."
            expandable={false}
            expanded={true}
            className="mb-4"
          >
            <View className="flex-row flex-wrap -mx-1.5">
              <View className="px-1.5 mb-3" style={{ width: "100%" }}>
                <SpeakerCard
                  name="Sarah Johnson"
                  role="Tech Lead at Google"
                  avatar={{ uri: "https://i.pravatar.cc/150?img=1" }}
                  avatarColor="#2762C7"
                  variant="horizontal"
                  onPress={() =>
                    navigation.navigate("SpeakerDetail", {
                      speakerId: "sarah-johnson",
                      name: "Sarah Johnson",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-3" style={{ width: "100%" }}>
                <SpeakerCard
                  name="Michael Chen"
                  role="CEO at StartupX"
                  avatar={{ uri: "https://i.pravatar.cc/150?img=12" }}
                  avatarColor="#1BB273"
                  variant="horizontal"
                  onPress={() =>
                    navigation.navigate("SpeakerDetail", {
                      speakerId: "michael-chen",
                      name: "Michael Chen",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-3" style={{ width: "100%" }}>
                <SpeakerCard
                  name="Emily Davis"
                  role="Product Designer"
                  avatar={{ uri: "https://i.pravatar.cc/150?img=47" }}
                  avatarColor="#9333EA"
                  variant="horizontal"
                  onPress={() =>
                    navigation.navigate("SpeakerDetail", {
                      speakerId: "emily-davis",
                      name: "Emily Davis",
                    })
                  }
                />
              </View>
              <View className="px-1.5 mb-3" style={{ width: "100%" }}>
                <SpeakerCard
                  name="David Wilson"
                  role="Engineering Manager"
                  avatar={{ uri: "https://i.pravatar.cc/150?img=33" }}
                  avatarColor="#F97316"
                  variant="horizontal"
                  onPress={() =>
                    navigation.navigate("SpeakerDetail", {
                      speakerId: "david-wilson",
                      name: "David Wilson",
                    })
                  }
                />
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate("Speakers")}
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
            if (route === "Home") {
              // Already on Home screen
            } else if (route === "Attendees") {
              navigation.navigate("Attendees");
            } else if (route === "Schedule") {
              navigation.navigate("Schedule");
            } else if (route === "Meetings") {
              navigation.navigate("Meetings");
            } else if (route === "Connections") {
              navigation.navigate("Connections");
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}
