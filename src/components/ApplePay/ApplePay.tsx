import React, { useEffect, useState } from 'react';
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';

const ApplePay = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Total',
        amount: 100, 
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

  
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (e) => {
      try {
      
        const response = await fetch('https://photodrop-dawn-surf-6942.fly.dev/client/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            paymentMethodType: 'card', 
            currency: 'usd',
            amount: 100, 
          }),
        });

        const { clientSecret, error: backendError } = await response.json();

        if (backendError) {
          console.error('Backend error:', backendError);
          return;
        }


        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: e.paymentMethod.id,
        }, { handleActions: false });

        if (stripeError) {
          console.error('Stripe error:', stripeError);
          return;
        }

    
        if (paymentIntent && paymentIntent.status === 'succeeded') {
          navigate('/success');
        } else {
          console.error('Payment failed or incomplete:', paymentIntent);
        }
      } catch (error) {
        console.error('Payment failed:', error);
      }
    });
  }, [stripe, elements, navigate]);

  return (
    <>
      {paymentRequest && <PaymentRequestButtonElement options={{ paymentRequest }} />}
    </>
  );
};

export default ApplePay;
