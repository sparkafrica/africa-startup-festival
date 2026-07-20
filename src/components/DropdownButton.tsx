import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { ListIcon, ChevronDownIcon } from "./icons";
import { FilterIcon } from "./HeaderIcons";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownButtonProps {
  label: string;
  icon?: "list" | "filter";
  options?: DropdownOption[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  onPress?: () => void;
  width?: "65%" | "30%";
}

export default function DropdownButton({
  label,
  icon = "list",
  options = [],
  selectedValue,
  onSelect,
  onPress,
  width = "65%",
}: DropdownButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const handlePress = () => {
    if (options && options.length > 0) {
      buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          top: pageY + height + 4,
          left: pageX,
          width: width,
        });
        setIsOpen(true);
      });
    } else if (onPress) {
      onPress();
    }
  };

  const handleSelect = (value: string) => {
    onSelect?.(value);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const displayLabel = selectedValue
    ? options.find((opt) => opt.value === selectedValue)?.label || label
    : label;

  return (
    <>
      <Pressable
        ref={buttonRef}
        onPress={handlePress}
        style={[
          styles.button,
          width === "65%" ? styles.button65 : styles.button30,
          width === "30%" && styles.buttonFilter,
        ]}
      >
        {icon === "list" ? (
          <ListIcon size={18} color="#404040" />
        ) : (
          <FilterIcon size={18} color="#404040" />
        )}
        <Text
          className="text-gray-900 font-medium text-sm"
          style={
            width === "30%"
              ? { marginLeft: 8, marginRight: 8 }
              : { marginLeft: 8, flex: 1 }
          }
        >
          {displayLabel}
        </Text>
        <ChevronDownIcon size={18} color="#404040" />
      </Pressable>

      {isOpen && options.length > 0 && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={handleClose}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.dropdown,
                  {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  },
                ]}
              >
                {options.map((option, index) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <React.Fragment key={option.value}>
                      <Pressable
                        onPress={() => handleSelect(option.value)}
                        style={[
                          styles.option,
                          isSelected && styles.optionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                      {index < options.length - 1 && (
                        <View style={styles.separator} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F5F5F5",
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button65: {
    flex: 0.65,
  },
  button30: {
    flex: 0.3,
  },
  buttonFilter: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: "#F5F5F5",
  },
  optionText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "400",
  },
  optionTextSelected: {
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
});
