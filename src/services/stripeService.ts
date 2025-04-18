import { loadStripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const STRIPE_PUBLIC_KEY = 'pk_test_51PH7PV1LCdahk0ySP7Kcm127sOdgOuOKSBNxVuIegQhWgi0AvXL4NupqnQY0wDQPEo38AJi3wV9mrFdAzSLvFGXG00PttU7DHT';
export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface StripeAccountData {
  email: string;
  businessName: string;
  country: string;
  type: 'standard' | 'express' | 'custom';
  businessType: 'individual' | 'company';
  business_profile?: {
    mcc?: string;
    url?: string | null;
    product_description?: string;
  };
  settings?: {
    payments?: {
      statement_descriptor?: string;
    };
  };
  business_profile?: {
    mcc?: string;
    url?: string | null;
    product_description?: string;
  };
  settings?: {
    payments?: {
      statement_descriptor?: string;
    };
  };
}

interface AccountLinkOptions {
  refreshUrl: string;
  returnUrl: string;
  type?: 'account_onboarding' | 'account_update';
}

export async function createStripeAccount(data: StripeAccountData): Promise<string> {
  try {
    // Validate required fields
    if (!data.email?.trim()) throw new Error('Email is required');
    if (!data.businessName?.trim()) throw new Error('Business name is required');

    const functions = getFunctions();
    const createStripeAccountFn = httpsCallable(functions, 'createStripeConnectAccount');
    
    const result = await createStripeAccountFn({
      ...data,
      country: 'FR',
      type: 'standard',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_profile: {
        mcc: '5812', // Restaurant
        url: null,
        product_description: 'Restaurant services'
      },
      settings: {
        payments: {
          statement_descriptor: data.businessName.substring(0, 22)
        }
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: '127.0.0.1' // Will be replaced by Cloud Function
      }
    });

    const { accountId, error } = result.data as { accountId?: string; error?: string };
    if (error) throw new Error(error);
    if (!accountId) throw new Error('No account ID returned');
    
    return accountId;
  } catch (error) {
    console.error('Error creating Stripe account:', error);
    throw error instanceof Error ? error : new Error('Failed to create Stripe account');
  }
}

export async function getStripeAccountLink(accountId: string, options: AccountLinkOptions) {
  try {
    const functions = getFunctions();
    const createAccountLinkFn = httpsCallable(functions, 'createAccountLink');
    
    const result = await createAccountLinkFn({
      accountId,
      type: options.type || 'account_onboarding',
      ...options
    });
    
    return result.data as { url: string };
  } catch (error) {
    console.error('Error getting account link:', error);
    throw new Error('Failed to get Stripe onboarding link');
  }
}

export async function checkStripeAccountStatus(accountId: string) {
  try {
    const functions = getFunctions();
    const checkAccountStatusFn = httpsCallable(functions, 'checkStripeAccountStatus');
    
    const result = await checkAccountStatusFn({ accountId });
    return result.data as {
      isComplete: boolean;
      missingRequirements: string[];
    };
  } catch (error) {
    console.error('Error checking account status:', error);
    throw new Error('Failed to check Stripe account status');
  }
}