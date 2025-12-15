import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarIcon } from "./BottomNavIcons";
import { CloseIcon } from "./MenuIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100; // Minimum drag distance to close

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterCategory {
  id: string;
  title: string;
  options: FilterOption[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (selectedFilters: string[]) => void;
  categories: FilterCategory[];
  initialSelected?: string[];
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  categories,
  initialSelected = [],
}: FilterModalProps) {
  const [selectedFilters, setSelectedFilters] =
    useState<string[]>(initialSelected);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward drags with sufficient movement
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        // If dragged down enough, close the modal
        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(SCREEN_HEIGHT);
            onClose();
          });
        } else {
          // Spring back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  // Sync selectedFilters with initialSelected when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedFilters(initialSelected);
      // Smooth entrance animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, initialSelected, translateY]);

  const toggleFilter = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleClearAll = () => {
    setSelectedFilters([]);
  };

  const handleApply = () => {
    onApply(selectedFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Semi-transparent Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: translateY }],
            },
          ]}
        >
          {/* Draggable Handle and Header Area */}
          <View style={styles.draggableArea} {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Title */}
            <View style={styles.header}>
              <Text style={styles.title}>Filter</Text>
            </View>
          </View>

          {/* Filter Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {categories.map((category) => {
              const selectedOptions = category.options.filter((option) =>
                selectedFilters.includes(option.id)
              );
              const unselectedOptions = category.options.filter(
                (option) => !selectedFilters.includes(option.id)
              );
              const isDaysCategory =
                category.id === "day" || category.id === "days";

              return (
                <View key={category.id} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>

                  {/* Selected Filters - Shown immediately below category title */}
                  {selectedOptions.length > 0 && (
                    <View style={styles.selectedFiltersContainer}>
                      {selectedOptions.map((option) => (
                        <Pressable
                          key={option.id}
                          style={styles.selectedFilterChip}
                          onPress={() => toggleFilter(option.id)}
                        >
                          {isDaysCategory && (
                            <CalendarIcon size={16} color="#FFFFFF" />
                          )}
                          <Text style={styles.selectedFilterText}>
                            {option.label}
                          </Text>
                          <CloseIcon size={14} color="#FFFFFF" />
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Available Filters */}
                  {unselectedOptions.length > 0 && (
                    <View style={styles.optionsGrid}>
                      {unselectedOptions.map((option) => (
                        <Pressable
                          key={option.id}
                          style={styles.filterOption}
                          onPress={() => toggleFilter(option.id)}
                        >
                          {isDaysCategory && (
                            <CalendarIcon size={16} color="#000000" />
                          )}
                          <Text style={styles.filterOptionText}>
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Action Buttons */}
          <SafeAreaView
            edges={["bottom"]}
            style={[styles.actionsContainer, { marginBottom: 20 }]} // lifted up by 20px
          >
            <Pressable style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                Apply Filters{" "}
                {selectedFilters.length > 0 && `(${selectedFilters.length})`}
              </Text>
            </Pressable>
            <Pressable style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    flexDirection: "column",
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  draggableArea: {
    width: "100%",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#171717",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  selectedFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    marginHorizontal: -4,
  },
  selectedFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#000000",
    marginHorizontal: 4,
    marginBottom: 8,
    gap: 6,
  },
  selectedFilterText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 4,
    marginBottom: 8,
    gap: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "400",
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  applyButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  clearButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
});
