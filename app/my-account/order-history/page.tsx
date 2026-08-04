import HeadingSectionText from "@/components/common/HeadingSectionText";
import LoggedInAccount from "@/components/my-account/LoggedInAccount";

export default function OrderHistoryPage() {
    return (
        <main>
            <HeadingSectionText title="My Account" />
            <LoggedInAccount>
                <div style={{ padding: '28px', background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: 700, color: '#1e2445' }}>
                        Order History
                    </h2>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
                        Your payment history and course purchase invoices will be displayed here.
                    </p>
                </div>
            </LoggedInAccount>
        </main>
    );
}
