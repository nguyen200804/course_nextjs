import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.hn_loading_wrapper}>
      <div className={styles.hn_loading_spinner}>
        <div className={styles.hn_loading_double_bounce1}></div>
        <div className={styles.hn_loading_double_bounce2}></div>
      </div>
      <p className={styles.hn_loading_text}>Loading course details...</p>
    </div>
  );
}
