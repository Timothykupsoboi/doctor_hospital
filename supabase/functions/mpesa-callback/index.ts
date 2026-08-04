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
    const body = await req.json()
    console.log('M-Pesa Callback Received:', JSON.stringify(body))

    const stkCallback = body.Body.stkCallback
    const checkoutRequestID = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let status = 'failed'
    let mpesaReceiptNumber = null

    if (resultCode === 0) {
      status = 'success'
      const metadata = stkCallback.CallbackMetadata.Item
      const receiptItem = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')
      if (receiptItem) {
        mpesaReceiptNumber = receiptItem.Value
      }
    }

    // Update the transaction in the database
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .update({
        status: status,
        result_description: resultDesc,
        mpesa_receipt_number: mpesaReceiptNumber,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', checkoutRequestID)
      .select()

    if (error) {
      console.error('Error updating transaction:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    // If successful and reference_type is 'invoice', we can also update the invoice directly here
    // to make it even more robust, in case the frontend misses the polling.
    if (status === 'success' && data && data.length > 0) {
      const tx = data[0]
      if (tx.reference_type === 'invoice') {
        // Fetch current invoice to calculate new paid amount
        const { data: invData } = await supabase
          .from('invoices')
          .select('amount_paid, total_amount')
          .eq('id', tx.reference_id)
          .single()

        if (invData) {
          const newPaid = Number(invData.amount_paid) + Number(tx.amount)
          const newStatus = newPaid >= Number(invData.total_amount) ? 'Paid' : 'Partially Paid'

          await supabase
            .from('invoices')
            .update({
              amount_paid: newPaid,
              status: newStatus,
              payment_method: 'M-Pesa'
            })
            .eq('id', tx.reference_id)
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Callback processed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Callback error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
