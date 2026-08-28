import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Bus-specific failure classification logic.
 * Takes a TicketSession document, returns { failureReason, suggestedAction, contextNote }
 */
export const classifyBusFailure = (session) => {
  const { vehicleSpeed, passengerLoad, providerStatus, upiStatus } = session;

  // Network handoff: fast-moving bus caused tower switch dropout
  if (vehicleSpeed > 40 && providerStatus && providerStatus.includes('timeout')) {
    return {
      failureReason: 'network_handoff',
      suggestedAction: 'retry_at_stop',
      contextNote: 'Bus moving fast — tower switch caused dropout',
    };
  }

  // Peak load: overcrowded bus during rush hour server congestion
  if (passengerLoad === 'overcrowded' && providerStatus && providerStatus.includes('timeout')) {
    return {
      failureReason: 'peak_load',
      suggestedAction: 'retry_upi',
      contextNote: 'Peak hour server congestion',
    };
  }

  // Insufficient funds
  if (providerStatus && providerStatus.includes('funds')) {
    return {
      failureReason: 'insufficient_funds',
      suggestedAction: 'pay_cash',
      contextNote: 'Passenger low balance',
    };
  }

  // User cancelled payment
  if (upiStatus === 'cancelled') {
    return {
      failureReason: 'user_cancelled',
      suggestedAction: 'retry_upi',
      contextNote: 'Passenger cancelled',
    };
  }

  // Payment link expired
  if (upiStatus === 'expired') {
    return {
      failureReason: 'timeout',
      suggestedAction: 'retry_upi',
      contextNote: 'Payment link expired',
    };
  }

  // Payment succeeded but conductor ticket failed due to machine restart
  if (upiStatus === 'payment_success_ticket_failed') {
    return {
      failureReason: 'webhook_dropout',
      suggestedAction: 'generate_ticket',
      contextNote: 'Payment received but ticket not issued due to conductor machine restart',
    };
  }

  // Default
  return {
    failureReason: 'unknown',
    suggestedAction: 'retry_upi',
    contextNote: 'Unknown failure',
  };
};

/**
 * Generates a personalised recovery message via Gemini 1.5 Flash.
 */
export const generateRecoveryMessage = async ({
  amount,
  busNumber,
  routeFrom,
  routeTo,
  failureReason,
  suggestedAction,
  language,
}) => {
  const baseContext = `A passenger's UPI payment of ₹${amount} on bus ${busNumber} route ${routeFrom} to ${routeTo} failed. Failure reason: ${failureReason}. Suggested action: ${suggestedAction}.`;

  let languageInstruction = '';
  if (language === 'hinglish') {
    languageInstruction = `You are a helpful assistant for Tamil Nadu government bus service (TNSTC).
${baseContext}
Write a short, friendly WhatsApp message in Hinglish (natural mix of Hindi and English like Indians actually text).
Example style: 'Aapka ticket payment nahi hua. Kya aap dobara try kar sakte hain?'
Rules: 2-3 sentences max. Mention bus number and amount. Warm tone, not pushy. No emojis. Plain text only.
Return ONLY the message.`;
  } else if (language === 'tamil') {
    languageInstruction = `You are a helpful assistant for Tamil Nadu government bus service (TNSTC).
${baseContext}
Write the message in Tamil script. Warm, friendly tone. 2-3 sentences. Mention bus number and amount. No emojis. Plain text only.
Return ONLY the message.`;
  } else {
    languageInstruction = `You are a helpful assistant for Tamil Nadu government bus service (TNSTC).
${baseContext}
Write in clear, polite English. 2-3 sentences. Mention bus number and amount. Not pushy. No emojis. Plain text only.
Return ONLY the message.`;
  }

  const fallbacks = {
    hinglish: `Bus ${busNumber} mein aapka ₹${amount} ka UPI payment fail ho gaya. Kya aap dobara try kar sakte hain? Agar nahi hua toh cash payment bhi kar sakte hain.`,
    tamil: `Bus ${busNumber}-ல் உங்கள் ₹${amount} UPI கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும் அல்லது பணமாகவும் செலுத்தலாம்.`,
    english: `Your UPI payment of ₹${amount} on bus ${busNumber} (${routeFrom} to ${routeTo}) could not be processed. Please try again or pay in cash. Thank you for your understanding.`,
  };

  // Fallback if no API key configured
  if (!GEMINI_API_KEY) {
    return fallbacks[language] || fallbacks.hinglish;
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: languageInstruction }] }],
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}, using template fallback.`);
      return fallbacks[language] || fallbacks.hinglish;
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return text.trim();
  } catch (err) {
    console.warn('Gemini API fetch error, using template fallback:', err.message);
    return fallbacks[language] || fallbacks.hinglish;
  }
};
