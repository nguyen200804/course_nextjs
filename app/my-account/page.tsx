import { cookies } from "next/headers";
import HeadingSectionText from "@/components/common/HeadingSectionText";
import LoginRegister from "@/components/my-account/LoginRegister";
import LoggedInAccount from "@/components/my-account/LoggedInAccount";

export default async function MyAccountPage() {
  const cookieStore = await cookies();
  const sessionUserCookie = cookieStore.get("session_user")?.value;

  let user = null;
  if (sessionUserCookie) {
    try {
      user = JSON.parse(sessionUserCookie);
    } catch {
      user = null;
    }
  }

  return (
    <main>
      <HeadingSectionText title="My Account" />
      {user ? <LoggedInAccount user={user} /> : <LoginRegister />}
    </main>
  );
}