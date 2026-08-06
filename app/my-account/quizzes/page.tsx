import HeadingSectionText from "@/components/common/HeadingSectionText";
import LoggedInAccount from "@/components/my-account/LoggedInAccount";
import Quizzes from "@/components/my-account/Quizzes";

export default function QuizzesPage() {
    return (
        <main>
            <HeadingSectionText title="My Account" />
            <LoggedInAccount>
                <Quizzes />
            </LoggedInAccount>
        </main>
    );
}
