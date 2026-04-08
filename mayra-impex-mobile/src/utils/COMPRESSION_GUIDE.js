/**
 * ================================
 * IMAGE COMPRESSION INTEGRATION GUIDE
 * ================================
 *
 * This file provides complete documentation and examples for using the
 * compressImage() function in the Mayra Impex Mobile App.
 *
 * OVERVIEW:
 * ---------
 * The imageCompression utility automatically compresses product and banner
 * images to fit within the 15-35 KB target range before uploading to Supabase.
 *
 * BENEFITS:
 * 1. Reduces storage costs (smaller files = less storage)
 * 2. Faster uploads (smaller file size = quicker transmission)
 * 3. Better performance (optimized for mobile viewing)
 * 4. WebP format only (modern, efficient format)
 * 5. Consistent image quality across all devices
 *
 * ================================
 * QUICK START
 * ================================
 *
 * The compression is now automatically integrated into:
 *
 * 1. Product Admin Upload (ProductsTab.js)
 *    - Uses "medium" type (800px width)
 *    - Automatically called before upload
 *    - Admin taps "Add Product" → selects images → compression happens → upload
 *
 * 2. Banner Admin Upload (BannersTab.js)
 *    - Uses "medium" type (800px width)
 *    - Automatically called before upload
 *    - Admin taps "Add Banner" → selects images → compression happens → upload
 *
 * ================================
 * FUNCTION SPECIFICATION
 * ================================
 *
 * FUNCTION: compressImage(uri, type)
 *
 * PARAMETERS:
 *   - uri (string, REQUIRED)
 *     File URI from expo-image-picker result
 *     Example: "file:///cache/image-12345.jpg"
 *
 *   - type (string, OPTIONAL, default: "medium")
 *     'thumbnail' → resizes to 200px width (for thumbnails)
 *     'medium'    → resizes to 800px width (for product/banner display)
 *
 * RETURNS:
 *   Promise resolving to { uri, sizeInKB }
 *   - uri: string - Path to compressed image
 *   - sizeInKB: number - Final size in KB (rounded to 2 decimals)
 *
 * ================================
 * COMPRESSION ALGORITHM
 * ================================
 *
 * TARGET RANGE: 15 KB to 35 KB
 *
 * PROCESS:
 *
 * 1. START: compression = 0.4
 *
 * 2. RESIZE:
 *    - Resize image to target width (200px or 800px)
 *    - Maintain aspect ratio
 *
 * 3. COMPRESS:
 *    - Apply compression level (0-1 scale)
 *    - Convert to WebP format
 *    - Save to temporary file system
 *
 * 4. CHECK SIZE:
 *    - Get file size using FileSystem.getInfoAsync()
 *    - Round to 2 decimal places
 *
 * 5. ADJUST LOOP:
 *    - If size > 35 KB: Decrease compression
 *      Steps: 0.4 → 0.3 → 0.25 → 0.2 → 0.15
 *
 *    - If size < 15 KB: Increase compression
 *      Increment by 0.05 each iteration
 *      Maximum: 0.5
 *
 *    - If size in range [15-35]: SUCCESS ✓
 *
 * 6. EXIT CONDITIONS:
 *    - SUCCESS: Size within 15-35 KB range
 *    - FALLBACK: After 5 iterations, return closest result
 *    - ERROR: Throw exception if compression fails
 *
 * LOG OUTPUT:
 *    [ImageCompression] Starting compression for medium...
 *    [ImageCompression] Iteration 1/5 Compression: 0.40
 *    [ImageCompression] Current size: 28.50 KB
 *    [ImageCompression] ✓ SUCCESS: Size 28.50 KB is in target range [15-35 KB]
 *
 * ================================
 * INTEGRATION IN CODE
 * ================================
 *
 * EXAMPLE 1: ProductsTab.js (ALREADY INTEGRATED)
 *
 * import { compressImage } from "../../utils/imageCompression";
 *
 * const uploadImageToStorage = async (imageAsset) => {
 *   try {
 *     // Compress image
 *     const compressionResult = await compressImage(imageAsset.uri, "medium");
 *     console.log(`Compressed to: ${compressionResult.sizeInKB} KB`);
 *
 *     // Use compressed URI for upload
 *     const formData = new FormData();
 *     formData.append("image", {
 *       uri: compressionResult.uri,
         name: "product.webp",
 *       type: "image/webp",
 *     });
 *
 *     const data = await productAPI.uploadImage(formData);
 *     return data?.url;
 *   } catch (err) {
 *     console.error("Error:", err);
 *   }
 * };
 *
 * EXAMPLE 2: BannersTab.js (ALREADY INTEGRATED)
 *
 * import { compressImage } from "../../utils/imageCompression";
 *
 * const uploadBannerImage = async (imageAsset) => {
 *   try {
 *     const compressionResult = await compressImage(imageAsset.uri, "medium");
 *     const formData = new FormData();
 *     formData.append("image", {
 *       uri: compressionResult.uri,
 *       name: "banner.webp",
 *       type: "image/webp",
 *     });
 *     const data = await bannerAPI.uploadImage(formData);
 *     return data?.url;
 *   } catch (err) {
 *     console.error("Error:", err);
 *   }
 * };
 *
 * EXAMPLE 3: Custom Usage (for reference)
 *
 * import { compressImage, compressMultipleImages } from "../../utils/imageCompression";
 *
 * // Single image
 * const result = await compressImage(imageUri, "medium");
 * console.log(`Compressed: ${result.sizeInKB} KB`);
 *
 * // Multiple images
 * const results = await compressMultipleImages(
 *   [uri1, uri2, uri3],
 *   "thumbnail"
 * );
 * // Returns: [{ uri, sizeInKB }, { uri, sizeInKB }, ...]
 *
 * ================================
 * COMPRESSION QUALITY NOTES
 * ================================
 *
 * THUMBNAIL (200px):
 * - Best for: Product list/grid views
 * - Quality: Excellent for small displays
 * - File Size: Usually 8-20 KB
 * - Use Case: Product cards, search results
 *
 * MEDIUM (800px):
 * - Best for: Product detail/banner display
 * - Quality: Excellent for all displays
 * - File Size: Usually 20-35 KB
 * - Use Case: Product detail page, home banners
 *
 * WebP Format Benefits:
 * - 25-35% smaller than JPEG
 * - 26% smaller than PNG
 * - Supports transparency
 * - Modern browser/app support (all devices support WebP)
 *
 * ================================
 * ERROR HANDLING
 * ================================
 *
 * The function includes try-catch blocks for:
 * 1. File URI validation
 * 2. Image manipulation failures
 * 3. File size retrieval errors
 * 4. Type validation
 *
 * COMMON ERRORS:
 *
 * Error: "Image URI is required"
 *   → Cause: uri parameter is null/undefined
 *   → Fix: Verify ImagePicker returned valid result
 *
 * Error: "Type must be 'thumbnail' or 'medium'"
 *   → Cause: Invalid type parameter
 *   → Fix: Use only "thumbnail" or "medium"
 *
 * Error: "Image manipulation failed"
 *   → Cause: ImageManipulator couldn't process image
 *   → Fix: Ensure image file is valid and readable
 *
 * Error: "File not found at [uri]"
 *   → Cause: Compressed file deleted or inaccessible
 *   → Fix: Ensure FileSystem permissions are granted
 *
 * ================================
 * PERFORMANCE METRICS
 * ================================
 *
 * TYPICAL COMPRESSION TIME:
 * - Single image: 300-800ms (depends on original size)
 * - Multiple images: Sequential (uploads as they complete)
 * - Network: Upload time reduced by ~40% due to smaller file size
 *
 * STORAGE SAVINGS (example):
 * - Original JPEG (3264x2448): ~2.5 MB
 * - After compression (800px): ~28 KB
 * - Savings: ~99%
 *
 * Example compression flow:
 * Original → 2.5 MB
 * After resize (800px) → 450 KB
 * After WebP + compression → 28 KB ✓ (within 15-35 KB range)
 *
 * ================================
 * ADMIN WORKFLOW
 * ================================
 *
 * PRODUCT UPLOAD:
 * 1. Admin opens Products tab
 * 2. Clicks "Add Product" button
 * 3. Fills in name, description, price, category
 * 4. Selects images (up to 8)
 * 5. System auto-compresses each image (shown in logs)
 * 6. Uploads compressed WebP files to Supabase
 * 7. Success message confirms upload
 *
 * BANNER UPLOAD:
 * 1. Admin opens Banners tab
 * 2. Clicks "Add Banner" button
 * 3. Selects image(s) (up to 8 total)
 * 4. System auto-compresses each image
 * 5. Uploads compressed WebP file
 * 6. Banner appears in home screen slider
 *
 * ================================
 * MONITORING & DEBUGGING
 * ================================
 *
 * CONSOLE LOGS:
 * Open React Native debugger to see compression progress:
 *
 * [ImageCompression] Starting compression for medium...
 * [ImageCompression] Iteration 1/5 Compression: 0.40
 * [ImageCompression] Current size: 45.23 KB
 * [ImageCompression] Size 45.23 KB > max 35 KB → Decreasing compression
 * [ImageCompression] Iteration 2/5 Compression: 0.30
 * [ImageCompression] Current size: 28.50 KB
 * [ImageCompression] ✓ SUCCESS: Size 28.50 KB is in target range [15-35 KB]
 *
 * Logs include:
 * - Compression level being used
 * - Current file size after each iteration
 * - Direction of adjustment (increase/decrease)
 * - Final result status
 *
 * ================================
 * DEPENDENCIES
 * ================================
 *
 * REQUIRED PACKAGES (npm installed):
 * - expo-image-manipulator: ^15.0.0
 *   Purpose: Resize and compress images
 *   API: ImageManipulator.manipulateAsync()
 *
 * - expo-file-system: ^15.0.0
 *   Purpose: Get file size information
 *   API: FileSystem.getInfoAsync()
 *
 * PEER DEPENDENCIES (already in project):
 * - expo: ^54.0.33
 * - react-native: 0.81.5
 *
 * ================================
 * TROUBLESHOOTING
 * ================================
 *
 * ISSUE: Images not compressing, upload fails
 * SOLUTION:
 * - Check device permissions (Photo Library)
 * - Verify system storage space available
 * - Check device memory available
 * - Try uploading one image at a time
 *
 * ISSUE: Compression takes too long
 * SOLUTION:
 * - Normal for large original images (1-2 seconds is expected)
 * - Mobile device CPU affects speed
 * - Network connection affects perceived speed
 * - Consider selecting fewer images at once
 *
 * ISSUE: Compressed images look pixelated
 * SOLUTION:
 * - This should NOT happen with 800px medium size
 * - If it does, investigate original image quality
 * - Ensure source image is at least 800x600
 * - Try selecting different source image
 *
 * ================================
 * BEST PRACTICES
 * ================================
 *
 * ✓ DO:
 * - Use "medium" (800px) for product/banner display
 * - Use "thumbnail" (200px) for list thumbnails
 * - Select 2-3 images at a time for faster uploads
 * - Check file sizes in logs (should be 15-35 KB)
 * - Verify WebP is supported (it is on all modern devices)
 *
 * ✗ DON'T:
 * - Don't modify COMPRESSION_CONFIG values
 * - Don't use compression dimensions outside of 200px/800px
 * - Don't upload images larger than 50 MB (very slow)
 * - Don't assume all images will compress to same size
 * - Don't rely on visual inspection to verify compression
 *
 * ================================
 * FUTURE ENHANCEMENTS
 * ================================
 *
 * POSSIBLE IMPROVEMENTS:
 * 1. Add UI progress indicator during compression
 * 2. Add option to choose compression level (vs automatic)
 * 3. Add quality comparison before/after preview
 * 4. Add batch processing visualization
 * 5. Add compression statistics dashboard for admins
 * 6. Add support for different target sizes based on category
 * 7. Add compression history/logging database
 *
 * ================================
 */

export default {
  NOTES: "See comments above for complete documentation",
};
