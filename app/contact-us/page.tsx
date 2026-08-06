import HeadingSectionText from "@/components/common/HeadingSectionText";
import ButtonGreen from "@/components/common/ButtonGreen";
import styles from '@/styles/ContactUsPage.module.css';

export default function ContactUsPage() {
    return (
        <main>
            <HeadingSectionText
                title="Contact Us"
                breadcrumb={[
                    { label: 'Home', href: '/' },
                    { label: 'Contact Us' },
                ]}
            />

            {/* Section 1: Thông tin và Form liên hệ */}
            <section className={styles.hn__contactContent}>
                <div className={styles.hn__contactContent__container}>

                    {/* Cột 1: Thông tin liên hệ (Dùng thẻ <article> hoặc <div> bổ trợ) */}
                    <div className={styles.hn__contactContent__column}>
                        <header className={styles.hn__contactContent__header}>
                            <h3 className={styles.hn__contactContent__headingTitle}>
                                We're Always Eager to Hear From You!
                            </h3>
                        </header>

                        {/* Dùng danh sách thông tin <address> để đúng ngữ nghĩa địa chỉ/liên hệ */}
                        <address className={styles.hn__contactContent__addressInfo}>
                            <div className={styles.hn__contactContent__infoGroup}>
                                <h3 className={styles.hn__contactContent__infoTitle}>Address</h3>
                                <p className={styles.hn__contactContent__text}>
                                    Studio 76d, Riley Ford, North Michael chester, CF99 6QQ
                                </p>
                            </div>

                            <div className={styles.hn__contactContent__infoGroup}>
                                <h3 className={styles.hn__contactContent__infoTitle}>Email</h3>
                                <p className={styles.hn__contactContent__text}>
                                    <a className={styles.hn__contactContent__link} href="mailto:edublink@example.com">
                                        edublink@example.com
                                    </a>
                                </p>
                            </div>

                            <div className={styles.hn__contactContent__infoGroup}>
                                <h3 className={styles.hn__contactContent__infoTitle}>Phone</h3>
                                <p className={styles.hn__contactContent__text}>
                                    <a className={styles.hn__contactContent__link} href="tel:+0914135548598">
                                        (+091) 413 554 8598
                                    </a>
                                </p>
                            </div>
                        </address>

                        {/* Mạng xã hội: Sử dụng thẻ <nav> hoặc <div> kết hợp <ul> */}
                        <nav className={styles.hn__contactContent__socialNav} aria-label="Social links">
                            <ul className={styles.hn__contactContent__socialList}>
                                <li className={styles.hn__contactContent__socialItem}>
                                    <a href="#" className={styles.hn__contactContent__socialLink} aria-label="Share">
                                        <i aria-hidden="true" className={`${styles.hn__contactContent__socialIcon} edublink icon-share-alt`}></i>
                                    </a>
                                </li>
                                <li className={styles.hn__contactContent__socialItem}>
                                    <a href="#" className={styles.hn__contactContent__socialLink} aria-label="Facebook">
                                        <i aria-hidden="true" className={`${styles.hn__contactContent__socialIcon} edublink icon-facebook`}></i>
                                    </a>
                                </li>
                                <li className={styles.hn__contactContent__socialItem}>
                                    <a href="#" className={styles.hn__contactContent__socialLink} aria-label="Twitter">
                                        <i aria-hidden="true" className={`${styles.hn__contactContent__socialIcon} edublink icon-twitter`}></i>
                                    </a>
                                </li>
                                <li className={styles.hn__contactContent__socialItem}>
                                    <a href="#" className={styles.hn__contactContent__socialLink} aria-label="LinkedIn">
                                        <i aria-hidden="true" className={`${styles.hn__contactContent__socialIcon} edublink icon-linkedin2`}></i>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Cột 2: Form liên hệ */}
                    <div className={styles.hn__contactContent__column}>
                        <div className={styles.hn__contactContent__formContainer}>
                            {/* Hình ảnh trang trí: Đưa về đúng ngữ nghĩa hình ảnh phụ trợ */}
                            <img src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-02.png" alt="" className={`${styles.hn__contactContent__decorImg} ${styles.hn__contactContent__decorImg1}`} />
                            <img src="https://demo.edublink.co/wp-content/uploads/2023/05/shape-13.png" alt="" className={`${styles.hn__contactContent__decorImg} ${styles.hn__contactContent__decorImg2}`} />

                            <div className={styles.hn__contactContent__formWrapper}>
                                <header className={styles.hn__contactContent__formHeader}>
                                    <h3 className={styles.hn__contactContent__formTitle}>Get In Touch</h3>
                                    <p className={styles.hn__contactContent__formDesc}>
                                        Fill out this form for booking a consultant advising session.
                                    </p>
                                </header>

                                <form action="/contact-us/" method="post" className={styles.hn__contactContent__form}>
                                    <div className={styles.hn__contactContent__formGroup}>
                                        <input
                                            id="user-name"
                                            type="text"
                                            name="name"
                                            className={styles.hn__contactContent__input}
                                            placeholder="Your name *"
                                            required
                                        />
                                    </div>

                                    <div className={styles.hn__contactContent__formGroup}>
                                        <input
                                            id="user-email"
                                            type="email"
                                            name="email"
                                            className={styles.hn__contactContent__input}
                                            placeholder="Enter your email *"
                                            required
                                        />
                                    </div>

                                    <div className={styles.hn__contactContent__formGroup}>
                                        <input
                                            id="user-subject"
                                            type="text"
                                            name="subject"
                                            className={styles.hn__contactContent__input}
                                            placeholder="Subject"
                                        />
                                    </div>

                                    <div className={styles.hn__contactContent__formGroup}>
                                        <textarea
                                            id="user-message"
                                            name="message"
                                            rows={4}
                                            className={styles.hn__contactContent__textarea}
                                            placeholder="Your Message"
                                            required
                                        ></textarea>
                                    </div>

                                    <div className={`${styles.hn__contactContent__formGroup} ${styles["hn__contactContent__formGroup--submit"]}`}>
                                        <ButtonGreen
                                            type="submit"
                                            text="Submit Message"
                                            className={styles.hn__contactContent__submitBtn}
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Section 2: Bản đồ Google Maps */}
            <section className={styles.hn__contactMap}>
                <div className={styles.hn__contactMap__container}>
                    <div className={styles.hn__contactMap__embed}>
                        <iframe
                            loading="lazy"
                            src="https://maps.google.com/maps?q=London%20Eye%2C%20London%2C%20United%20Kingdom&t=m&z=10&output=embed&iwloc=near"
                            title="London Eye, London, United Kingdom"
                            aria-label="London Eye, London, United Kingdom"
                            className={styles.hn__contactMap__iframe}
                        ></iframe>
                    </div>
                </div>
            </section>
        </main>
    );
}