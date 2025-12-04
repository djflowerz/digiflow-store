import { supabase, isSupabaseConfigured } from './supabaseClient';
import { MPESA_TILL_NUMBER } from '../constants';

/* 
  =============================================================================
  INSTRUCTIONS FOR REAL M-PESA PAYMENTS (SUPABASE EDGE FUNCTION)
  =============================================================================
  To enable real M-Pesa STK Pushes, you must deploy an Edge Function named 'mpesa-payment'.
  
  SECURITY NOTICE:
  Never hardcode your Consumer Key, Secret, or Passkey in this frontend code.
  
  1. Go to Supabase Dashboard > Edge Functions.
  2. Set the following Secrets (Environment Variables) for your function:
     - MPESA_CONSUMER_KEY: <Your Live/Sandbox Consumer Key>
     - MPESA_CONSUMER_SECRET: <Your Live/Sandbox Consumer Secret>
     - MPESA_PASSKEY: <Your Live/Sandbox Passkey>
     - MPESA_TILL_NUMBER: <Your Paybill/Till>
  
  The frontend below sends ONLY the necessary transaction details (Phone, Amount).
  Authentication happens entirely on the secure backend.
*/

interface MpesaPaymentParams {
  phoneNumber: string;
  amount: number;
  accountReference: string; // Order ID
}

interface MpesaResponse {
  success: boolean;
  message: string;
  checkoutRequestID?: string;
}

/**
 * Simulates an STK Push for testing or when backend is unavailable.
 */
const simulateSTKPush = async ({ phoneNumber, amount }: MpesaPaymentParams): Promise<MpesaResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'STK Push sent! Check your phone to enter PIN.',
        checkoutRequestID: `ws_CO_${Date.now()}_${phoneNumber.replace('+', '')}`
      });
    }, 2000); 
  });
};

/**
 * Initiates an STK Push by calling the Supabase Edge Function.
 */
export const initiateSTKPush = async ({ phoneNumber, amount, accountReference }: MpesaPaymentParams): Promise<MpesaResponse> => {
  // Security: Redact phone number in logs
  const redactedPhone = phoneNumber.replace(/.(?=.{4})/g, '*');
  console.log("Initiating Secure Payment for:", redactedPhone, "Amount:", amount);

  // 1. Format phone number (Ensure 254...)
  let formattedPhone = phoneNumber.replace(/\D/g, ''); 
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
  if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;

  if (isSupabaseConfigured()) {
    try {
      // We do NOT send keys in the body. The backend pulls them from secure env vars.
      const { data, error } = await supabase!.functions.invoke('mpesa-payment', {
        body: {
          phoneNumber: formattedPhone,
          amount,
          accountReference,
          // We only send the Till Number if it differs dynamically, otherwise backend should hold the default.
          tillNumber: MPESA_TILL_NUMBER 
        },
      });

      if (error) {
          console.error("Payment Gateway Error"); // Do not log full error object to console to avoid leaking stack traces
          return {
              success: false,
              message: "Connection to payment provider failed. Please try again."
          };
      }

      if (data && data.ResponseCode === "0") {
         return {
            success: true,
            message: 'STK Push sent! Check your phone to enter PIN.',
            checkoutRequestID: data.CheckoutRequestID
         };
      } else {
         return {
            success: false,
            message: data?.errorMessage || 'Payment initialization failed.'
         };
      }

    } catch (error: any) {
      console.error("Network Error during payment");
      return {
          success: false,
          message: "Network connection error."
      };
    }
  } else {
    // Fallback only if no backend configured (Dev Mode)
    return simulateSTKPush({ phoneNumber: formattedPhone, amount, accountReference });
  }
};