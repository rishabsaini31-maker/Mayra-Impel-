import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { bannerAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";
import { compressImage } from "../../utils/imageCompression";

const BannersTab = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: bannersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["homeBannersAdmin"],
    queryFn: bannerAPI.getAdminAll,
    retry: 0,
    staleTime: 60000,
  });

  const banners = bannersData?.banners || [];

  const uploadBannerImage = async (imageAsset) => {
    try {
      console.log("[BannersTab] Compressing banner image before upload...");

      // Compress banner image to 15-35 KB range using medium sizing (800px width)
      const compressionResult = await compressImage(imageAsset.uri, "medium");
      console.log(
        `[BannersTab] Compression complete: ${compressionResult.sizeInKB} KB`,
      );

      const formData = new FormData();
      formData.append("image", {
        uri: compressionResult.uri,
        name: `banner_${Date.now()}.webp`,
        type: "image/webp",
      });

      console.log("[BannersTab] Uploading compressed banner...");
      const data = await bannerAPI.uploadImage(formData);
      console.log("[BannersTab] Banner upload successful:", data?.url);

      return data?.url || "";
    } catch (err) {
      console.error("[BannersTab] Banner upload error:", err);
      throw err;
    }
  };

  const handleAddBanner = async () => {
    try {
      console.log("handleAddBanner called");
      const remainingSlots = 8 - banners.length;
      if (remainingSlots <= 0) {
        Alert.alert("Limit reached", "You can upload maximum 8 slider images.");
        return;
      }
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Media permission status:", status);
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow photo access.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
      });
      console.log("ImagePicker result:", result);
      if (result.canceled || !result.assets?.length) {
        Alert.alert("Image selection cancelled or no images selected");
        return;
      }
      setIsUploading(true);
      let successCount = 0;
      let failedCount = 0;
      for (const asset of result.assets) {
        try {
          const imageUrl = await uploadBannerImage(asset);
          if (!imageUrl) {
            failedCount++;
            continue;
          }
          await bannerAPI.create({ image_url: imageUrl, is_active: true });
          successCount++;
        } catch (err) {
          console.error("Failed to add banner:", err);
          failedCount++;
        }
      }
      refetch();
      if (successCount > 0 && failedCount === 0) {
        Alert.alert(
          "Success",
          `${successCount} slider image${successCount > 1 ? "s" : ""} added successfully`,
        );
      } else if (successCount > 0 && failedCount > 0) {
        Alert.alert(
          "Partial Success",
          `${successCount} image${successCount > 1 ? "s" : ""} uploaded, ${failedCount} failed`,
        );
      } else {
        Alert.alert("Error", "Failed to add slider images");
      }
    } catch (err) {
      console.error("Banner image picker/upload error:", err);
      Alert.alert(
        "Error",
        err?.response?.data?.error ||
          err.message ||
          "Failed to add slider image",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBanner = (bannerId) => {
    Alert.alert("Remove image", "Do you want to remove this slider image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await bannerAPI.delete(bannerId);
            refetch();
          } catch (err) {
            Alert.alert(
              "Error",
              err?.response?.data?.error || "Failed to remove image",
            );
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: currentTheme.text }}>
          Loading slider images...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: currentTheme.text }}>
          Failed to load slider images.
        </Text>
      </View>
    );
  }

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
        <View>
          <Text style={[styles.productsTitle, { color: currentTheme.text }]}>
            Slider Images
          </Text>
          <Text
            style={{ color: currentTheme.textLight, fontSize: FONTS.sizes.sm }}
          >
            Add 4 to 8 images for homepage slider
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleAddBanner}
          disabled={isUploading || banners.length >= 8}
          style={[
            styles.addButton,
            {
              backgroundColor:
                isUploading || banners.length >= 8
                  ? currentTheme.textLight
                  : currentTheme.primary,
            },
          ]}
        >
          {isUploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="add" size={22} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={banners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.lg }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: currentTheme.text }]}>
              No slider images yet
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.productCard,
              {
                backgroundColor: currentTheme.cardBackground,
                alignItems: "center",
              },
            ]}
          >
            <Image
              source={{ uri: item.image_url }}
              style={{
                width: 110,
                height: 80,
                borderRadius: RADIUS.md,
                marginRight: SPACING.md,
                backgroundColor: "#e5e7eb",
              }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: currentTheme.text }]}>
                Image {index + 1}
              </Text>
              <Text
                style={{
                  color: currentTheme.textLight,
                  fontSize: FONTS.sizes.sm,
                }}
              >
                Display order: {item.display_order}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteBanner(item.id)}
              style={[styles.iconButton, { backgroundColor: "#ef4444" }]}
            >
              <Ionicons name="trash-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      />
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
    paddingTop: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default BannersTab;
