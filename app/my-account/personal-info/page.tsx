import HeadingSectionText from "@/components/common/HeadingSectionText";
import LoggedInAccount from "@/components/my-account/LoggedInAccount";
import PersonalInfo from "@/components/my-account/PersonalInfo";

export default function PersonalInfoPage() {
    return (
        <main>
            <HeadingSectionText title="My Account" />
            <LoggedInAccount>
                <PersonalInfo />
            </LoggedInAccount>
        </main>
    );
}
