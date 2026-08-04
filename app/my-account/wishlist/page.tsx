import HeadingSectionText from "@/components/common/HeadingSectionText";
import LoggedInAccount from "@/components/my-account/LoggedInAccount";
import WishlistCourses from "@/components/my-account/WishlistCourses";

export default function WishlistPage() {
  return (
    <main>
      <HeadingSectionText title="My Account" />
      <LoggedInAccount>
        <WishlistCourses />
      </LoggedInAccount>
    </main>
  );
}
