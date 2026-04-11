/**
 * Dynamic Image Compression Utility for React Native (Expo)
 * Target: 15 KB to 35 KB
 * Uses: expo-image-manipulator + expo-file-system
 */

import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const COMPRESSION_CONFIG = {
  MIN_SIZE_KB: 15,
  MAX_SIZE_KB: 35,
  INITIAL_COMPRESSION: 0.4,
  COMPRESSION_STEPS: [0.4, 0.3, 0.25, 0.2, 0.15],
  MAX_ITERATIONS: 5,
  RESIZE_DIMENSIONS: {
    thumbnail: 200,
    medium: 800,
  },
  FORMAT: "webp",
};

/**
 * Get file size in KB from given URI
 * @param {string} uri - File URI to check
 * @returns {Promise<number>} File size in KB
 */
const getFileSizeInKB = async (uri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      console.warn(`File not found at ${uri}`);
      return 0;
    }
    const sizeInBytes = fileInfo.size || 0;
    const sizeInKB = sizeInBytes / 1024;
    return Math.round(sizeInKB * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error("Error getting file size:", error);
    return 0;
  }
};

/**
 * Resize and compress image to target format
 * @param {string} uri - Original image URI
 * @param {number} width - Width in pixels
 * @param {number} compression - Compression level (0-1)
 * @returns {Promise<string>} Compressed image URI
 */
const manipulateImage = async (uri, width, compression) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }], // Resize maintaining aspect ratio
      {
        compress: compression, // Compression level
        format: ImageManipulator.SaveFormat.WEBP,
        mimeType: "image/webp",
      },
    );

    return result.uri;
  } catch (error) {
    console.error("Error manipulating image:", error);
    throw new Error(`Image manipulation failed: ${error.message}`);
  }
};

/**
 * Main compression function with dynamic loop
 * Compresses image to fit between 15 KB and 35 KB target range
 *
 * @param {string} uri - Original image URI (from expo-image-picker)
 * @param {string} type - 'thumbnail' (200px) or 'medium' (800px)
 * @returns {Promise<Object>} { uri: string, sizeInKB: number }
 *
 * @example
 * const result = await compressImage(imageUri, 'medium');
 * // Returns: { uri: 'file://...', sizeInKB: 25.5 }
 */
export const compressImage = async (uri, type = "medium") => {
  if (!uri) {
    throw new Error("Image URI is required");
  }

  if (!["thumbnail", "medium"].includes(type)) {
    throw new Error('Type must be "thumbnail" or "medium"');
  }

  try {
    console.log(`[ImageCompression] Starting compression for ${type}...`);

    const targetWidth = COMPRESSION_CONFIG.RESIZE_DIMENSIONS[type];
    let currentCompressionIndex = 0;
    let currentCompression =
      COMPRESSION_CONFIG.COMPRESSION_STEPS[currentCompressionIndex];
    let currentUri = uri;
    let currentSizeKB = 0;
    let iteration = 0;
    let lastClosestSize = Infinity;
    let lastClosestUri = uri;
    let lastClosestSizeKB = 0;

    // LOOP: Adjust compression until target size is reached
    while (iteration < COMPRESSION_CONFIG.MAX_ITERATIONS) {
      iteration++;
      console.log(
        `[ImageCompression] Iteration ${iteration}/${COMPRESSION_CONFIG.MAX_ITERATIONS}`,
        `Compression: ${currentCompression.toFixed(2)}`,
      );

      // Manipulate (resize + compress) image
      currentUri = await manipulateImage(uri, targetWidth, currentCompression);

      // Get file size
      currentSizeKB = await getFileSizeInKB(currentUri);
      console.log(`[ImageCompression] Current size: ${currentSizeKB} KB`);

      // Track closest result to target range
      const distanceFromMin = Math.abs(
        currentSizeKB - COMPRESSION_CONFIG.MIN_SIZE_KB,
      );
      const distanceFromRange =
        currentSizeKB < COMPRESSION_CONFIG.MIN_SIZE_KB
          ? distanceFromMin
          : currentSizeKB > COMPRESSION_CONFIG.MAX_SIZE_KB
            ? Math.abs(currentSizeKB - COMPRESSION_CONFIG.MAX_SIZE_KB)
            : 0; // Within range

      if (distanceFromRange < lastClosestSize || distanceFromRange === 0) {
        lastClosestSize = distanceFromRange;
        lastClosestUri = currentUri;
        lastClosestSizeKB = currentSizeKB;
      }

      // CHECK 1: Size is within target range → SUCCESS
      if (
        currentSizeKB >= COMPRESSION_CONFIG.MIN_SIZE_KB &&
        currentSizeKB <= COMPRESSION_CONFIG.MAX_SIZE_KB
      ) {
        console.log(
          `[ImageCompression] ✓ SUCCESS: Size ${currentSizeKB} KB is in target range [15-35 KB]`,
        );
        return {
          uri: currentUri,
          sizeInKB: currentSizeKB,
        };
      }

      // CHECK 2: Size is too large → DECREASE compression
      if (currentSizeKB > COMPRESSION_CONFIG.MAX_SIZE_KB) {
        console.log(
          `[ImageCompression] Size ${currentSizeKB} KB > max ${COMPRESSION_CONFIG.MAX_SIZE_KB} KB → Decreasing compression`,
        );

        currentCompressionIndex++;

        // Check if we've exhausted all compression steps
        if (
          currentCompressionIndex >= COMPRESSION_CONFIG.COMPRESSION_STEPS.length
        ) {
          console.log(
            `[ImageCompression] Reached minimum compression level, using closest result`,
          );
          break;
        }

        currentCompression =
          COMPRESSION_CONFIG.COMPRESSION_STEPS[currentCompressionIndex];

        // CHECK 3: Size is too small → INCREASE compression (slightly)
      } else if (currentSizeKB < COMPRESSION_CONFIG.MIN_SIZE_KB) {
        console.log(
          `[ImageCompression] Size ${currentSizeKB} KB < min ${COMPRESSION_CONFIG.MIN_SIZE_KB} KB → Increasing compression`,
        );

        // Increase compression by 0.05 (but max 0.5)
        currentCompression = Math.min(currentCompression + 0.05, 0.5);

        // If we've hit max possible compression, stop looping
        if (currentCompression >= 0.5) {
          console.log(
            `[ImageCompression] Reached maximum compression level (0.5), using closest result`,
          );
          break;
        }
      }
    }

    // MAX ITERATIONS REACHED: Return closest result to target range
    console.log(
      `[ImageCompression] Max iterations (${COMPRESSION_CONFIG.MAX_ITERATIONS}) reached. Returning closest result: ${lastClosestSizeKB} KB`,
    );

    return {
      uri: lastClosestUri,
      sizeInKB: lastClosestSizeKB,
    };
  } catch (error) {
    console.error("[ImageCompression] Error during compression:", error);
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

/**
 * Batch compress multiple images
 * Useful for uploading multiple product images
 *
 * @param {Array} imageURIs - Array of image URIs
 * @param {string} type - 'thumbnail' or 'medium'
 * @returns {Promise<Array>} Array of { uri, sizeInKB }
 */
export const compressMultipleImages = async (imageURIs, type = "medium") => {
  if (!Array.isArray(imageURIs) || imageURIs.length === 0) {
    throw new Error("Image URIs array is required and must not be empty");
  }

  console.log(
    `[ImageCompression] Compressing ${imageURIs.length} images as ${type}...`,
  );

  const compressionPromises = imageURIs.map((uri) =>
    compressImage(uri, type).catch((error) => {
      console.error(`Failed to compress image ${uri}:`, error);
      return {
        uri: null,
        sizeInKB: 0,
        error: error.message,
      };
    }),
  );

  const results = await Promise.all(compressionPromises);

  // Filter out failed compressions
  const successfulResults = results.filter((result) => result.uri !== null);

  console.log(
    `[ImageCompression] Compression complete: ${successfulResults.length}/${imageURIs.length} successful`,
  );

  return successfulResults;
};

export default {
  compressImage,
  compressMultipleImages,
};
