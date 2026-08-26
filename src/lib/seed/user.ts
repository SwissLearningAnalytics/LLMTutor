import { APIError } from "better-auth";
import { auth } from "@/lib/auth";

export async function seedAdminUserIfNotExists() {
	const email = process.env.SEED_ADMIN_EMAIL?.trim();
	const password = process.env.SEED_ADMIN_PASSWORD;
	const name = process.env.SEED_ADMIN_NAME?.trim();

	const missingVariables = [
		["SEED_ADMIN_EMAIL", email],
		["SEED_ADMIN_PASSWORD", password],
		["SEED_ADMIN_NAME", name],
	]
		.filter(([, value]) => !value?.trim())
		.map(([variable]) => variable);

	if (missingVariables.length === 3) {
		console.info("Admin user seeding is not configured; skipping.");
		return;
	}

	if (!email || !password?.trim() || !name) {
		console.warn(
			`Admin user seeding is incomplete; missing ${missingVariables.join(", ")}. Skipping.`,
		);
		return;
	}

	try {
		await auth.api.createUser({
			body: {
				email,
				password,
				name,
				role: "admin",
			},
		});
		console.info("Seeded the configured admin user.");
	} catch (error) {
		if (
			error instanceof APIError &&
			error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
		) {
			console.info("The configured admin user already exists; skipping.");
			return;
		}

		console.error(
			"Failed to seed the configured admin user. The server will continue without ensuring that the admin user exists.",
			error,
		);
	}
}
