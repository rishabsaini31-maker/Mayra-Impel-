require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function setupAdmin() {
  console.log("👤 Setting up Admin User...\n");

  try {
    const email = "rishabsainiupw165@gmail.com";
    const password = "RSS@3112";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      // Update existing user to admin
      console.log(`Updating existing user: ${email}\n`);
      const { data, error } = await supabase
        .from("users")
        .update({
          role: "admin",
          password_hash: hashedPassword,
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Update error:", error);
        process.exit(1);
      }

      console.log("✅ User updated successfully\n");
    } else {
      // Create new admin user
      console.log(`Creating new admin user: ${email}\n`);
      const { data, error } = await supabase
        .from("users")
        .insert({
          name: "Admin User",
          email,
          password_hash: hashedPassword,
          role: "admin",
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Insert error:", error);
        process.exit(1);
      }

      console.log("✅ Admin user created successfully\n");
    }

    console.log("📧 Email: rishabsainiupw165@gmail.com");
    console.log("🔑 Password: RSS@3112");
    console.log("👤 Role: admin\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

setupAdmin();
