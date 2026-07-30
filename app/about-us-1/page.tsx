import AboutSection from "@/components/AboutUs1/AboutSection";
import BenefitsSection from "@/components/AboutUs1/BenefitsSection";
import Partner from "@/components/AboutUs1/Partner";
import HeadingSectionImage from "@/components/common/HeadingSectionImage";
import Testimonials from "@/components/HomePage/Testimonials";
import styles from "./AboutUsContent.module.css";
import Statistics from "@/components/AboutUs1/Statistics";
import Instructors from "@/components/AboutUs1/Instructors";

export default function AboutUsPage() {
    return (
        <main>
            <HeadingSectionImage />
            <AboutSection />
            <Partner />
            <BenefitsSection />
            <Testimonials className={styles.hn_testimonials_section_wrapper} />
            <Statistics />
            <Instructors />
        </main>
    )
}