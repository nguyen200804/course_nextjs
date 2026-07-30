"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CheckoutClientProps {
  course: any;
  user: any;
  customer?: any;
  fieldsConfig?: {
    billing?: Record<string, any>;
    shipping?: Record<string, any>;
    additional?: Record<string, any>;
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

  const priceVal = course.course_price ? Number(course.course_price) : 0;
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(priceVal);

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
    let widthClass = "col-span-full";
    if (field.class && Array.isArray(field.class)) {
      if (field.class.includes("form-row-first")) {
        widthClass = "col-span-full sm:col-span-1";
      } else if (field.class.includes("form-row-last")) {
        widthClass = "col-span-full sm:col-span-1";
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
      <div key={key} className={widthClass}>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {field.type === "textarea" ? (
          <textarea
            placeholder={placeholder}
            rows={3}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
            required={required}
          />
        ) : shouldRenderSelect ? (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 transition-colors"
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
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(e.target.checked ? "1" : "")}
              className="h-5 w-5 rounded border border-slate-800 bg-slate-950/50 text-purple-600 focus:ring-0 cursor-pointer"
              required={required}
            />
            <span className="text-sm text-slate-300">{placeholder || label}</span>
          </label>
        ) : (
          <input
            type={field.type || "text"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
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
        
        // 1. Kiểm tra trường bắt buộc (Required)
        if (field.required && !val) {
          if (field.type === "country" || key.endsWith("country")) {
            val = "VN";
            formValues[key] = "VN";
          } else {
            errors.push(`Trường "${label}" là bắt buộc và không được để trống.`);
            return;
          }
        }

        // 2. Kiểm tra định dạng (Validations) khi có dữ liệu điền vào
        if (val) {
          if (hasValidation(field, "email") || field.type === "email" || key.endsWith("email")) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
              errors.push(`Trường "${label}" phải đúng định dạng email.`);
            }
          }
          if (hasValidation(field, "phone") || field.type === "tel" || key.endsWith("phone")) {
            const cleanPhone = val.replace(/[\s\-\(\)\+]/g, "");
            if (!/^\d{9,11}$/.test(cleanPhone)) {
              errors.push(`Trường "${label}" phải đúng định dạng số điện thoại (9-11 chữ số).`);
            }
          }
        }
      });
    };

    validateFields(fieldsConfig?.billing);
    validateFields(fieldsConfig?.additional);

    if (errors.length > 0) {
      alert(`Đã xảy ra lỗi kiểm tra dữ liệu:\n\n${errors.join("\n")}`);
      return;
    }
    
    setLoading(true);

    try {
      const selectedGateway = paymentGateways.find(g => g.id === paymentMethod);
      const paymentTitle = selectedGateway ? selectedGateway.title : (paymentMethod === "bacs" ? "Chuyển khoản ngân hàng" : "Thanh toán COD");

      // Gửi toàn bộ formValues (chứa billing và additional) lên API xử lý
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          userId: user.id,
          billing: formValues, 
          paymentMethod,
          paymentMethodTitle: paymentTitle,
          note: formValues["order_comments"] || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Lỗi khi xử lý đơn hàng trên hệ thống.");
      }

      setLoading(false);
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Đã xảy ra lỗi khi tạo đơn hàng thanh toán. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const selectedGateway = paymentGateways.find(g => g.id === paymentMethod);

  // Lấy các trường đã cấu hình từ prop hoặc dùng mặc định
  const billingFields = fieldsConfig?.billing || {};
  const additionalFields = fieldsConfig?.additional || {};

  // Có hiển thị phần Additional không
  const hasActiveAdditional = Object.keys(additionalFields).some(k => {
    const f = additionalFields[k];
    return f.hidden !== true && f.enabled !== false && f.enabled !== 0;
  });

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-6 text-3xl animate-bounce">
          ✓
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-200 to-green-400 bg-clip-text text-transparent">
          Đăng ký khóa học thành công!
        </h1>
        <p className="text-slate-300 mb-6 text-sm leading-relaxed max-w-md mx-auto">
          Cảm ơn bạn đã đăng ký khóa học <strong className="text-white" dangerouslySetInnerHTML={{ __html: course.title.rendered }} />. Hệ thống đang xác thực giao dịch chuyển khoản của bạn.
        </p>

        <div className="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 text-left mb-8 max-w-md mx-auto space-y-3">
          <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2 mb-2">Thông tin đăng ký:</h3>
          <p className="text-xs text-slate-400">Học viên: <span className="text-white font-medium">{formValues.billing_first_name} {formValues.billing_last_name}</span></p>
          <p className="text-xs text-slate-400">Email: <span className="text-white font-medium">{formValues.billing_email}</span></p>
          <p className="text-xs text-slate-400">Số điện thoại: <span className="text-white font-medium">{formValues.billing_phone}</span></p>
          {formValues.billing_address_1 && (
            <p className="text-xs text-slate-400">Địa chỉ: <span className="text-white font-medium">{formValues.billing_address_1}{formValues.billing_state ? `, ${formValues.billing_state}` : ""}{formValues.billing_city ? `, ${formValues.billing_city}` : ""}</span></p>
          )}
          <p className="text-xs text-slate-400">Khóa học: <span className="text-white font-medium" dangerouslySetInnerHTML={{ __html: course.title.rendered }} /></p>
          <p className="text-xs text-slate-400">Số tiền: <span className="text-emerald-400 font-bold">{formattedPrice}</span></p>
          <p className="text-xs text-slate-400">Phương thức: <span className="text-slate-300">{selectedGateway ? selectedGateway.title : (paymentMethod === "bacs" ? "Chuyển khoản ngân hàng" : "COD")}</span></p>
          <p className="text-xs text-slate-400">Trạng thái kích hoạt: <span className="text-amber-400 font-semibold">Chờ xác nhận (5-10 phút)</span></p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href={`/courses/${course.id}`}
            className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-xs font-bold text-white transition-all cursor-pointer"
          >
            Quay lại trang khóa học
          </Link>
          <Link
            href="/"
            className="h-11 px-6 rounded-xl border border-slate-800 hover:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
      {/* Cột trái: Form thông tin thanh toán động */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
        
        {/* Phần 1: Billing Fields */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-slate-800/80 pb-4 flex items-center gap-2">
            ✍ Thông tin thanh toán (Billing Fields)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(billingFields).map(key => renderFieldInput(key, billingFields[key]))}
          </div>
        </div>

        {/* Phần 3: Additional Fields (Chỉ hiển thị nếu có trường hoạt động) */}
        {hasActiveAdditional && (
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-bold text-white border-b border-slate-800/80 pb-4 flex items-center gap-2">
              📝 Thông tin bổ sung (Additional Fields)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(additionalFields).map(key => renderFieldInput(key, additionalFields[key]))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-white border-b border-slate-800/80 pb-4 pt-4">
          💳 Phương thức thanh toán (Đồng bộ WooCommerce)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paymentGateways.length > 0 ? (
            paymentGateways.map((gw: any) => {
              const isSelected = paymentMethod === gw.id;
              
              const subLabel = gw.description || "";
              
              return (
                <div
                  key={gw.id}
                  onClick={() => setPaymentMethod(gw.id)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? "bg-purple-950/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/5 border-purple-500"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-purple-500" : "border-slate-800"
                  }`}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{gw.title}</span>
                    <span className="text-[10px] text-slate-500">{subLabel}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              onClick={() => setPaymentMethod("bacs")}
              className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3 bg-purple-950/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/5`}
            >
              <div className="h-5 w-5 rounded-full border border-purple-500 flex items-center justify-center shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              </div>
              <div>
                <span className="text-sm font-bold block">Chuyển khoản Ngân hàng</span>
                <span className="text-[10px] text-slate-500">Quét mã VietQR tự động điền</span>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-850 flex items-center justify-center text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
        >
          {loading ? "Đang xử lý đăng ký..." : "Xác nhận và hoàn thành đơn hàng"}
        </button>
      </form>

      {/* Cột phải: Thông tin đơn hàng & Thanh toán chuyển khoản */}
      <div className="lg:col-span-5 space-y-6">
        {/* Hộp đơn hàng */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🛍 Khóa học đăng ký
          </h3>
          <div className="flex gap-4 items-start pb-4 border-b border-slate-800">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
              LMS
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: course.title.rendered }} />
              <span className="text-[10px] text-slate-500 block font-mono mt-1">ID Khóa học: #{course.id}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <span className="text-sm text-slate-400">Tổng thanh toán:</span>
            <span className="text-xl font-black text-emerald-400">{formattedPrice}</span>
          </div>
        </div>

        {/* Hộp hướng dẫn chuyển tiền theo cổng thanh toán đã chọn */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            💸 Hướng dẫn thanh toán
          </h3>

          {paymentMethod === "bacs" ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-400 leading-relaxed text-left">
                Vui lòng mở ứng dụng ngân hàng quét mã QR dưới đây hoặc chuyển khoản theo thông tin chi tiết:
              </p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto">
                <img
                  src={vietQrUrl}
                  alt="VietQR MBBank"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="text-slate-200 font-bold">MB Bank (Quân Đội)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="text-white font-mono font-bold select-all">0987654321</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="text-slate-200 font-bold">CONG TY LMS VIET NAM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền:</span>
                  <span className="text-emerald-400 font-bold">{formattedPrice}</span>
                </div>
                <div className="flex flex-col gap-1 border-t border-slate-900 pt-2 mt-1">
                  <span className="text-slate-500">Nội dung chuyển khoản chính xác:</span>
                  <span className="text-purple-400 font-mono font-bold bg-slate-900/80 px-2.5 py-1 rounded text-center select-all border border-purple-500/20">
                    {transferContent}
                  </span>
                </div>
              </div>
            </div>
          ) : paymentMethod === "cod" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Bạn đã chọn phương thức thanh toán tại nhà / thanh toán sau (COD).
              </p>

              <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black mx-auto text-xl">
                  📦
                </div>
                <div className="text-xs font-bold text-white">Cash on Delivery (COD)</div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Hệ thống sẽ tạo đơn hàng chờ duyệt trên WordPress. Khóa học sẽ tự động được kích hoạt sau khi quản trị viên xác nhận thông tin thanh toán ngoại tuyến của bạn.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Vui lòng thanh toán theo hướng dẫn của cổng thanh toán đã chọn:
              </p>

              <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 text-xs text-left space-y-3">
                <div className="font-bold text-white text-sm">
                  {selectedGateway ? selectedGateway.title : "Phương thức khác"}
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedGateway?.description || "Vui lòng hoàn thành thanh toán ngoại tuyến để kích hoạt khóa học."}
                </p>
                <div className="flex justify-between border-t border-slate-900 pt-2.5 mt-2">
                  <span className="text-slate-500">Số tiền cần thanh toán:</span>
                  <span className="text-emerald-400 font-bold">{formattedPrice}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
