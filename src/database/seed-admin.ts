import "dotenv/config";
import bcrypt from "bcrypt";
import Database from ".";
import User from "../models/user.model";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured for admin seeding`);
  return value;
};

async function seedAdmin(): Promise<void> {
  const name = required("SEED_ADMIN_NAME");
  const email = required("SEED_ADMIN_EMAIL").toLowerCase();
  const password = required("SEED_ADMIN_PASSWORD");
  if (password.length < 8)
    throw new Error("SEED_ADMIN_PASSWORD must contain at least 8 characters");

  const database = Database.getInstance();
  await database.initialize();
  try {
    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name,
        email,
        password: await bcrypt.hash(password, 12),
      } as any,
    });
    console.log(
      created ? `Seeded admin user ${user.email}` : `Admin user ${user.email} already exists`,
    );
  } finally {
    await database.close();
  }
}

seedAdmin().catch((error: Error) => {
  console.error(`Admin seed failed: ${error.message}`);
  process.exitCode = 1;
});
