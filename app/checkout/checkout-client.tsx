"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/styles/CheckoutPage.module.css";
import { ReceiptText, CreditCard, Receipt, CircleCheckBig } from "lucide-react";
import ButtonGreen from "@/components/common/ButtonGreen";


interface CheckoutClientProps {
  course: any;
  user: any;
  customer?: any;
  fieldsConfig?: {
    billing?: Record<string, any>;
    shipping?: Record<string, any>;
    additional?: Record<string, any>;
    currency?: string;
    currency_symbol?: string;
    currency_pos?: string;
    [key: string]: any;
  };
  paymentGateways?: any[];
}

export default function CheckoutClient({ course, user, customer, fieldsConfig, paymentGateways = [] }: CheckoutClientProps) {
  const router = useRouter();

  // formValues lưu giá trị của mọi trường theo key (ví dụ: billing_first_name, shipping_company, v.v.)
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const customerBilling = customer?.billing || {};
    const customerShipping = customer?.shipping || {};

    // Gán dữ liệu mặc định ban đầu dựa trên thông số WooCommerce tiêu chuẩn
    const standardBillingKeys = ["first_name", "last_name", "company", "address_1", "address_2", "city", "state", "postcode", "country", "email", "phone"];
    standardBillingKeys.forEach(k => {
      let val = customerBilling[k] || "";
      if (!val) {
        if (k === "email") val = user?.email || "";
        if (k === "last_name") val = user?.name || user?.username || "";
        if (k === "country") val = "VN";
      }
      initial[`billing_${k}`] = val;
    });

    const standardShippingKeys = ["first_name", "last_name", "company", "address_1", "address_2", "city", "state", "postcode", "country", "phone"];
    standardShippingKeys.forEach(k => {
      let val = customerShipping[k] || "";
      if (!val) {
        if (k === "country") val = "VN";
      }
      initial[`shipping_${k}`] = val;
    });

    return initial;
  });

  // Đồng bộ lại formValues khi fieldsConfig được tải đầy đủ từ server hoặc WordPress
  useEffect(() => {
    if (fieldsConfig) {
      setFormValues(prev => {
        const next = { ...prev };

        // Cấu hình các trường Billing
        const billingConfig = fieldsConfig.billing;
        if (billingConfig) {
          Object.keys(billingConfig).forEach(key => {
            if (next[key] === undefined || next[key] === "") {
              const cleanKey = key.replace("billing_", "");
              const customerBilling = customer?.billing || {};
              let val = customerBilling[cleanKey] || billingConfig[key].default || "";
              if (!val) {
                if (cleanKey === "email") val = user?.email || "";
                if (cleanKey === "last_name") val = user?.name || user?.username || "";
                if (cleanKey === "country") val = "VN";
              }
              next[key] = val;
            }
          });
        }

        // Cấu hình các trường Shipping
        const shippingConfig = fieldsConfig.shipping;
        if (shippingConfig) {
          Object.keys(shippingConfig).forEach(key => {
            if (next[key] === undefined || next[key] === "") {
              const cleanKey = key.replace("shipping_", "");
              const customerShipping = customer?.shipping || {};
              let val = customerShipping[cleanKey] || shippingConfig[key].default || "";
              if (!val) {
                if (cleanKey === "country") val = "VN";
              }
              next[key] = val;
            }
          });
        }

        // Cấu hình các trường Additional
        const additionalConfig = fieldsConfig.additional;
        if (additionalConfig) {
          Object.keys(additionalConfig).forEach(key => {
            if (next[key] === undefined) {
              next[key] = additionalConfig[key].default || "";
            }
          });
        }

        return next;
      });
    }
  }, [fieldsConfig, customer, user]);

  // Khởi tạo phương thức thanh toán mặc định dựa trên cổng WooCommerce
  const defaultPaymentMethod = paymentGateways.length > 0 ? paymentGateways[0].id : "bacs";
  const [paymentMethod, setPaymentMethod] = useState(defaultPaymentMethod);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (paymentGateways.length > 0) {
      setPaymentMethod(paymentGateways[0].id);
    }
  }, [paymentGateways]);

  const getMetaValue = (key: string) => {
    if (course?.meta_data && Array.isArray(course.meta_data)) {
      const found = course.meta_data.find((m: any) => m.key === key);
      if (found && found.value !== undefined && found.value !== null && found.value !== '') {
        return found.value;
      }
    }
    return undefined;
  };

  const salePrice =
    course?.sale_price ??
    course?._lp_sale_price ??
    course?._sale_price ??
    course?.meta?._lp_sale_price ??
    getMetaValue("_lp_sale_price") ??
    getMetaValue("_sale_price");

  const regularPrice =
    course?.price ??
    course?.course_price ??
    course?.lp_price ??
    course?._lp_price ??
    course?.regular_price ??
    course?._regular_price ??
    course?.meta?._lp_price ??
    getMetaValue("_lp_price") ??
    getMetaValue("_lp_regular_price");

  const rawSaleNum = salePrice !== undefined && salePrice !== null && salePrice !== ""
    ? (parseFloat(String(salePrice).replace(/[^0-9.]/g, "")) || 0)
    : 0;

  const rawRegNum = regularPrice !== undefined && regularPrice !== null && regularPrice !== ""
    ? (parseFloat(String(regularPrice).replace(/[^0-9.]/g, "")) || 0)
    : 0;

  const priceVal = rawSaleNum > 0 ? rawSaleNum : rawRegNum;
  const originPriceVal = (rawSaleNum > 0 && rawRegNum > rawSaleNum) ? rawRegNum : null;

  const wcCurrencyCode = fieldsConfig?.currency || "VND";
  const wcCurrencySymbol = fieldsConfig?.currency_symbol || (wcCurrencyCode === "VND" ? "₫" : "$");
  const wcCurrencyPos = fieldsConfig?.currency_pos || (wcCurrencyCode === "VND" ? "right_space" : "left");

  const formatPriceWithWc = (val: number) => {
    if (val === 0) return "Free";
    try {
      return new Intl.NumberFormat(wcCurrencyCode === "VND" ? "vi-VN" : "en-US", {
        style: "currency",
        currency: wcCurrencyCode,
        maximumFractionDigits: wcCurrencyCode === "VND" ? 0 : 2,
      }).format(val);
    } catch (_) {
      const numStr = val.toLocaleString();
      if (wcCurrencyPos === "left") return `${wcCurrencySymbol}${numStr}`;
      if (wcCurrencyPos === "left_space") return `${wcCurrencySymbol} ${numStr}`;
      if (wcCurrencyPos === "right") return `${numStr}${wcCurrencySymbol}`;
      return `${numStr} ${wcCurrencySymbol}`;
    }
  };

  const formattedPrice = formatPriceWithWc(priceVal);
  const formattedOriginPrice = originPriceVal ? formatPriceWithWc(originPriceVal) : null;

  const transferContent = `KHOAHOC ${course.id} USER ${user?.id || 0}`;

  // Mã VietQR cho BACS
  const vietQrUrl = `https://img.vietqr.io/image/MB-0987654321-compact.png?amount=${priceVal}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=CONG%20TY%20LMS%20VIET%20NAM`;

  const renderFieldInput = (key: string, field: any) => {
    // Ẩn nếu trường không hoạt động (enabled = false/0) hoặc bị ẩn (hidden = true)
    if (field.hidden === true || field.enabled === false || field.enabled === 0) {
      return null;
    }

    const value = formValues[key] || ((field.type === "country" || key.endsWith("country")) ? "VN" : "");
    const label = field.label || field.placeholder || key;
    const placeholder = field.placeholder || "";
    const required = !!field.required;

    // Phân chia độ rộng grid dựa theo CSS class WooCommerce
    let widthClass = styles.colSpanFull;
    if (field.class && Array.isArray(field.class)) {
      if (field.class.includes("form-row-first") || field.class.includes("form-row-last")) {
        widthClass = styles.colSpanHalf;
      }
    }

    const isSelectType = field.type === "select" || field.type === "country" || field.type === "state";
    const hasOptions = field.options && (
      (typeof field.options === "object" && !Array.isArray(field.options) && Object.keys(field.options).length > 0) ||
      (Array.isArray(field.options) && field.options.length > 0)
    );
    const shouldRenderSelect = isSelectType && (hasOptions || field.type === "country");

    const handleChange = (val: string) => {
      setFormValues(prev => ({ ...prev, [key]: val }));
    };

    return (
      <div key={key} className={`${styles.fieldGroup} ${widthClass}`}>
        <label className={styles.fieldLabel}>
          {label} {required && <span className={styles.requiredStar}>*</span>}
        </label>

        {field.type === "textarea" ? (
          <textarea
            placeholder={placeholder}
            rows={3}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={styles.textarea}
            required={required}
          />
        ) : shouldRenderSelect ? (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={styles.select}
            required={required}
          >
            {field.options && typeof field.options === "object" && !Array.isArray(field.options) ? (
              Object.keys(field.options).map(optKey => (
                <option key={optKey} value={optKey}>
                  {field.options[optKey]}
                </option>
              ))
            ) : Array.isArray(field.options) ? (
              field.options.map((opt: any) => {
                const optVal = typeof opt === "object" ? opt.value : opt;
                const optLbl = typeof opt === "object" ? opt.label : opt;
                return (
                  <option key={optVal} value={optVal}>
                    {optLbl}
                  </option>
                );
              })
            ) : (
              field.type === "country" ? (
                <>
                  <option value="VN">Việt Nam (VN)</option>
                  <option value="US">Hoa Kỳ (US)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="JP">Nhật Bản (JP)</option>
                </>
              ) : (
                <option value="">-- Chọn --</option>
              )
            )}
          </select>
        ) : field.type === "checkbox" ? (
          <label className={styles.checkboxGroup}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(e.target.checked ? "1" : "")}
              className={styles.checkboxInput}
              required={required}
            />
            <span className={styles.checkboxText}>{placeholder || label}</span>
          </label>
        ) : (
          <input
            type={field.type || "text"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={styles.input}
            required={required}
          />
        )}
      </div>
    );
  };

  const hasValidation = (field: any, rule: string) => {
    if (!field.validate) return false;
    if (typeof field.validate === "string") return field.validate === rule;
    if (Array.isArray(field.validate)) return field.validate.includes(rule);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate động dựa theo cấu hình bắt buộc (required) và định dạng (validate) thực tế của WordPress
    const errors: string[] = [];

    const validateFields = (section: any) => {
      if (!section) return;
      Object.keys(section).forEach(key => {
        const field = section[key];
        if (field.hidden === true || field.enabled === false || field.enabled === 0) {
          return;
        }

        let val = (formValues[key] || "").trim();
        const label = field.label || field.placeholder || key;

        // 1. Check required fields
        if (field.required && !val) {
          if (field.type === "country" || key.endsWith("country")) {
            val = "VN";
            formValues[key] = "VN";
          } else {
            errors.push(`Field "${label}" is required and cannot be empty.`);
            return;
          }
        }

        // 2. Check format validation when field is provided
        if (val) {
          if (hasValidation(field, "email") || field.type === "email" || key.endsWith("email")) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
              errors.push(`Field "${label}" must be a valid email address.`);
            }
          }
          if (hasValidation(field, "phone") || field.type === "tel" || key.endsWith("phone")) {
            const cleanPhone = val.replace(/[\s\-\(\)\+]/g, "");
            if (!/^\d{9,11}$/.test(cleanPhone)) {
              errors.push(`Field "${label}" must be a valid phone number (9-11 digits).`);
            }
          }
        }
      });
    };

    validateFields(fieldsConfig?.billing);
    validateFields(fieldsConfig?.additional);

    if (errors.length > 0) {
      alert(`Validation errors occurred:\n\n${errors.join("\n")}`);
      return;
    }

    setLoading(true);

    try {
      const selectedGateway = paymentGateways.find(g => g.id === paymentMethod);
      const paymentTitle = selectedGateway ? selectedGateway.title : (paymentMethod === "bacs" ? "Bank Transfer" : "Cash on Delivery");

      // Trích xuất thuộc tính nguồn truy cập thực tế (Dynamic Order Attribution)
      let urlProductId: string | null = null;
      let attribution = { sourceType: "typein", origin: "Direct", referrer: "", utmSource: "(direct)" };
      if (typeof window !== "undefined") {
        const ref = document.referrer || "";
        const urlParams = new URLSearchParams(window.location.search);
        urlProductId = urlParams.get("product_id") || urlParams.get("productId");
        const utmSource = urlParams.get("utm_source");

        if (utmSource) {
          attribution = { sourceType: "utm", origin: utmSource, referrer: ref, utmSource: utmSource };
        } else if (ref) {
          if (/google|bing|yahoo|duckduckgo|baidu/i.test(ref)) {
            attribution = { sourceType: "organic", origin: "Organic Search", referrer: ref, utmSource: "organic" };
          } else if (/facebook|fb|instagram|zalo|tiktok|youtube|twitter|t.co|linkedin/i.test(ref)) {
            attribution = { sourceType: "social", origin: "Social", referrer: ref, utmSource: "social" };
          } else {
            attribution = { sourceType: "referral", origin: "Referral", referrer: ref, utmSource: "referral" };
          }
        }
      }

      // Send formValues to API
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          productId: urlProductId,
          userId: user.id,
          billing: formValues,
          paymentMethod,
          paymentMethodTitle: paymentTitle,
          note: formValues["order_comments"] || "",
          attribution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error processing order on the system.");
      }

      setLoading(false);
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred while creating order. Please try again.");
      setLoading(false);
    }
  };

  const defaultBillingFields: Record<string, any> = {
    billing_first_name: { type: "text", label: "First name", required: true, class: ["form-row-first"] },
    billing_last_name: { type: "text", label: "Last name", required: true, class: ["form-row-last"] },
    billing_email: { type: "email", label: "Email address", required: true, class: ["form-row-wide"] },
    billing_phone: { type: "tel", label: "Phone", required: false, class: ["form-row-wide"] },
    billing_country: { type: "country", label: "Country / Region", required: true, class: ["form-row-wide"] },
    billing_address_1: { type: "text", label: "Street address", required: true, class: ["form-row-wide"] },
    billing_city: { type: "text", label: "Town / City", required: true, class: ["form-row-wide"] },
    billing_state: { type: "state", label: "State / County", required: true, class: ["form-row-wide"] },
  };

  const selectedGateway = paymentGateways.find(g => g.id === paymentMethod);

  // Lấy các trường đã cấu hình từ prop hoặc dùng mặc định
  const billingFields = (fieldsConfig?.billing && Object.keys(fieldsConfig.billing).length > 0)
    ? fieldsConfig.billing
    : defaultBillingFields;
  const additionalFields = fieldsConfig?.additional || {};

  // Có hiển thị phần Additional không
  const hasActiveAdditional = Object.keys(additionalFields).some(k => {
    const f = additionalFields[k];
    return f.hidden !== true && f.enabled !== false && f.enabled !== 0;
  });

  if (isSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>
          <CircleCheckBig />
        </div>
        <h1 className={styles.successTitle}>
          Course Registration Successful!
        </h1>
        <p className={styles.successText}>
          Thank you for enrolling in <strong dangerouslySetInnerHTML={{ __html: course.title.rendered }} />. The system is verifying your transaction.
        </p>

        <div className={styles.successDetailsBox}>
          <h3 className={styles.successDetailsHeader}>Registration Details:</h3>
          <p className={styles.successDetailItem}>Student: <span>{formValues.billing_first_name} {formValues.billing_last_name}</span></p>
          <p className={styles.successDetailItem}>Email: <span>{formValues.billing_email}</span></p>
          <p className={styles.successDetailItem}>Phone: <span>{formValues.billing_phone}</span></p>
          {formValues.billing_address_1 && (
            <p className={styles.successDetailItem}>Address: <span>{formValues.billing_address_1}{formValues.billing_state ? `, ${formValues.billing_state}` : ""}{formValues.billing_city ? `, ${formValues.billing_city}` : ""}</span></p>
          )}
          <p className={styles.successDetailItem}>Course: <span dangerouslySetInnerHTML={{ __html: course.title.rendered }} /></p>
          <p className={styles.successDetailItem}>Amount: <span className={styles.successAmount}>{formattedPrice}</span></p>
          <p className={styles.successDetailItem}>Method: <span>{selectedGateway ? selectedGateway.title : (paymentMethod === "bacs" ? "Bank Transfer" : "COD")}</span></p>
          <p className={styles.successDetailItem}>Activation Status: <span className={styles.successStatus}>Pending confirmation (5-10 mins)</span></p>
        </div>

        <div className={styles.successActions}>
          <Link
            // href={`/courses/${course.id}`}
            href={`/courses/`}
            className={styles.successBtnPrimary}
          >
            Back to course page
          </Link>
          <Link
            href="/"
            className={styles.successBtnSecondary}
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutGrid}>
      {/* Left Column: Form Fields */}
      <div className={`${styles.formColumn} ${styles.cardSection}`}>
        {/* Section 1: Billing Fields */}
        <div>
          <div>
            <h2 className={styles.sectionTitle}>
              <ReceiptText /> <span>Billing Details</span>
            </h2>
            <div className={styles.fieldsGrid}>
              {Object.keys(billingFields).map(key => renderFieldInput(key, billingFields[key]))}
            </div>
          </div>

          {/* Section 2: Additional Fields */}
          {hasActiveAdditional && (
            <div style={{ marginTop: "1.5rem" }}>
              <h2 className={styles.sectionTitle}>
                <ReceiptText /> <span>Additional Information</span>
              </h2>
              <div className={styles.fieldsGrid}>
                {Object.keys(additionalFields).map(key => renderFieldInput(key, additionalFields[key]))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Order Summary & Payment Method */}
      <div className={styles.summaryColumn}>
        {/* Order Box */}
        <div className={styles.summaryBox}>
          <div>
            <h3 className={styles.sectionTitle}>
              <Receipt /> <span>Order Summary</span>
            </h3>
            <div className={styles.courseItem}>
              <div className={styles.courseBadge}>
                LMS
              </div>
              <div>
                <h4 className={styles.courseName} dangerouslySetInnerHTML={{ __html: course.title.rendered }} />
                <span className={styles.courseMeta}>Course ID: #{course.id}</span>
              </div>
            </div>
            <div className={styles.summaryTotalRow}>
              <span className={styles.totalLabel}>Total Amount:</span>
              <div>
                {formattedOriginPrice && (
                  <span className={styles.priceOriginal}>{formattedOriginPrice}</span>
                )}
                <span className={styles.priceCurrent}>{formattedPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className={styles.cardSection}>
          <div>
            <h2 className={styles.sectionTitle}>
              <CreditCard /> <span>Payment Method</span>
            </h2>

            <div>
              {paymentGateways.length > 0 ? (
                paymentGateways.map((gw: any) => {
                  const isSelected = paymentMethod === gw.id;
                  const subLabel = gw.description || "";

                  return (
                    <div
                      key={gw.id}
                      onClick={() => setPaymentMethod(gw.id)}
                      className={`${styles.paymentOption} ${isSelected ? styles.paymentOptionActive : ""}`}
                    >
                      <div className={`${styles.paymentRadioOuter} ${isSelected ? styles.paymentRadioOuterActive : ""}`}>
                        {isSelected && <div className={styles.paymentRadioInner} />}
                      </div>
                      <div>
                        <span className={styles.paymentTitle}>{gw.title}</span>
                        <span className={styles.paymentDescription}>{subLabel}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  onClick={() => setPaymentMethod("bacs")}
                  className={`${styles.paymentOption} ${styles.paymentOptionActive}`}
                >
                  <div className={`${styles.paymentRadioOuter} ${styles.paymentRadioOuterActive}`}>
                    <div className={styles.paymentRadioInner} />
                  </div>
                  <div>
                    <span className={styles.paymentTitle}>Direct Bank Transfer</span>
                    <span className={styles.paymentDescription}>Scan VietQR code for automatic filling</span>
                  </div>
                </div>
              )}
            </div>

            <ButtonGreen
              type="submit"
              disabled={loading}
              text={loading ? "Processing registration..." : "Confirm & Place Order"}
              showIcon={true}
              className={styles.submitBtn}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
