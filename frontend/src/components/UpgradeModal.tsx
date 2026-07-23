'use client';

import { useState } from 'react';
import { X, Check, Zap, Crown, Sparkles } from 'lucide-react';

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setIsUpgrading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!orderRes.ok) {
        alert('Failed to initiate Razorpay order.');
        setIsUpgrading(false);
        return;
      }

      const orderData = await orderRes.json();
      const localUserStr = localStorage.getItem('user');
      const localUser = localUserStr ? JSON.parse(localUserStr) : {};

      // If in mock/test mode without real Razorpay keys, activate PRO plan instantly
      if (orderData.isMock) {
        const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isMock: true })
        });

        if (verifyRes.ok) {
          if (localUserStr) {
            localUser.plan = 'PRO';
            localStorage.setItem('user', JSON.stringify(localUser));
          }
          setSuccessMsg('🎉 Test Payment Verified! PRO Plan Lifetime Unlocked.');
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
            window.location.reload();
          }, 1500);
        } else {
          alert('Test payment verification failed.');
        }
        return;
      }

      const options = {
        key: orderData.keyId || 'rzp_test_bulkping99',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BulkPing PRO',
        description: 'Lifetime PRO Plan Upgrade for WhatsApp CRM',
        image: '/logos_cropped.png',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                isMock: orderData.isMock
              })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (localUserStr) {
                localUser.plan = 'PRO';
                localStorage.setItem('user', JSON.stringify(localUser));
              }
              setSuccessMsg('🎉 Razorpay Payment Verified! PRO Plan Lifetime Unlocked.');
              setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
                window.location.reload();
              }, 1500);
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            console.error('Verify error:', err);
            alert('Error verifying payment.');
          } finally {
            setIsUpgrading(false);
          }
        },
        prefill: {
          name: localUser.name || '',
          email: localUser.email || '',
          contact: localUser.phone || ''
        },
        theme: {
          color: '#25D366'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setIsUpgrading(false);
      });
      paymentObject.open();

    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Error connecting to Razorpay payment gateway.');
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-gray-100">

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#111B21] via-[#128C7E] to-[#25D366] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-3">
            <Crown className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            Special Upgrade Offer
          </div>

          <h2 className="text-2xl font-bold">Upgrade to BulkPing PRO</h2>
          <p className="text-white/80 text-sm mt-1">Unlock unlimited bulk messaging and scale your WhatsApp CRM.</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <p className="text-lg font-bold text-gray-900">{successMsg}</p>
            </div>
          ) : (
            <>
              {/* Pricing Box */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Pro Plan Lifetime</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-gray-900">₹99</span>
                    <span className="text-xs text-gray-500 line-through">₹499</span>
                    <span className="text-xs font-semibold text-green-700 ml-1">80% OFF</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">One-time payment • Lifetime access</p>
                </div>
                <Sparkles className="w-8 h-8 text-[#25D366] animate-pulse" />
              </div>

              {/* Feature Comparison */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What's included in PRO:</p>
                <ul className="space-y-2.5 text-sm">
                  {[
                    'Unlimited WhatsApp Bulk Campaigns (No 5-message limit)',
                    'Unlimited WhatsApp Group Contact Extractor',
                    'Media Attachments (Images, Videos, PDF)',
                    'Smart Campaign Batching & Delay Control',
                    'Priority Contact Export & Group Tagging',
                    'Lifetime Support & Updates'
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-green-100 text-[#25D366] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-white font-bold rounded-xl shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2 text-base transition-all transform active:scale-[0.98] disabled:opacity-50"
              >
                <Zap className="w-5 h-5 fill-white" />
                {isUpgrading ? 'Processing Upgrade...' : 'Pay ₹99 & Unlock PRO Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
