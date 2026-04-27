import axios from "axios";
import { config } from "../config/index";

type ChapaInitializationInput = {
  tx_ref: string;
  amount: number;
  escrow_id: string;
  customCallbackUrl?: string;
  returnUrlBase?: string;
};

export const initializePayment = async (input: ChapaInitializationInput): Promise<{ checkout_url: string } | null> => {
  const { tx_ref, amount, escrow_id, customCallbackUrl, returnUrlBase } = input;

  if (!tx_ref || !amount || !escrow_id) {
    console.error("Missing Required fields for Chapa initialization");
    return null;
  }

  const callbackUrl = customCallbackUrl || config.customCallbackUrl;
  const returnUrl = returnUrlBase || `${config.frontendUrl}/fund-escrow`;

  const reqBody = {
    amount: amount.toString(),
    tx_ref,
    currency: "ETB",
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: "Escrow Funding",
    },
    meta: {
      escrow_id,
    },
  };

  console.log("Chapa Initialization Request:", JSON.stringify(reqBody, null, 2));

  try {
    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      reqBody,
      {
        headers: {
          Authorization: `Bearer ${config.chapaSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Chapa Init Response:", response.data);

    return {
      checkout_url: response.data.data.checkout_url,
    };
  } catch (error: any) {
    console.error("❌ Chapa Initialization failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
};

export const verifyPayment = async (tx_ref: string): Promise<any> => {
  if (!tx_ref) {
    console.error("Missing tx_ref for verification");
    return null;
  }

  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${config.chapaSecretKey}`,
        },
      }
    );

    console.log("Chapa Verify Response:", JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error("❌ Chapa Verification failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
    return null;
  }
};