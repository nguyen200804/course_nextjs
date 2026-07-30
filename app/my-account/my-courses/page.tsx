import HeadingSectionText from "@/components/common/HeadingSectionText";
import LoggedInAccount from "@/components/my-account/LoggedInAccount";
import MyCourses from "@/components/my-account/MyCourses";

export default function MyCoursesPage() {
    return (
        <main>
            <HeadingSectionText title="My Account" />
            <LoggedInAccount>
                <MyCourses />
            </LoggedInAccount>
        </main>
    );
}
