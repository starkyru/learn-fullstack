import { db } from "./index.js";

/** Seed baseline data. Modules extend this as they add domain models. */
async function main() {
  await db.user.upsert({
    where: { email: "learner@example.com" },
    update: {},
    create: { email: "learner@example.com", name: "Learner" },
  });
  console.log("Seed complete.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
