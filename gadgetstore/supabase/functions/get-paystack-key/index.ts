const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const paystackKey = Deno.env.get('PAYSTACK_PUBLIC_KEY');

  return new Response(
    JSON.stringify({ key: paystackKey || '' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
