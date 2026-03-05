import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BottomNavigation = ({ state, navigation }) => {
  const icons = {
    Home: "home",
    Search: "search",
    Products: "cube",
    Notifications: "notifications",
    Profile: "person",
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  isFocused ? icons[route.name] : `${icons[route.name]}-outline`
                }
                size={24}
                color={isFocused ? "#FF8C50" : "#999"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
});

export default BottomNavigation;
