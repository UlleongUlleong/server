export const emailCodeTemplate = (code: string) => `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>이메일 인증</title>
  </head>
  <body style="margin: 0; padding: 20px; background-color: #f4f4f4; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 4px;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
              <h1 style="margin: 0; color: #333333;">술렁술렁 이메일 인증</h1>
          </div>
          
          <div style="text-align: center;">
              <p style="margin: 10px 0;">안녕하세요!</p>
              <p style="margin: 10px 0;">아래의 인증 코드를 입력해주세요.</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #2c3e50; background-color: #f8f9fa; padding: 15px; margin: 20px 0;">${code}</div>
              <p style="margin: 10px 0; color: #666666; font-size: 14px;">※ 본 인증 코드는 10분 동안 유효합니다.</p>
              <p style="margin: 10px 0; color: #666666; font-size: 14px;">※ 본인이 요청하지 않은 경우 이 메일을 무시하시기 바랍니다.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999999; font-size: 12px;">
              <p style="margin: 5px 0;">본 메일은 발신 전용이며, 회신하실 수 없습니다.</p>
              <p style="margin: 5px 0;">© 2025 술렁술렁. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;
