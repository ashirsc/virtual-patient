import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: to,
        subject: subject,
        html: html
    });
    return response;
}

