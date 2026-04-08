import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { productAPI, categoryAPI } from "../../api";
import useThemeStore from "../../store/themeStore";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../../constants";
import {
  SearchBar,
  SortOptions,
  ExportButton,
} from "../../components/admin/AdminFeatures";
import { compressImage } from "../../utils/imageCompression";

const ProductsTab = ({ activeTab }) => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    serial_number: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const {
    data: productsData,
    isLoading,
    error,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["allProducts"],
    queryFn: async () => {
      console.log("Fetching products from admin...");
      const result = await productAPI.getAll();
      console.log("Products data received:", {
        count: result?.products?.length || 0,
        data: result,
      });
      return result;
    },
    retry: 1,
    staleTime: 0,
    cacheTime: 5000,
  });

  // Refetch products when switching to products tab
  useEffect(() => {
    if (activeTab === "products") {
      console.log("Products tab active - refetching");
      refetchProducts();
    }
  }, [activeTab]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("Fetching categories from admin...");
      const result = await categoryAPI.getAll();
      console.log("Categories data received:", {
        count: result?.categories?.length || 0,
      });
      return result;
    },
    retry: 1,
    staleTime: 0,
    cacheTime: 5000,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchProducts();
    setRefreshing(false);
  };

  const handleExportProducts = async () => {
    const response = await productAPI.exportProducts();
    if (response?.emailSent) {
      Alert.alert("Export Sent", "Products CSV has been emailed to admin.");
    } else {
      Alert.alert(
        "Export Complete",
        response?.emailWarning
          ? `CSV prepared but email failed: ${response.emailWarning}`
          : "CSV prepared successfully.",
      );
    }
  };

  const handlePickImage = async () => {
    try {
      console.log("handlePickImage called");
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Media permission status:", status);
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow photo library access to upload product images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 8,
      });
      console.log("ImagePicker result:", result);
      if (!result.canceled && result.assets) {
        setSelectedImages([...selectedImages, ...result.assets]);
      } else if (result.canceled) {
        Alert.alert("Image selection cancelled");
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Image Picker Error", err.message || String(err));
    }
  };

  const uploadImageToStorage = async (imageAsset) => {
    try {
      console.log("[ProductsTab] Compressing image before upload...");

      // Compress image to 15-35 KB range using medium sizing (800px width)
      const compressionResult = await compressImage(imageAsset.uri, "medium");
      console.log(
        `[ProductsTab] Compression complete: ${compressionResult.sizeInKB} KB`,
      );

      const formData = new FormData();
      // Use webp extension after compression
      formData.append("image", {
        uri: compressionResult.uri,
        name: `product_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`,
        type: "image/webp",
      });

      console.log("[ProductsTab] Uploading compressed image...");
      const data = await productAPI.uploadImage(formData);
      console.log("[ProductsTab] Upload successful:", data?.url);

      return data?.url || "";
    } catch (err) {
      console.error("[ProductsTab] Upload error:", err);
      Alert.alert(
        "Compression/Upload Error",
        err.message || "Failed to process image",
      );
      return null;
    }
  };

  const uploadAllImages = async () => {
    if (selectedImages.length === 0) return [];

    setImageUploading(true);
    try {
      const uploadPromises = selectedImages.map((img) =>
        uploadImageToStorage(img),
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls.filter((url) => url !== null);
    } catch (err) {
      Alert.alert("Upload Error", "Failed to upload some images");
      return [];
    } finally {
      setImageUploading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      category_id: product.category_id || "",
      image_url: product.image_url || "",
      serial_number: product.serial_number || "",
    });
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setSelectedImages([]);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_url: "",
      serial_number: "",
    });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category_id) {
      Alert.alert("Missing Fields", "Please fill all required fields");
      return;
    }

    setIsAdding(true);
    try {
      let imageUrls = [];

      // Upload new images if any selected
      if (selectedImages.length > 0) {
        imageUrls = await uploadAllImages();
        if (imageUrls.length === 0) {
          Alert.alert(
            "Upload Failed",
            "Failed to upload images. Please try again.",
          );
          setIsAdding(false);
          return;
        }
      }

      // For editing: merge with existing image_url if present
      let finalImageUrl = "";
      if (
        editingProduct &&
        newProduct.image_url &&
        selectedImages.length === 0
      ) {
        // Keep existing if no new images
        finalImageUrl = newProduct.image_url;
      } else if (imageUrls.length > 0) {
        // Store as JSON array if multiple, single string if one
        finalImageUrl =
          imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls);
      }

      if (editingProduct) {
        await productAPI.update(editingProduct.id, {
          ...newProduct,
          price: parseFloat(newProduct.price),
          image_url: finalImageUrl,
        });
        Alert.alert("Success", "Product updated successfully!");
      } else {
        await productAPI.create({
          ...newProduct,
          price: parseFloat(newProduct.price),
          image_url: finalImageUrl,
        });
        Alert.alert("Success", "Product added successfully!");
      }

      handleCloseModal();
      refetchProducts();
    } catch (err) {
      const serverError = err?.response?.data;
      Alert.alert(
        "Error",
        serverError?.error ||
          err.message ||
          `Failed to ${editingProduct ? "update" : "add"} product`,
      );
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: currentTheme.text }}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>⚠️</Text>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>
          Failed to load products
        </Text>
        <Text style={[styles.emptySubtext, { color: currentTheme.textLight }]}>
          {error.message || "Please check your connection and try again"}
        </Text>
        <TouchableOpacity
          onPress={() => refetchProducts()}
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

  const products = productsData?.products || productsData?.data || [];
  const categories = categoriesData?.categories || categoriesData?.data || [];

  // Filter and sort products
  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.categories?.name &&
          p.categories.name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

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
          All Products ({filteredProducts.length})
        </Text>
        <ExportButton
          data={filteredProducts}
          filename="products"
          theme={currentTheme}
          onExport={handleExportProducts}
        />
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[
            styles.addButton,
            { backgroundColor: currentTheme.primary, marginLeft: SPACING.md },
          ]}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Sort */}
      <View
        style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          theme={currentTheme}
        />
        <View style={{ marginTop: SPACING.md }}>
          <SortOptions
            value={sortBy}
            onSelect={setSortBy}
            options={[
              { value: "recent", label: "📅 Recent" },
              { value: "price-asc", label: "💲 Low to High" },
              { value: "price-desc", label: "💲 High to Low" },
              { value: "name", label: "🔤 A to Z" },
            ]}
            theme={currentTheme}
          />
        </View>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>📦</Text>
          <Text style={[styles.emptyText, { color: currentTheme.text }]}>
            {searchQuery
              ? "No products match your search"
              : "No products found"}
          </Text>
          <Text
            style={[styles.emptySubtext, { color: currentTheme.textLight }]}
          >
            {searchQuery
              ? "Try adjusting your search terms"
              : "Click the + button above to add products"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
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
            <TouchableOpacity
              onPress={() => handleEditProduct(item)}
              style={[
                styles.productCard,
                { backgroundColor: currentTheme.cardBackground },
              ]}
            >
              {item.image_url ? (
                <Image
                  source={{
                    uri: (() => {
                      try {
                        const parsed = JSON.parse(item.image_url);
                        return Array.isArray(parsed)
                          ? parsed[0]
                          : item.image_url;
                      } catch {
                        return item.image_url;
                      }
                    })(),
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImageText}>
                    {item.name?.charAt(0)?.toUpperCase() || "P"}
                  </Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <Text
                  style={[styles.productName, { color: currentTheme.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.productCategory,
                    { color: currentTheme.textLight },
                  ]}
                >
                  {item.categories?.name || "Uncategorized"}
                  {item.serial_number && (
                    <Text
                      style={[
                        styles.productCategory,
                        { color: currentTheme.textLight, fontSize: 12 },
                      ]}
                    >
                      {" • SKU: " + item.serial_number}
                    </Text>
                  )}
                </Text>
                <View style={styles.productFooter}>
                  <Text
                    style={[
                      styles.productPrice,
                      { color: currentTheme.primary },
                    ]}
                  >
                    ₹{item.price?.toLocaleString("en-IN") || "0"}
                  </Text>
                  <View
                    style={[
                      styles.activeIndicator,
                      {
                        backgroundColor: item.is_active ? "#10b981" : "#ef4444",
                      },
                    ]}
                  >
                    <Text style={styles.activeText}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.editIconContainer}>
                <Ionicons name="create-outline" size={16} color={COLORS.text} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: currentTheme.cardBackground,
              borderRadius: RADIUS.lg,
              padding: SPACING.md,
              width: "92%",
              maxWidth: 520,
              alignSelf: "center",
              maxHeight: "96%",
              minHeight: "82%",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: currentTheme.text,
                marginBottom: SPACING.md,
              }}
            >
              {editingProduct ? "Edit Product" : "Add New Product"}
            </Text>
            <ScrollView>
              <View style={{ marginBottom: SPACING.md }}>
                <Text
                  style={{ color: currentTheme.textLight, marginBottom: 5 }}
                >
                  Product Name*
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: currentTheme.border,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                    color: currentTheme.text,
                  }}
                  placeholder="Enter product name"
                  placeholderTextColor={currentTheme.placeholder}
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, name: text })
                  }
                />
              </View>

              <View style={{ marginBottom: SPACING.md }}>
                <Text
                  style={{ color: currentTheme.textLight, marginBottom: 5 }}
                >
                  Category*
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: SPACING.sm }}
                >
                  {categories.map((category) => {
                    const isSelected = newProduct.category_id === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() =>
                          setNewProduct({
                            ...newProduct,
                            category_id: category.id,
                          })
                        }
                        style={{
                          paddingHorizontal: SPACING.md,
                          paddingVertical: SPACING.sm,
                          borderRadius: RADIUS.md,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? currentTheme.primary
                            : currentTheme.border,
                          backgroundColor: isSelected
                            ? currentTheme.primary + "20"
                            : currentTheme.cardBackground,
                        }}
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? currentTheme.primary
                              : currentTheme.text,
                            fontWeight: isSelected ? "700" : "500",
                          }}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {categories.length === 0 && (
                  <Text
                    style={{
                      color: currentTheme.textLight,
                      marginTop: SPACING.xs,
                      fontSize: FONTS.sizes.xs,
                    }}
                  >
                    No categories found. Please add categories first.
                  </Text>
                )}
              </View>

              <View style={{ marginBottom: SPACING.md }}>
                <Text
                  style={{ color: currentTheme.textLight, marginBottom: 5 }}
                >
                  Price (₹)*
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: currentTheme.border,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                    color: currentTheme.text,
                  }}
                  placeholder="Enter price"
                  placeholderTextColor={currentTheme.placeholder}
                  value={newProduct.price}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, price: text })
                  }
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={{ marginBottom: SPACING.md }}>
                <Text
                  style={{ color: currentTheme.textLight, marginBottom: 5 }}
                >
                  Serial Number (SKU)
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: currentTheme.border,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                    color: currentTheme.text,
                  }}
                  placeholder="Enter product serial number or SKU"
                  placeholderTextColor={currentTheme.placeholder}
                  value={newProduct.serial_number}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, serial_number: text })
                  }
                />
              </View>

              <View style={{ marginBottom: SPACING.lg }}>
                <Text
                  style={{ color: currentTheme.textLight, marginBottom: 5 }}
                >
                  Description
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: currentTheme.border,
                    borderRadius: RADIUS.md,
                    padding: SPACING.md,
                    color: currentTheme.text,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Enter description (optional)"
                  placeholderTextColor={currentTheme.placeholder}
                  value={newProduct.description}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, description: text })
                  }
                  multiline
                />
              </View>

              {/* Image Upload Section */}
              <View style={{ marginBottom: SPACING.lg }}>
                <Text
                  style={{ color: currentTheme.textLight, marginBottom: 8 }}
                >
                  Product Images (Optional - up to 8)
                </Text>

                {/* Display selected images in grid */}
                {selectedImages.length > 0 && (
                  <View style={{ marginBottom: SPACING.md }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: SPACING.sm }}
                    >
                      {selectedImages.map((img, index) => (
                        <View key={index} style={{ position: "relative" }}>
                          <Image
                            source={{ uri: img.uri }}
                            style={{
                              width: 100,
                              height: 100,
                              borderRadius: RADIUS.md,
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedImages(
                                selectedImages.filter((_, i) => i !== index),
                              );
                            }}
                            style={{
                              position: "absolute",
                              top: -5,
                              right: -5,
                              backgroundColor: "#ef4444",
                              borderRadius: 12,
                              width: 24,
                              height: 24,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "white",
                                fontSize: 14,
                                fontWeight: "bold",
                              }}
                            >
                              ×
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Existing image preview for edit mode */}
                {editingProduct &&
                  newProduct.image_url &&
                  selectedImages.length === 0 && (
                    <View style={{ marginBottom: SPACING.md }}>
                      {(() => {
                        try {
                          const parsed = JSON.parse(newProduct.image_url);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            return (
                              <>
                                <Text
                                  style={{
                                    color: currentTheme.textLight,
                                    marginBottom: SPACING.sm,
                                    fontSize: FONTS.sizes.sm,
                                  }}
                                >
                                  Current Images ({parsed.length})
                                </Text>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  contentContainerStyle={{ gap: SPACING.sm }}
                                >
                                  {parsed.map((url, index) => (
                                    <Image
                                      key={index}
                                      source={{ uri: url }}
                                      style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: RADIUS.md,
                                      }}
                                    />
                                  ))}
                                </ScrollView>
                              </>
                            );
                          }
                        } catch {
                          // Single URL - show single image
                        }
                        return (
                          <>
                            <Text
                              style={{
                                color: currentTheme.textLight,
                                marginBottom: SPACING.sm,
                                fontSize: FONTS.sizes.sm,
                              }}
                            >
                              Current Image
                            </Text>
                            <Image
                              source={{ uri: newProduct.image_url }}
                              style={{
                                width: "100%",
                                height: 200,
                                borderRadius: RADIUS.md,
                              }}
                            />
                          </>
                        );
                      })()}
                      <TouchableOpacity
                        onPress={() => {
                          setNewProduct({ ...newProduct, image_url: "" });
                        }}
                        style={{
                          backgroundColor: "#ef4444",
                          paddingVertical: SPACING.sm,
                          borderRadius: RADIUS.md,
                          marginTop: SPACING.md,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            textAlign: "center",
                            fontWeight: "600",
                          }}
                        >
                          Remove All Existing Images
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                {/* Add images button */}
                {selectedImages.length < 8 && (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    disabled={isAdding || imageUploading}
                    style={{
                      borderWidth: 2,
                      borderColor: currentTheme.primary,
                      borderStyle: "dashed",
                      borderRadius: RADIUS.md,
                      paddingVertical: SPACING.lg,
                      paddingHorizontal: SPACING.md,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: currentTheme.primary + "10",
                    }}
                  >
                    {imageUploading ? (
                      <ActivityIndicator
                        color={currentTheme.primary}
                        size="large"
                      />
                    ) : (
                      <>
                        <Text
                          style={{
                            fontSize: 32,
                            marginBottom: SPACING.sm,
                          }}
                        >
                          📷
                        </Text>
                        <Text
                          style={{
                            color: currentTheme.primary,
                            fontWeight: "600",
                            fontSize: FONTS.sizes.md,
                          }}
                        >
                          {selectedImages.length > 0
                            ? "Add More Images"
                            : "Tap to select images"}
                        </Text>
                        <Text
                          style={{
                            color: currentTheme.textLight,
                            fontSize: FONTS.sizes.xs,
                            marginTop: SPACING.xs,
                          }}
                        >
                          {selectedImages.length}/8 selected • JPG, PNG
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: "row", gap: SPACING.md }}>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  disabled={isAdding}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: currentTheme.primary,
                    borderRadius: RADIUS.md,
                    paddingVertical: SPACING.md,
                  }}
                >
                  <Text
                    style={{
                      color: currentTheme.primary,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddProduct}
                  disabled={isAdding || imageUploading}
                  style={{
                    flex: 1,
                    backgroundColor:
                      isAdding || imageUploading
                        ? currentTheme.primary + "80"
                        : currentTheme.primary,
                    borderRadius: RADIUS.md,
                    paddingVertical: SPACING.md,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: SPACING.sm,
                  }}
                >
                  {isAdding || imageUploading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : null}
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {isAdding
                      ? editingProduct
                        ? "Updating..."
                        : "Adding..."
                      : imageUploading
                        ? "Uploading..."
                        : editingProduct
                          ? "Update Product"
                          : "Add Product"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: FONTS.sizes.md,
    fontWeight: "600",
  },
  productsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
    marginBottom: SPACING.md,
  },
  productCard: {
    flexDirection: "row",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  productImageText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: "700",
    color: "#6b7280",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
    backgroundColor: "#e5e7eb",
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  editIconContainer: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    ...SHADOWS.small,
  },
  productName: {
    fontSize: FONTS.sizes.md,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  productCategory: {
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: FONTS.sizes.lg,
    fontWeight: "700",
  },
  activeIndicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  activeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.md,
  },
});

export default ProductsTab;
