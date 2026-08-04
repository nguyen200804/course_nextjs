import Link from "next/link";
import { MoveLeft, MoveRight } from "lucide-react";
import styles from "./Pagination.module.css";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl?: string;
    onChangePage?: (page: number) => void;
}

// Helper sinh danh sách trang rút gọn (Ellipsis Pagination)
function getPaginationPages(current: number, total: number, delta: number = 1) {
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
        let i = Math.max(2, current - delta);
        i <= Math.min(total - 1, current + delta);
        i++
    ) {
        range.push(i);
    }

    if (current - delta > 2) {
        rangeWithDots.push(1, "...");
    } else {
        rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
        rangeWithDots.push("...", total);
    } else if (total > 1) {
        rangeWithDots.push(total);
    }

    return rangeWithDots;
}

export default function Pagination({
    currentPage,
    totalPages,
    baseUrl = "/blog",
    onChangePage,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPaginationPages(currentPage, totalPages);

    const handlePageClick = (page: number, e: React.MouseEvent) => {
        if (onChangePage) {
            e.preventDefault();
            onChangePage(page);
        }
    };

    return (
        <nav className={styles.hn__pagination} aria-label="Pagination">
            <ul className={styles.hn__paginationList}>
                {/* Nút Previous */}
                {currentPage > 1 && (
                    <li className={styles.hn__paginationItem}>
                        <Link
                            className={`${styles.hn__paginationLink} ${styles["hn__paginationLink--prev"]}`}
                            href={`${baseUrl}?page=${currentPage - 1}`}
                            title="Previous page"
                            onClick={(e) => handlePageClick(currentPage - 1, e)}
                        >
                            <MoveLeft aria-hidden="true" />
                        </Link>
                    </li>
                )}

                {/* Danh sách các trang rút gọn */}
                {pages.map((page, index) => {
                    if (page === "...") {
                        return (
                            <li key={`dots-${index}`} className={styles.hn__paginationItem}>
                                <span className={styles.hn__paginationEllipsis}>...</span>
                            </li>
                        );
                    }

                    const pageNum = page as number;
                    const isActive = pageNum === currentPage;

                    return (
                        <li
                            key={pageNum}
                            className={`${styles.hn__paginationItem} ${isActive ? styles["hn__paginationItem--active"] : ""
                                }`}
                        >
                            {isActive ? (
                                <span
                                    className={styles.hn__paginationLink}
                                    aria-current="page"
                                >
                                    {pageNum}
                                </span>
                            ) : (
                                <Link
                                    className={styles.hn__paginationLink}
                                    href={`${baseUrl}?page=${pageNum}`}
                                    onClick={(e) => handlePageClick(pageNum, e)}
                                >
                                    {pageNum}
                                </Link>
                            )}
                        </li>
                    );
                })}

                {/* Nút Next */}
                {currentPage < totalPages && (
                    <li className={styles.hn__paginationItem}>
                        <Link
                            className={`${styles.hn__paginationLink} ${styles["hn__paginationLink--next"]}`}
                            href={`${baseUrl}?page=${currentPage + 1}`}
                            title="Next page"
                            onClick={(e) => handlePageClick(currentPage + 1, e)}
                        >
                            <MoveRight aria-hidden="true" />
                        </Link>
                    </li>
                )}
            </ul>
        </nav>
    );
}