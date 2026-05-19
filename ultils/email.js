import nodemailer from "nodemailer";

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

export const sendResetPasswordOtpEmail = async (to, otp) => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email configuration is missing");
    }

    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    await transporter.sendMail({
    from,
    to,
    subject: "Mã OTP đặt lại mật khẩu - Hello Booking",
    text: `Mã OTP đặt lại mật khẩu Hello Booking của bạn là ${otp}. Mã này có hiệu lực trong 5 phút.`,
    html: `
        <div style="
        margin: 0;
        padding: 0;
        background-color: #f1f5f9;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        ">
        <div style="
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
            border: 1px solid #e2e8f0;
        ">

            <!-- Header -->
            <div style="
            background: linear-gradient(135deg, #1d4ed8, #2563eb);
            padding: 34px 28px;
            text-align: center;
            color: #ffffff;
            ">
            <h1 style="
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            ">
                Hello Booking
            </h1>

            <p style="
                margin: 10px 0 0;
                font-size: 15px;
                color: #dbeafe;
            ">
                Đặt phòng khách sạn nhanh chóng, an toàn và tiện lợi
            </p>
            </div>

            <!-- Body -->
            <div style="padding: 36px 34px;">
            <h2 style="
                margin: 0 0 14px;
                font-size: 24px;
                color: #0f172a;
            ">
                Khôi phục mật khẩu
            </h2>

            <p style="
                margin: 0 0 20px;
                font-size: 15px;
                line-height: 1.7;
                color: #475569;
            ">
                Xin chào, chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại
                <strong>Hello Booking</strong>. Vui lòng sử dụng mã OTP bên dưới để tiếp tục.
            </p>

            <!-- OTP Box -->
            <div style="
                margin: 30px 0;
                padding: 26px 20px;
                background-color: #eff6ff;
                border: 1px solid #bfdbfe;
                border-radius: 16px;
                text-align: center;
            ">
                <p style="
                margin: 0 0 12px;
                font-size: 13px;
                color: #1d4ed8;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                ">
                Mã xác thực OTP
                </p>

                <div style="
                display: inline-block;
                padding: 14px 24px;
                background-color: #ffffff;
                border-radius: 14px;
                border: 1px dashed #1d4ed8;
                font-size: 34px;
                font-weight: 800;
                letter-spacing: 8px;
                color: #1d4ed8;
                ">
                ${otp}
                </div>

                <p style="
                margin: 16px 0 0;
                font-size: 14px;
                color: #dc2626;
                font-weight: 600;
                ">
                Mã OTP có hiệu lực trong 5 phút.
                </p>
            </div>

            <p style="
                margin: 0 0 18px;
                font-size: 14px;
                line-height: 1.7;
                color: #475569;
            ">
                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn sẽ không bị thay đổi.
            </p>

            <div style="
                margin-top: 26px;
                padding: 16px 18px;
                background-color: #f8fafc;
                border-left: 4px solid #1d4ed8;
                border-radius: 10px;
            ">
                <p style="
                margin: 0;
                font-size: 13px;
                line-height: 1.6;
                color: #334155;
                ">
                Vì lý do bảo mật, không chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên hỗ trợ.
                </p>
            </div>
            </div>

            <!-- Footer -->
            <div style="
            padding: 22px 28px;
            background-color: #f8fafc;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            ">
            <p style="
                margin: 0;
                font-size: 13px;
                color: #64748b;
            ">
                © ${new Date().getFullYear()} Hello Booking. All rights reserved.
            </p>

            <p style="
                margin: 8px 0 0;
                font-size: 12px;
                color: #94a3b8;
            ">
                Đây là email tự động, vui lòng không phản hồi email này.
            </p>
            </div>

        </div>
        </div>
    `
    });
};
