import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Landing from "@/components/Landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  let user = null;
  try {
    user = await getSessionUser();
  } catch {
    user = null;
  }
  if (user) redirect("/app");
  return <Landing />;
}
