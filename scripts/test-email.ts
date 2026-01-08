import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testEmail() {
    console.log('--- Testing Email Configuration ---');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '******' : 'MISSING');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Missing configuration');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Verified!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email TRG Nexus',
            text: 'If you see this, email sending is working!',
            html: '<b>If you see this, email sending is working!</b>'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);

    } catch (error: any) {
        console.error('❌ Error testing email:', error);
    }
}

testEmail();
