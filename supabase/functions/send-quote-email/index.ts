import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendQuoteEmailRequest {
  to: string;
  subject: string;
  body: string;
  quoteId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-quote-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, subject, body, quoteId }: SendQuoteEmailRequest = await req.json();
    console.log("Sending email to:", to, "for quote:", quoteId);

    // Get the quote and PDF from database
    const { data: quote, error: quoteError } = await supabaseClient
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .maybeSingle();

    if (quoteError || !quote) {
      console.error("Quote not found:", quoteError);
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get PDF file from storage if it exists
    let pdfAttachment = null;
    if (quote.pdf_file_path) {
      const { data: pdfData, error: pdfError } = await supabaseClient.storage
        .from('quote-pdfs')
        .download(quote.pdf_file_path);

      if (!pdfError && pdfData) {
        const pdfBuffer = await pdfData.arrayBuffer();
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
        
        pdfAttachment = {
          filename: `Offerte_${quote.quote_number}.pdf`,
          content: pdfBase64,
          content_type: 'application/pdf',
        };
      }
    }

    const emailData: any = {
      from: "Lovable <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: body.replace(/\n/g, '<br>'),
    };

    // Add PDF attachment if available
    if (pdfAttachment) {
      emailData.attachments = [pdfAttachment];
    }

    const emailResponse = await resend.emails.send(emailData);

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update quote status to 'sent'
    await supabaseClient
      .from('quotes')
      .update({ status: 'sent' })
      .eq('id', quoteId);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);