/**
 * AdminFeatures.js - Comprehensive admin dashboard features
 * Includes: Search, Filter, Sort, Bulk Operations, Export, Customer Notes, etc.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SPACING, FONTS, RADIUS } from "../../constants";

// SEARCH COMPONENT
export const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search...",
  theme,
}) => (
  <View style={{ marginBottom: SPACING.md }}>
    <TextInput
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        color: theme.text,
        paddingLeft: 40,
      }}
      placeholder={placeholder}
      placeholderTextColor={theme.textLight}
      value={value}
      onChangeText={onChangeText}
    />
    <Text
      style={{
        position: "absolute",
        left: SPACING.md,
        top: SPACING.sm,
        fontSize: 18,
      }}
    >
      🔍
    </Text>
  </View>
);

// FILTER COMPONENT
export const FilterBar = ({ filters, activeFilter, onSelectFilter, theme }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ gap: SPACING.sm, paddingHorizontal: SPACING.md }}
  >
    {filters.map((filter) => (
      <TouchableOpacity
        key={filter.id}
        onPress={() => onSelectFilter(filter.id)}
        style={{
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          borderRadius: RADIUS.md,
          backgroundColor:
            activeFilter === filter.id ? theme.primary : theme.cardBackground,
          borderWidth: 1,
          borderColor:
            activeFilter === filter.id ? theme.primary : theme.border,
        }}
      >
        <Text
          style={{
            color: activeFilter === filter.id ? "white" : theme.text,
            fontWeight: activeFilter === filter.id ? "700" : "600",
          }}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// SORT COMPONENT
export const SortOptions = ({ value, options, onSelect, theme }) => (
  <View style={{ marginBottom: SPACING.md }}>
    <Text
      style={{
        color: theme.textLight,
        marginBottom: SPACING.sm,
        fontSize: FONTS.sizes.sm,
        fontWeight: "600",
      }}
    >
      Sort By:
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: SPACING.sm }}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: RADIUS.md,
            backgroundColor:
              value === option.value ? theme.primary : theme.cardBackground,
            borderWidth: 1,
            borderColor: value === option.value ? theme.primary : theme.border,
          }}
        >
          <Text
            style={{
              color: value === option.value ? "white" : theme.text,
              fontWeight: value === option.value ? "700" : "600",
              fontSize: FONTS.sizes.sm,
            }}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// BULK SELECT COMPONENT
export const BulkSelectHeader = ({
  isSelecting,
  selectedCount,
  onToggleSelectAll,
  onConfirmAction,
  onCancel,
  theme,
  actionLabel = "Delete",
}) => {
  if (!isSelecting) return null;

  return (
    <View
      style={{
        backgroundColor: theme.primary,
        padding: SPACING.md,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
        borderRadius: RADIUS.md,
      }}
    >
      <Text style={{ color: "white", fontWeight: "700" }}>
        {selectedCount} selected
      </Text>
      <View style={{ flexDirection: "row", gap: SPACING.sm }}>
        <TouchableOpacity
          onPress={onCancel}
          style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: RADIUS.md,
            backgroundColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "600",
              fontSize: FONTS.sizes.sm,
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirmAction}
          style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: RADIUS.md,
            backgroundColor: "#ef4444",
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "600",
              fontSize: FONTS.sizes.sm,
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// EXPORT CSV COMPONENT
export const ExportButton = ({ data, fileName, filename, theme, onExport }) => {
  const [exporting, setExporting] = useState(false);
  const exportName = filename || fileName || "export";

  const generateCSV = async () => {
    if (!data || data.length === 0) {
      Alert.alert("No Data", "Nothing to export");
      return;
    }

    if (onExport) {
      try {
        setExporting(true);
        await onExport();
      } catch (error) {
        Alert.alert("Export Failed", error?.message || "Please try again");
      } finally {
        setExporting(false);
      }
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(","),
      ),
    ].join("\n");

    // In a real app, you would share this or save it
    Alert.alert(
      "Export Ready",
      `${exportName}.csv generated:\n\n${csv.substring(0, 100)}...`,
    );
  };

  return (
    <TouchableOpacity
      onPress={generateCSV}
      disabled={exporting}
      style={{
        backgroundColor: theme.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
        opacity: exporting ? 0.7 : 1,
      }}
    >
      {exporting ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text style={{ fontSize: 18 }}>📥</Text>
      )}
      <Text
        style={{ color: "white", fontWeight: "700", fontSize: FONTS.sizes.md }}
      >
        {exporting ? "Exporting..." : "Export CSV"}
      </Text>
    </TouchableOpacity>
  );
};

// CUSTOMER NOTES MODAL
export const CustomerNotesModal = ({
  visible,
  customerId,
  onClose,
  theme,
  notesAPI,
}) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const response = await notesAPI.getNotes(customerId);
      setNotes(response.data || []);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      Alert.alert("Empty Note", "Please enter a note");
      return;
    }

    try {
      await notesAPI.addNote({
        customerId,
        note: newNote,
        adminId: "current-user-id",
      });
      setNewNote("");
      loadNotes();
      Alert.alert("Success", "Note added");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    Alert.alert("Delete Note", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await notesAPI.deleteNote(noteId);
            loadNotes();
          } catch (error) {
            Alert.alert("Error", "Failed to delete note");
          }
        },
      },
    ]);
  };

  React.useEffect(() => {
    if (visible) loadNotes();
  }, [visible, customerId]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: theme.cardBackground,
            borderTopLeftRadius: RADIUS.xl,
            borderTopRightRadius: RADIUS.xl,
            padding: SPACING.lg,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: SPACING.md,
            }}
          >
            <Text
              style={{
                fontSize: FONTS.sizes.lg,
                fontWeight: "700",
                color: theme.text,
              }}
            >
              📝 Customer Notes
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: theme.background,
                  padding: SPACING.md,
                  marginBottom: SPACING.md,
                  borderRadius: RADIUS.md,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, marginBottom: SPACING.xs }}>
                    {item.note}
                  </Text>
                  <Text
                    style={{ color: theme.textLight, fontSize: FONTS.sizes.xs }}
                  >
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
            scrollEnabled
            nestedScrollEnabled
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <Text
                  style={{
                    color: theme.textLight,
                    textAlign: "center",
                    padding: SPACING.md,
                  }}
                >
                  No notes yet
                </Text>
              )
            }
          />

          <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                color: theme.text,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholder="Add a note..."
              placeholderTextColor={theme.textLight}
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />
            <TouchableOpacity
              onPress={handleAddNote}
              style={{
                backgroundColor: theme.primary,
                paddingVertical: SPACING.md,
                borderRadius: RADIUS.md,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                Add Note
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// INVENTORY MANAGEMENT COMPONENT
export const InventoryManager = ({ productId, theme, inventoryAPI }) => {
  const [quantity, setQuantity] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleUpdateQuantity = async () => {
    if (!quantity || isNaN(quantity)) {
      Alert.alert("Invalid Input", "Please enter a valid quantity");
      return;
    }

    setLoading(true);
    try {
      await inventoryAPI.updateQuantity({
        productId,
        quantity: parseInt(quantity),
      });
      Alert.alert("Success", "Inventory updated");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        marginTop: SPACING.lg,
        padding: SPACING.md,
        backgroundColor: theme.background,
        borderRadius: RADIUS.md,
      }}
    >
      <Text
        style={{
          color: theme.text,
          fontWeight: "700",
          marginBottom: SPACING.md,
        }}
      >
        📦 Inventory Management
      </Text>
      <View style={{ flexDirection: "row", gap: SPACING.md }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: RADIUS.md,
            paddingHorizontal: SPACING.md,
            color: theme.text,
          }}
          placeholder="Quantity"
          placeholderTextColor={theme.textLight}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
        />
        <TouchableOpacity
          onPress={handleUpdateQuantity}
          disabled={loading}
          style={{
            backgroundColor: theme.primary,
            paddingHorizontal: SPACING.lg,
            borderRadius: RADIUS.md,
            justifyContent: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "700" }}>Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// LOW STOCK ALERTS COMPONENT
export const LowStockAlerts = ({ alerts, theme }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <View
      style={{
        marginBottom: SPACING.lg,
        padding: SPACING.md,
        backgroundColor: "#fee2e2",
        borderRadius: RADIUS.md,
      }}
    >
      <Text
        style={{
          color: "#dc2626",
          fontWeight: "700",
          marginBottom: SPACING.sm,
        }}
      >
        ⚠️ Low Stock Alert ({alerts.length} items)
      </Text>
      {alerts.slice(0, 3).map((item) => (
        <Text
          key={item.product_id}
          style={{ color: "#991b1b", fontSize: FONTS.sizes.sm }}
        >
          • {item.products?.name}: {item.quantity} units
        </Text>
      ))}
    </View>
  );
};

// CUSTOMER SEGMENTATION COMPONENT
export const CustomerSegments = ({ segments, onSelectSegment, theme }) => {
  if (!segments) return null;

  const segmentsList = [
    {
      key: "vip",
      label: "VIP Customers",
      icon: "👑",
      color: "#fbbf24",
      count: segments.vip?.count || 0,
    },
    {
      key: "highSpenders",
      label: "High Spenders",
      icon: "💰",
      color: "#60a5fa",
      count: segments.highSpenders?.count || 0,
    },
    {
      key: "new",
      label: "New Customers",
      icon: "✨",
      color: "#34d399",
      count: segments.new?.count || 0,
    },
    {
      key: "inactive",
      label: "Inactive",
      icon: "😴",
      color: "#f87171",
      count: segments.inactive?.count || 0,
    },
  ];

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text
        style={{
          color: theme.text,
          fontWeight: "700",
          marginBottom: SPACING.md,
          fontSize: FONTS.sizes.lg,
        }}
      >
        👥 Customer Segments
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACING.md }}>
        {segmentsList.map((segment) => (
          <TouchableOpacity
            key={segment.key}
            onPress={() => onSelectSegment(segment.key)}
            style={{
              flex: 0.48,
              backgroundColor: segment.color + "20",
              borderColor: segment.color,
              borderWidth: 2,
              borderRadius: RADIUS.lg,
              padding: SPACING.md,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28, marginBottom: SPACING.xs }}>
              {segment.icon}
            </Text>
            <Text
              style={{
                color: theme.text,
                fontWeight: "700",
                fontSize: FONTS.sizes.sm,
              }}
            >
              {segment.label}
            </Text>
            <Text style={{ color: theme.textLight, fontSize: FONTS.sizes.xs }}>
              {segment.count} customers
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default {
  SearchBar,
  FilterBar,
  SortOptions,
  BulkSelectHeader,
  ExportButton,
  CustomerNotesModal,
  InventoryManager,
  LowStockAlerts,
  CustomerSegments,
};
