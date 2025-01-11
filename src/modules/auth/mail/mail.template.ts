export const emailTemplate = (code: string) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>이메일 인증</title>
    <style>
        body {
            font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
        }
        .content {
            padding: 30px 20px;
            text-align: center;
        }
        .verification-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #2c3e50;
            background-color: #f8f9fa;
            padding: 15px 30px;
            margin: 20px 0;
            border-radius: 4px;
            display: inline-block;
        }
        .note {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>술렁술렁 이메일 인증</h1>
        </div>
        <div class="content">
            <p>안녕하세요!</p>
            <p>아래의 인증 코드를 입력해주세요.</p>
            <div class="verification-code">${code}</div>
            <p class="note">※ 본 인증 코드는 10분 동안 유효합니다.</p>
            <p class="note">※ 본인이 요청하지 않은 경우 이 메일을 무시하시기 바랍니다.</p>
        </div>
        <div class="footer">
            <p>본 메일은 발신 전용이며, 회신하실 수 없습니다.</p>
            <p>© 2025 술렁술렁. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
