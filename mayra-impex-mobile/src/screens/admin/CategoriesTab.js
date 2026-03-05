import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoryAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";

const CategoriesTab = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const {
    data: categoriesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["allCategories"],
    queryFn: categoryAPI.getAll,
    retry: 0,
    staleTime: 60000,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name || "",
      description: category.description || "",
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCategory(null);
    setNewCategory({ name: "", description: "" });
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert("Validation Error", "Category name is required");
      return;
    }

    setIsAdding(true);
    try {
      if (editingCategory) {
        await categoryAPI.create({
          ...newCategory,
          id: editingCategory.id,
        });
        Alert.alert("Success", "Category updated successfully!");
      } else {
        await categoryAPI.create(newCategory);
        Alert.alert("Success", "Category added successfully!");
      }
      handleCloseModal();
      refetch();
    } catch (err) {
      Alert.alert(
        "Error",
        err.message ||
          `Failed to ${editingCategory ? "update" : "add"} category`,
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = (categoryId) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await categoryAPI.delete(categoryId);
              Alert.alert("Success", "Category deleted successfully!");
              refetch();
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete category");
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: currentTheme.text }}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>⚠️</Text>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          Failed to load categories
        </Text>
        <Text style={[styles.emptySubtext, { color: currentTheme.textLight }]}>
          {error.message || "Please check your connection and try again"}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={[
            styles.retryButton,
            { backgroundColor: currentTheme.primary },
          ]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = categoriesData?.categories || categoriesData?.data || [];

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.border,
        }}
      >
        <Text
          style={[styles.productsTitle, { color: currentTheme.text, flex: 1 }]}
        >
          All Categories ({categories.length})
        </Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🏷️</Text>
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            No categories found
          </Text>
          <Text
            style={[styles.emptySubtext, { color: currentTheme.textLight }]}
          >
            Click the + button above to add categories
          </Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[currentTheme.primary]}
              tintColor={currentTheme.primary}
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.productCard,
                { backgroundColor: currentTheme.cardBackground },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.productName, { color: currentTheme.text }]}
                >
                  {item.name}
                </Text>
                {item.description && (
                  <Text
                    style={[
                      styles.productDescription,
                      { color: currentTheme.textLight },
                    ]}
                  >
                    {item.description}
                  </Text>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: SPACING.lg,
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => handleEditCategory(item)}
                  style={[styles.iconButton, { backgroundColor: "#3b82f6" }]}
                >
                  <Ionicons name="create-outline" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(item.id)}
                  style={[styles.iconButton, { backgroundColor: "#ef4444" }]}
                >
                  <Ionicons name="trash-outline" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: currentTheme.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: currentTheme.border },
            ]}
          >
            <TouchableOpacity onPress={handleCloseModal}>
              <Text style={{ fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.lg }}
          >
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                Category Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                  },
                ]}
                placeholder="Enter category name"
                placeholderTextColor={currentTheme.textLight}
                value={newCategory.name}
                onChangeText={(text) =>
                  setNewCategory({ ...newCategory, name: text })
                }
              />
            </View>

            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={[styles.inputLabel, { color: currentTheme.text }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.cardBackground,
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                    minHeight: 80,
                  },
                ]}
                placeholder="Enter category description"
                placeholderTextColor={currentTheme.textLight}
                multiline
                numberOfLines={4}
                value={newCategory.description}
                onChangeText={(text) =>
                  setNewCategory({ ...newCategory, description: text })
                }
              />
            </View>
          </ScrollView>

          <View
            style={[
              styles.modalFooter,
              { borderTopColor: currentTheme.border },
            ]}
          >
            <TouchableOpacity
              onPress={handleCloseModal}
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.border },
              ]}
            >
              <Text style={{ color: currentTheme.text, fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCategory}
              disabled={isAdding}
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.primary },
              ]}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {isAdding ? "Saving..." : editingCategory ? "Update" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    textAlign: "center",
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: FONTS.sizes.sm,
  },
  productsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
  },
  productCard: {
    flexDirection: "row",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  productName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  productDescription: {
    fontSize: FONTS.sizes.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: "600",
    marginBottom: SPACING.sm,
  },
  input: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    fontSize: FONTS.sizes.md,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
});

export default CategoriesTab;
