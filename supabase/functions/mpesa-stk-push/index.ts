import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount, reference_id, reference_type } = await req.json()

    // Validate input
    if (!phone || !amount || !reference_id || !reference_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Format phone number to 2547XXXXXXXX or 2541XXXXXXXX
    let formattedPhone = phone.trim().replace(/\+/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone
    }

    // Get Safaricom credentials from environment variables
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const shortcode = Deno.env.get('MPESA_SHORTCODE')
    const passkey = Deno.env.get('MPESA_PASSKEY')
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL')

    if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackUrl) {
      return new Response(JSON.stringify({ error: 'M-Pesa credentials not configured in Edge Functions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 1. Get Access Token
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })
    
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text()
      throw new Error(`Failed to get access token: ${errorText}`)
    }
    
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // 2. Prepare STK Push payload
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `REF-${reference_id}`,
      TransactionDesc: `Payment for ${reference_type}`
    }

    // 3. Initiate STK Push
    const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPayload)
    })

    const stkData = await stkRes.json()

    if (stkData.ResponseCode !== "0") {
      return new Response(JSON.stringify({ error: stkData.ResponseDescription || 'STK Push failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 4. Save the transaction to the database
    // We initialize Supabase client inside the function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Store the CheckoutRequestID mapped to the reference
    const { error: dbError } = await supabase
      .from('mpesa_transactions')
      .insert({
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
        reference_id: reference_id,
        reference_type: reference_type,
        amount: amount,
        phone: formattedPhone,
        status: 'pending'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // We still return success for the STK push, but log the error
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'STK Push initiated successfully',
      checkout_request_id: stkData.CheckoutRequestID
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
