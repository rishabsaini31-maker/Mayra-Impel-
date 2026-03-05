require("dotenv").config();
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function setupAdminAccount() {
  console.log("🔐 Setting up Admin Account...\n");

  const adminEmail = "rishabsainiupw165@gmail.com";
  const adminPassword = "Rishab@3112";
  const adminName = "Rishab Saini";

  try {
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    // Hash password
    const password_hash = await bcrypt.hash(adminPassword, 10);

    if (existingAdmin) {
      // Update existing admin
      console.log("📝 Admin account exists, updating...");
      const { data: updatedAdmin, error: updateError } = await supabase
        .from("users")
        .update({
          password_hash,
          role: "admin",
          name: adminName,
        })
        .eq("email", adminEmail)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log("✅ Admin account updated successfully!");
      console.log("\n📋 Admin Credentials:");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`👤 Name: ${adminName}`);
      console.log(`\n✨ You can now login as admin in the app!`);
    } else {
      // Create new admin
      console.log("➕ Admin account not found, creating new...");
      const { data: newAdmin, error: createError } = await supabase
        .from("users")
        .insert({
          name: adminName,
          email: adminEmail,
          phone: "9876543210",
          password_hash,
          role: "admin",
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log("✅ Admin account created successfully!");
      console.log("\n📋 Admin Credentials:");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`👤 Name: ${adminName}`);
      console.log(`\n✨ You can now login as admin in the app!`);
    }
  } catch (error) {
    console.error("✗ Error setting up admin account:", error.message);
    process.exit(1);
  }
}

setupAdminAccount();
