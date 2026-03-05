import React from "react";
import AppNavigator from "./AppNavigator";

// Kept as a compatibility wrapper because App.js imports ModernNavigator.
const ModernNavigator = () => <AppNavigator />;

export default ModernNavigator;
