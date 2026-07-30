import React, { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './ButtonGreen.module.css';

interface ButtonGreenProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  text?: string;
  showIcon?: boolean;
  className?: string;
}

export default function ButtonGreen({
  href,
  text = 'Subscribe',
  showIcon = true,
  className = '',
  children,
  type = 'submit',
  ...props
}: ButtonGreenProps) {
  const content = (
    <>
      <span>{children || text}</span>
      {showIcon && <ArrowRight size={16} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${styles.buttonGreen} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={`${styles.buttonGreen} ${className}`} {...props}>
      {content}
    </button>
  );
}

