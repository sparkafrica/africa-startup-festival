import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  type ImageStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "../theme/theme";
import LoadingSpinner from "./LoadingSpinner";

const ASF_LOGO = require("../assets/images/logo.png");

/** Tune logo size / visibility here (does not shift text — logo is overlay-only). */
const LOGO_WIDTH = 200;
const LOGO_OPACITY = 0.50;

export interface ConnectionsExportBannerProps {
  onDownload: () => void;
  downloading?: boolean;
}

export default function ConnectionsExportBanner({
  onDownload,
  downloading = false,
}: ConnectionsExportBannerProps) {
  const logoStyle = StyleSheet.flatten([
    styles.logoAccent,
    {
      width: LOGO_WIDTH,
      height: LOGO_WIDTH * 0.80,
      marginTop: -(LOGO_WIDTH * 0.035),
      marginLeft: -(LOGO_WIDTH * 0.50),
      marginRight: -(LOGO_WIDTH * 0.280),
      opacity: LOGO_OPACITY,
      blendMode: "screen",
    } as ImageStyle,
  ]);

  return (
    <View className="px-4 pb-2">
      <LinearGradient
        colors={gradients.sparkBlack as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* logo.png has a black fill — screen blend drops the black on this card */}
        <Image
          source={ASF_LOGO}
          style={logoStyle}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View style={styles.content} pointerEvents="box-none">
          <Text style={styles.title}>Your ASF connections</Text>
          <Text style={styles.description}>
            Download everyone you connected with at{" "}
            <Text style={styles.highlight}>Africa Startup Festival</Text> — keep
            building relationships after the event.
          </Text>
          <Pressable
            onPress={onDownload}
            disabled={downloading}
            style={[styles.button, downloading && styles.buttonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Download connections"
          >
            {downloading ? (
              <LoadingSpinner size="small" color="#000000" />
            ) : (
              <Text style={styles.buttonText}>Download connections</Text>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const PARTNER_GREEN = "#1BB273";

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  logoAccent: {
    position: "absolute",
    right: 8,
    top: "50%",
    zIndex: 0,
  },
  content: {
    zIndex: 1,
    position: "relative",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.92)",
    marginBottom: 16,
  },
  highlight: {
    color: PARTNER_GREEN,
    fontWeight: "600",
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: PARTNER_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
});
